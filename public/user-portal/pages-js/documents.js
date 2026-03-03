// Payments Dashboard JavaScript
import '/user-portal/Services/sessionGuard.js'; // Production auth guard

let activeLoans = [];
let bankAccounts = [];
let paymentHistory = [];
let selectedLoan = null;

// Initialize dashboard
async function initPaymentsDashboard() {
  try {
    console.log('🚀 Initializing payments dashboard...');
    
    // Check if required elements exist - Matches the IDs in your updated HTML
    const requiredElements = [
      'totalOutstanding', 'nextPaymentAmount', 'nextPaymentDate',
      'paidThisMonth', 'totalPaid', 'activeLoansContainer',
      'bankAccountsContainer', 'paymentHistoryBody', 'quickAccountSelect'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    if (missingElements.length > 0) {
      console.error('❌ Missing required elements:', missingElements);
      console.log('⚠️ Waiting for DOM to be ready...');
      setTimeout(initPaymentsDashboard, 200);
      return;
    }
    
    console.log('✅ All required elements found');
    
    const { supabase } = await import('/Services/supabaseClient.js');
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('⛔ No session found');
      window.location.href = '/auth/login.html';
      return;
    }
    
    console.log('✅ Session found, user:', session.user.id);

    // Load data from Supabase
    const paymentsByLoan = await loadPaymentHistory(supabase, session.user.id);
    await loadActiveLoans(supabase, session.user.id, paymentsByLoan);
    await loadBankAccounts(supabase, session.user.id);

    // Update UI
    calculateMetrics();
    renderAll();
    bindEventListeners();

  } catch (error) {
    console.error('Error initializing payments dashboard:', error);
  }
}

// Load active loans from database
async function loadActiveLoans(supabase, userId, paymentsByLoan = {}) {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    activeLoans = (data || []).map(loan => {
      const principal = parseFloat(loan.principal_amount) || 0;
      const termMonths = parseInt(loan.term_months, 10) || 0;
      const rawRate = parseFloat(loan.interest_rate) || 0;
      const normalizedRate = rawRate > 1 ? rawRate / 100 : rawRate;
      const storedMonthly = parseFloat(loan.monthly_payment) || 0;
      const derivedMonthly = calculateMonthlyPayment(principal, normalizedRate, termMonths);
      const monthlyPayment = Number.isFinite(storedMonthly) && storedMonthly > 0 ? storedMonthly : derivedMonthly;
      const safeMonthlyPayment = Number.isFinite(monthlyPayment) ? monthlyPayment : 0;
      const totalRepayment = parseFloat(loan.total_repayment) || (safeMonthlyPayment * (termMonths || 1)) || principal;
      const paidToDate = paymentsByLoan[loan.id] || 0;
      const outstandingBalance = Math.max(totalRepayment - paidToDate, 0);
      const dueDateObj = normalizeNextPaymentDate(
        loan.next_payment_date || loan.first_payment_date || loan.repayment_start_date
      );
      const nextDueAmount = Math.min(safeMonthlyPayment, outstandingBalance || safeMonthlyPayment);

      return {
        id: loan.id,
        applicationId: loan.application_id,
        principal,
        totalRepayment,
        paidToDate,
        outstanding: outstandingBalance,
        monthlyPayment: safeMonthlyPayment,
        nextPaymentDate: dueDateObj ? dueDateObj.toISOString() : null,
        dueDateObj,
        nextDueAmount: Number.isFinite(nextDueAmount) ? nextDueAmount : safeMonthlyPayment,
        interestRate: normalizedRate,
        termMonths,
        status: loan.status,
        startDate: loan.start_date
      };
    });
  } catch (error) {
    console.error('Error loading active loans:', error);
  }
}

// Load bank accounts from database
async function loadBankAccounts(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false });

    if (error) throw error;

    bankAccounts = (data || []).map(account => ({
      id: account.id,
      bankName: account.bank_name,
      accountNumber: account.account_number,
      isPrimary: account.is_primary
    }));
  } catch (error) {
    console.error('Error loading bank accounts:', error);
  }
}

// Load payment history from database
async function loadPaymentHistory(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, loans:loan_id(application_id)')
      .eq('user_id', userId)
      .order('payment_date', { ascending: false });

    if (error) throw error;

    paymentHistory = (data || []).map(payment => ({
      id: payment.id,
      loanId: payment.loan_id,
      applicationId: payment.loans?.application_id,
      amount: parseFloat(payment.amount),
      date: payment.payment_date,
      status: payment.status || 'completed',
      method: payment.payment_method || 'Card'
    }));

    const paymentsByLoan = paymentHistory.reduce((acc, payment) => {
      acc[payment.loanId] = (acc[payment.loanId] || 0) + (payment.amount || 0);
      return acc;
    }, {});

    return paymentsByLoan;
  } catch (error) {
    console.error('Error loading payment history:', error);
    return {};
  }
}

// Render the new "My Accounts" dropdown
function renderQuickAccountDropdown() {
  const select = document.getElementById('quickAccountSelect');
  if (!select) return;

  // Sorting: Primary account always on top
  const sortedAccounts = [...bankAccounts].sort((a, b) => b.isPrimary - a.isPrimary);

  select.innerHTML = '<option value="" disabled>My Accounts</option>' + 
    sortedAccounts.map(acc => `
      <option value="${acc.id}">
        ${acc.isPrimary ? '⭐ ' : ''}${acc.bankName} (•${acc.accountNumber.slice(-4)})
      </option>
    `).join('');
}

// Master render function
function renderAll() {
  renderActiveLoans();
  renderBankAccounts();
  renderPaymentHistory();
  renderQuickAccountDropdown(); // Populate the new dropdown
}

// UI Metric Calculations
function calculateMetrics() {
  const totalOutstanding = activeLoans.reduce((sum, loan) => sum + loan.outstanding, 0);
  
  const upcomingLoan = activeLoans.reduce((best, loan) => {
    if (!loan.monthlyPayment || loan.monthlyPayment <= 0) return best;
    if (!best || !best.dueDateObj || (loan.dueDateObj && loan.dueDateObj < best.dueDateObj)) return loan;
    return best;
  }, null);
  
  const nextPayment = upcomingLoan ? (upcomingLoan.nextDueAmount ?? upcomingLoan.monthlyPayment) : 0;
  const nextDate = upcomingLoan ? (upcomingLoan.dueDateObj || upcomingLoan.nextPaymentDate) : null;

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const paidThisMonth = paymentHistory
    .filter(p => new Date(p.date) >= firstOfMonth)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = paymentHistory.reduce((sum, p) => sum + p.amount, 0);

  document.getElementById('totalOutstanding').textContent = formatCurrency(totalOutstanding);
  document.getElementById('nextPaymentAmount').textContent = formatCurrency(nextPayment);
  document.getElementById('nextPaymentDate').textContent = formatNextPaymentDate(nextDate);
  document.getElementById('paidThisMonth').textContent = formatCurrency(paidThisMonth);
  document.getElementById('totalPaid').textContent = formatCurrency(totalPaid);
}

// Render active loans list
function renderActiveLoans() {
  const container = document.getElementById('activeLoansContainer');
  const countBadge = document.getElementById('activeLoansCount');
  
  if (countBadge) countBadge.textContent = activeLoans.length;

  if (activeLoans.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No active loans</p></div>`;
    return;
  }

  container.innerHTML = activeLoans.map(loan => `
    <div class="loan-item" onclick="viewLoanDetails(${loan.id})">
      <div class="loan-info">
        <span class="item-name">Loan #${loan.applicationId || loan.id}</span>
        <span class="item-status active">Active</span>
      </div>
      <div class="loan-amount">
        <span>-${formatCurrency(loan.outstanding)}</span>
      </div>
    </div>
  `).join('');
}

// Render bank accounts list
function renderBankAccounts() {
  const container = document.getElementById('bankAccountsContainer');

  if (bankAccounts.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No saved bank accounts</p></div>`;
    return;
  }

  container.innerHTML = bankAccounts.map(account => `
    <div class="bank-account-item ${account.isPrimary ? 'primary' : ''}">
      <span class="bank-name">${account.bankName}</span>
      <span class="account-mask">•••• ${account.accountNumber.slice(-4)}</span>
    </div>
  `).join('');
}

// Render payment history table
function renderPaymentHistory() {
  const tbody = document.getElementById('paymentHistoryBody');

  if (paymentHistory.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No payment history yet</td></tr>`;
    return;
  }

  tbody.innerHTML = paymentHistory.map(p => `
    <tr>
      <td>${formatDate(p.date)}</td>
      <td>#${p.applicationId || p.loanId}</td>
      <td>${formatCurrency(p.amount)}</td>
      <td><span class="status-badge ${p.status}">${p.status}</span></td>
      <td>${p.method}</td>
      <td><button class="btn-icon" onclick="viewPaymentReceipt(${p.id})"><i class="fas fa-receipt"></i></button></td>
    </tr>
  `).join('');
}

// Utility: Currency Formatting
function formatCurrency(value) {
  const number = Number(value) || 0;
  return `R ${number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

// Utility: Date Formatting
function formatDate(dateValue) {
  if (!dateValue) return '--';
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? '--' : date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Utility: Next Payment Date Text
function formatNextPaymentDate(dateValue) {
  const date = normalizeNextPaymentDate(dateValue);
  return date ? `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Date pending';
}

function normalizeNextPaymentDate(rawDate) {
  if (!rawDate) return null;
  const date = new Date(rawDate);
  if (isNaN(date.getTime())) return null;
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function calculateMonthlyPayment(principal, annualRate, termMonths) {
  if (!principal || !termMonths) return 0;
  const monthlyRate = (annualRate || 0) / 12;
  if (!monthlyRate) return principal / termMonths;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

// Bind Buttons & Events
function bindEventListeners() {
  document.getElementById('makePaymentBtn')?.addEventListener('click', () => openPaymentModal());
  document.getElementById('addBankAccountBtn')?.addEventListener('click', addBankAccount);
  document.getElementById('paymentForm')?.addEventListener('submit', handlePaymentSubmit);
}

// Navigation helpers
function addBankAccount() { window.location.href = '/user-portal/?page=apply-loan-2'; }

// Initialize
initPaymentsDashboard();

// SPA Event Handling
window.addEventListener('pageLoaded', (e) => {
  if (e.detail?.pageName === 'documents') initPaymentsDashboard();
});