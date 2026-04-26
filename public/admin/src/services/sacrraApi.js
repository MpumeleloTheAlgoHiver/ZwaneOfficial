// SACRRA bureau submission service.
// Reads bureau API config from supabase `sacrra_bureau_config`, posts encrypted file payload.
// Each row: { bureau, endpoint, auth_header, enabled }
// When real bureau APIs are provided, just configure them in the DB — no code changes required.

import { supabase } from './supabaseClient.js';
import { buildExtract, buildFilename, encryptPgp } from './sacrraEngine.js';

export const BUREAUX = ['Compuscan', 'Experian', 'TransUnion', 'XDS'];

export async function getBureauConfig() {
  const { data, error } = await supabase.from('sacrra_bureau_config').select('*');
  if (error) return BUREAUX.map(b => ({ bureau: b, endpoint: '', auth_header: '', enabled: false }));
  const map = Object.fromEntries((data || []).map(r => [r.bureau, r]));
  return BUREAUX.map(b => map[b] || { bureau: b, endpoint: '', auth_header: '', enabled: false });
}

export async function saveBureauConfig(rows) {
  return supabase.from('sacrra_bureau_config').upsert(rows, { onConflict: 'bureau' });
}

// Fetch records from supabase `loans` joined to `profiles` and project to SACRRA Layout 700v2.
// Real schema:
//   loans:    id, application_id, user_id, principal_amount, interest_rate, term_months,
//             monthly_payment, status, start_date, first_payment_date, next_payment_date,
//             outstanding_balance, total_repayment, has_credit_life_insurance, created_at
//   profiles: id, full_name, identity_number, contact_number, email, branch_id, role
// Amounts here are stored in whole Rands (no /100 conversion).
export async function fetchAccountsForExtract({ accountType, monthEndDate } = {}) {
  let q = supabase.from('loans').select('*, profiles!loans_user_id_fkey(*)');
  if (monthEndDate) {
    const iso = monthEndDate.length === 8
      ? `${monthEndDate.slice(0,4)}-${monthEndDate.slice(4,6)}-${monthEndDate.slice(6,8)}`
      : monthEndDate;
    q = q.lte('start_date', iso);
  }
  const { data, error } = await q.limit(50000);
  if (error) throw error;
  return (data || []).map(r => projectToLayout(r, accountType));
}

// QE1 ad-hoc clean-up extract: loans touched in the last 36 months.
export async function fetchQE1Accounts({ accountType } = {}) {
  const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 36);
  const cutoffIso = cutoff.toISOString().slice(0,10);
  const { data, error } = await supabase
    .from('loans')
    .select('*, profiles!loans_user_id_fkey(*)')
    .gte('start_date', cutoffIso)
    .limit(50000);
  if (error) throw error;
  return (data || []).map(r => projectToLayout(r, accountType)).map(applyConversionFields);
}

// Conversion files: bind old account identifiers (when an account was migrated).
let _conversionsCache = null;
async function loadConversions() {
  if (_conversionsCache) return _conversionsCache;
  const { data } = await supabase.from('sacrra_conversions').select('*');
  _conversionsCache = Object.fromEntries((data || []).map(r => [r.new_account_no, r]));
  return _conversionsCache;
}
export async function refreshConversions() { _conversionsCache = null; return loadConversions(); }
function applyConversionFields(rec) {
  if (!_conversionsCache) return rec;
  const c = _conversionsCache[rec.account_no];
  if (!c) return rec;
  return {
    ...rec,
    old_supplier_branch: c.old_supplier_branch || '',
    old_account_no: c.old_account_no || '',
    old_sub_account_no: c.old_sub_account_no || '',
    old_supplier_ref: c.old_supplier_ref || '',
  };
}

const cleanDate = (d) => String(d || '').replace(/\D/g, '').slice(0, 8);
const toWhole = (n) => Math.floor(Math.abs(Number(n || 0)));

// Map a loans+profiles row to SACRRA Layout 700v2 fields.
// Loan status → SACRRA status code per spec (best-effort default mapping; override in DB if you store it).
// Loan status → SACRRA status code (letter codes per spec p.16).
// C=Current/Up-to-date, D=Default, E=Early settlement, I=Insolvent, L=Legal,
// P=Paid up, T=Terminated, V=Voluntary surrender, W=Written-off, Z=Other.
const STATUS_MAP = {
  active: 'C', current: 'C', approved: 'C', pending: 'C',
  paid: 'P', settled: 'P', closed: 'P',
  default: 'D', defaulted: 'D',
  overdue: 'L', legal: 'L',
  written_off: 'W', writeoff: 'W',
  terminated: 'T',
};

function projectToLayout(loan, accountType) {
  const p = loan.profiles || {};
  const fullName = String(p.full_name || '').trim();
  const parts = fullName.split(/\s+/);
  const surname = parts.length > 1 ? parts[parts.length - 1] : fullName;
  const forename1 = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
  const bal = Number(loan.outstanding_balance || 0);
  const statusLower = String(loan.status || '').toLowerCase();
  const isClosed = ['paid','settled','closed','written_off','writeoff','terminated'].includes(statusLower);
  return {
    transaction_type: isClosed ? 'C' : 'R', // R=Repeat (ongoing), C=Closure
    sa_id: p.identity_number || '',
    non_sa_id: '',
    gender: '',
    date_of_birth: '',
    branch_code: p.branch_id ? String(p.branch_id).slice(0, 8) : '',
    account_no: String(loan.id || '').slice(0, 25),
    sub_account_no: '',
    surname: surname.slice(0, 25),
    title: '',
    forename1: forename1.slice(0, 14),
    forename2: '',
    forename3: '',
    res_addr1: '', res_addr2: '', res_addr3: '', res_addr4: '',
    res_postal_code: '',
    owner_tenant: '',
    post_addr1: '', post_addr2: '', post_addr3: '', post_addr4: '',
    post_postal_code: '',
    ownership_type: '',
    loan_reason_code: '',
    payment_type: '',
    account_type: accountType || 'P',
    date_account_opened: cleanDate(loan.start_date),
    deferred_payment_date: '',
    date_last_payment: cleanDate(loan.first_payment_date),
    opening_balance: toWhole(loan.principal_amount),
    current_balance: toWhole(bal),
    current_balance_ind: bal < 0 ? 'C' : 'D',
    amount_overdue: 0,
    instalment_amount: toWhole(loan.monthly_payment),
    months_in_arrears: 0,
    status_code: STATUS_MAP[String(loan.status || '').toLowerCase()] || 'C',
    repayment_frequency: '12',
    terms: loan.term_months || 0,
    status_date: cleanDate(loan.next_payment_date || loan.start_date),
    home_telephone: '',
    cellular_telephone: p.contact_number || '',
    work_telephone: '',
    employer_detail: '',
    income: 0,
    income_frequency: '',
    occupation: '',
    third_party_name: '',
    account_sold_3rd: 0,
    joint_loan_participants: 0,
    transaction_date: cleanDate(loan.next_payment_date || loan.start_date),
  };
}

export async function generateAndLog({
  records, supplierRef, tradingName, monthEndDate, daily = false, accountType, sequence = 1,
  frequency,
}) {
  await loadConversions();
  const records2 = records.map(applyConversionFields);
  const fileCreationDate = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const meDate = (monthEndDate || '').replace(/-/g,'') || fileCreationDate;
  const freq = frequency || (daily ? 'D' : 'M');
  const { content, validCount, rejected } = buildExtract({
    records: records2, supplierRef, monthEndDate: meDate, fileCreationDate,
    tradingName, daily: freq === 'D', frequency: freq, accountType,
  });
  const filename = buildFilename({
    senderId: supplierRef,
    fileType: freq === 'A' ? 'L700' : 'L702',
    frequency: freq,
    date: freq === 'M' ? meDate : fileCreationDate,
    sequence,
  });

  // Log run
  const { data: run } = await supabase.from('sacrra_extract_runs').insert({
    month_end: monthEndDate, frequency: freq, filename,
    record_count: validCount, rejected_count: rejected.length,
    account_type: accountType, status: 'GENERATED',
  }).select().single();

  // Persist rejections
  if (rejected.length) {
    await supabase.from('sacrra_rejections').insert(
      rejected.flatMap(r => r.errors.map(e => ({
        run_id: run?.id, account_number: r.record.account_no || '',
        field_name: e.field, error_message: e.msg, severity: 'ERROR', resolved: false,
      })))
    );
  }
  return { content, filename, validCount, rejected, runId: run?.id };
}

// Submit to a single bureau via configured endpoint.
// Honors `transport` ('https' default | 'sftp') and PGP-encrypts when `public_key` is set.
export async function submitToBureau({ bureau, content, filename, runId }) {
  const cfg = (await getBureauConfig()).find(c => c.bureau === bureau);
  if (!cfg || !cfg.enabled || !cfg.endpoint) {
    return { bureau, ok: false, error: 'Bureau not configured / disabled' };
  }
  let payload = content;
  let outName = filename;
  if (cfg.public_key) {
    try {
      payload = await encryptPgp(content, cfg.public_key);
      outName = filename + '.pgp';
    } catch (e) {
      return { bureau, ok: false, error: 'PGP encrypt failed: ' + e.message };
    }
  }
  try {
    let res, body;
    if (cfg.transport === 'sftp') {
      res = await fetch('/api/sacrra/sftp-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: cfg.sftp_host, port: cfg.sftp_port || 22,
          username: cfg.sftp_username, password: cfg.sftp_password,
          remotePath: cfg.sftp_remote_path || '/', filename: outName,
          content: payload,
        }),
      });
      body = await res.text();
    } else {
      const headers = { 'Content-Type': 'text/plain', 'X-Filename': outName };
      if (cfg.auth_header) headers['Authorization'] = cfg.auth_header;
      res = await fetch(cfg.endpoint, { method: 'POST', headers, body: payload });
      body = await res.text();
    }
    await supabase.from('sacrra_submissions').insert({
      run_id: runId, bureau, filename: outName, http_status: res.status,
      response_body: body.slice(0, 4000), success: res.ok,
    });
    return { bureau, ok: res.ok, status: res.status, body: body.slice(0, 200) };
  } catch (e) {
    await supabase.from('sacrra_submissions').insert({
      run_id: runId, bureau, filename, http_status: 0,
      response_body: String(e.message || e), success: false,
    });
    return { bureau, ok: false, error: e.message };
  }
}

export async function submitToAll({ content, filename, runId }) {
  return Promise.all(BUREAUX.map(b => submitToBureau({ bureau: b, content, filename, runId })));
}
