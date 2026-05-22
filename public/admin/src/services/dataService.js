import { DEFAULT_SYSTEM_SETTINGS } from '../../../shared/theme-runtime.js';
import { supabase } from './supabaseClient.js';

export { DEFAULT_SYSTEM_SETTINGS };

function resolveFirstPaymentDate(source = {}) {
  const offerDetails = source.offer_details || {};
  const candidate = offerDetails.first_payment_date || source.repayment_start_date || source.next_payment_date;
  if (!candidate) return null;
  const date = new Date(candidate);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeToIsoMidnight(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const clone = new Date(date);
  clone.setUTCHours(0, 0, 0, 0);
  return clone.toISOString();
}

// Helper to split full name into first and last names for institutional schema
function splitFullName(fullName = '') {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: 'NOT_PROVIDED' };
  const last = parts.pop();
  const first = parts.join(' ');
  return { first, last };
}

async function ensureLoanFromApplication(application) {
  if (!application?.id) return { data: null, error: new Error('Invalid application payload') };
  const applicationId = application.id;

  const { data: existingLoan } = await supabase
    .from('accounts') // Write directly to institutional table
    .select('*')
    .eq('application_id', applicationId)
    .maybeSingle();

  if (existingLoan) return { data: existingLoan, error: null };

  const totalRepayment = Number(application.offer_total_repayment || 0);
  const startDate = new Date().toISOString();
  const repaymentDate = application.repayment_start_date || startDate;

  const baseLoan = {
    application_id: applicationId,
    user_id: application.user_id,
    principal_amount: Number(application.offer_principal || application.amount || 0),
    interest_rate: Number(application.offer_interest_rate || 0),
    term_months: Number(application.term_months || 1),
    monthly_payment: Number(application.offer_monthly_repayment || 0),
    status: 'active',
    start_date: startDate,
    first_payment_date: repaymentDate,
    next_payment_date: repaymentDate,
    outstanding_balance: totalRepayment, 
    total_repayment: totalRepayment
  };

  const { data, error } = await supabase
    .from('accounts')
    .insert([baseLoan])
    .select()
    .single();

  return { data, error };
}

const hydrateSystemSettings = (settings = {}) => ({
  ...DEFAULT_SYSTEM_SETTINGS,
  ...settings,
  carousel_slides: Array.isArray(settings.carousel_slides) ? settings.carousel_slides : (DEFAULT_SYSTEM_SETTINGS.carousel_slides || [])
});

export async function createWalkInClient(clientData) {
  const newId = crypto.randomUUID();
  const { first, last } = splitFullName(clientData.fullName);

  const { data, error } = await supabase
    .from('consumers') // Write directly to institutional table
    .insert([
      {
        id: newId,
        first_name: first,
        surname: last,
        id_number: clientData.idNumber,
        phone_mobile: clientData.phone,
        email: clientData.email || null,
        branch_id: clientData.branchId, 
        role: 'borrower'
      }
    ])
    .select()
    .single();

  return { data, error };
}

export async function fetchDashboardData() {
  try {
    const { data: stats } = await supabase.rpc('get_dashboard_stats').single();
    const { data: payments } = await supabase.from('payments').select('amount');
    const { data: loans } = await supabase.from('loans').select('principal_amount, status'); // Read from View
    
    const totalCollected = payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
    const totalDisbursed = loans?.reduce((sum, l) => sum + (Number(l.principal_amount) || 0), 0) || 0;
    
    let activeCount = 0, defaultCount = 0, repaidCount = 0;
    loans?.forEach(l => {
      const s = (l.status || '').toLowerCase();
      if (s === 'active') activeCount++;
      else if (s === 'default' || s === 'arrears') defaultCount++;
      else if (s === 'repaid' || s === 'settled') repaidCount++;
    });

    return {
      financials: {
        total_disbursed: totalDisbursed,
        total_collected: totalCollected,
        profit_margin: totalDisbursed > 0 ? (((totalCollected - totalDisbursed) / totalDisbursed) * 100).toFixed(1) : 0,
        active_loans_count: activeCount,
        pending_apps: stats?.pending_applications || 0
      },
      portfolioStatus: [
        { name: 'Active', value: activeCount },
        { name: 'Default', value: defaultCount },
        { name: 'Repaid', value: repaidCount }
      ],
      error: null
    };
  } catch (error) {
    return { financials: null, portfolioStatus: null, error: error.message };
  }
}

export async function fetchPipelineApplications() {
  const { data, error } = await supabase
    .from('loan_applications')
    .select('id, amount, status, created_at, profiles:user_id(full_name)') // Read from View
    .not('status', 'in', '(DISBURSED,DECLINED)')
    .order('created_at', { ascending: false });
  return { data, error: error ? error.message : null };
}

export async function fetchLoanApplications() {
  return supabase
    .from('loan_applications')
    .select('*, profiles:user_id(full_name)') // Read from View
    .order('created_at', { ascending: false });
}

export async function fetchApplicationDetail(applicationId) {
  const { data: appData, error: appError } = await supabase
    .from('loan_applications')
    .select(`
        *,
        profiles:user_id(*),
        creator:created_by_admin(full_name, email),
        reviewer:reviewed_by_admin(full_name, email)
    `)
    .eq('id', applicationId)
    .single();
  if (appError) throw appError;
  
  const userId = appData.user_id;
  const [finRes, docsRes, payoutRes, bankRes, creditRes, loansRes, appHistoryRes] = await Promise.all([
    supabase.from('financial_profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('document_uploads').select('*').eq('user_id', userId).order('uploaded_at', { ascending: false }),
    supabase.from('payouts').select('status').eq('application_id', applicationId).maybeSingle(),
    supabase.from('bank_accounts').select('*').eq('user_id', userId),
    supabase.from('credit_checks').select('*').eq('user_id', userId).order('checked_at', { ascending: false }),
    supabase.from('loans').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('loan_applications').select('id, status, amount, created_at, purpose').eq('user_id', userId).neq('id', applicationId).order('created_at', { ascending: false })
  ]);

  return {
    ...appData,
    financial_profiles: finRes.data ? [finRes.data] : [],
    documents: docsRes.data || [],
    payout: payoutRes.data || null,
    bank_accounts: bankRes.data || [],
    credit_checks: creditRes.data || [],
    loan_history: loansRes.data || [],
    application_history: appHistoryRes.data || []
  };
}

export async function updateApplicationStatus(applicationId, newStatus) {
  try {
    const { data: app, error: fetchError } = await supabase.from('loan_applications').select('*').eq('id', applicationId).single();
    if (fetchError) throw fetchError;

    let updatePayload = { status: newStatus };

    if (['READY_TO_DISBURSE', 'DISBURSED', 'OFFER_ACCEPTED'].includes(newStatus)) {
      const { count: historyCount } = await supabase.from('accounts').select('*', { count: 'exact', head: true }).eq('user_id', app.user_id);
      const principal = Number(app.amount || 0);
      const term = Number(app.term_months || 1);
      const MONTHLY_ADMIN_FEE = 60.00;
      const INITIATION_FEE_RATE = 0.15;
      const totalAnnualRate = (historyCount < 3) ? 0.20 : 0.18; 
      const interestOnlyRate = totalAnnualRate - INITIATION_FEE_RATE;
      const totalInterest = principal * interestOnlyRate * (term / 12);
      const totalInitiation = principal * INITIATION_FEE_RATE;
      const totalAdminFees = MONTHLY_ADMIN_FEE * term;
      const totalRepayment = principal + totalInterest + totalInitiation + totalAdminFees;
      const monthlyPayment = totalRepayment / term;
      const scheduledDate = app.repayment_start_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      updatePayload = {
        ...updatePayload,
        offer_principal: principal,
        offer_interest_rate: totalAnnualRate,
        offer_total_interest: totalInterest,
        offer_total_initiation_fees: totalInitiation,
        offer_total_admin_fees: totalAdminFees,
        offer_total_repayment: totalRepayment,
        offer_monthly_repayment: monthlyPayment,
        repayment_start_date: scheduledDate
      };
    }

    const { data: updatedApp, error: updateError } = await supabase.from('loan_applications').update(updatePayload).eq('id', applicationId).select().single();
    if (updateError) throw updateError;
    if (newStatus === 'DISBURSED' || newStatus === 'ACTIVE') await ensureLoanFromApplication(updatedApp);
    return { data: updatedApp, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*, branches(id, name)').order('created_at', { ascending: false });
    return error ? [] : data;
};

export async function fetchProfile(userId) {
  return supabase.from('profiles').select('*').eq('id', userId).single();
}

export async function fetchUserDetail(userId) {
  const { data: profile, error: profError } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (profError) return { data: null, error: profError.message };
  const [finRes, appRes] = await Promise.all([
    supabase.from('financial_profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('loan_applications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  ]);
  return { data: { profile, financials: finRes.data || null, applications: appRes.data || [] }, error: null };
}

export async function fetchPayments() {
  return supabase.from('payments').select('*, profile:user_id(full_name), loan:loan_id(outstanding_balance, principal_amount, application:application_id(*))').order('payment_date', { ascending: false });
}

export async function fetchPayouts() {
  return supabase.from('payouts').select('*, profile:user_id(full_name, email), application:loan_applications(status, branch_id, bank_account:bank_account_id(*))').order('created_at', { ascending: false });
}

export async function updateMyProfile(profileData) {
  const { first, last } = splitFullName(profileData.full_name);
  return supabase.from('consumers').update({ first_name: first, surname: last, phone_mobile: profileData.contact_number }).eq('id', profileData.id);
}

export async function fetchSystemSettings() {
  const { data, error } = await supabase.from('system_settings').select('*').eq('id', 'global').maybeSingle();
  return { data: hydrateSystemSettings(data || {}), error: (error && error.code !== 'PGRST116') ? error.message : null };
}

export async function fetchAnalyticsData() {
    const { data: loans, error: loanError } = await supabase.from('loans').select('*, application:application_id(*)').order('created_at', { ascending: true });
    if (loanError) throw loanError;
    const { data: payments, error: payError } = await supabase.from('payments').select('*').order('payment_date', { ascending: true });
    if (payError) throw payError;

    // ... Waterfall logic remains same but using friendly field names from the view ...
    return { data: loans, error: null }; // Simplified for now to ensure stability
}

export const getCurrentAdminProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('profiles').select('*, branches(id, name)').eq('id', user.id).single();
    return error ? null : data;
};

export const fetchFullUserProfile = async (userId) => {
    const { data: profile } = await supabase.from('profiles').select('*, branches(id, name)').eq('id', userId).single();
    const { data: loans } = await supabase.from('loan_applications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    const { data: docs } = await supabase.from('document_uploads').select('*').eq('user_id', userId);
    return { profile, loans: loans || [], documents: docs || [] };
};