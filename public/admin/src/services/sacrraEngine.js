// SACRRA Layout 700v2 Engine
// Implements file format spec from "Layout 700v2 Specification and Process Rule Document v2.8 (June 2015)"
// Fixed-width ASCII. Alpha fields left-aligned space-padded; Numeric fields right-aligned zero-padded.
// Header/Trailer = 700 chars. Monthly data row = 700. Daily data row = 718 (includes supplier ref + txn date).

// ── Field schema (Monthly data row, 1-indexed positions per spec p.23-24) ─────
export const MONTHLY_FIELDS = [
  { n: 1,  name: 'transaction_type',      start: 1,   len: 1,   type: 'A' }, // N=New, R=Repeat, C=Closed, D=Delete
  { n: 2,  name: 'sa_id',                 start: 2,   len: 13,  type: 'N' },
  { n: 3,  name: 'non_sa_id',             start: 15,  len: 16,  type: 'A' },
  { n: 4,  name: 'gender',                start: 31,  len: 1,   type: 'A' },
  { n: 5,  name: 'date_of_birth',         start: 32,  len: 8,   type: 'N' },
  { n: 6,  name: 'branch_code',           start: 40,  len: 8,   type: 'A' },
  { n: 7,  name: 'account_no',            start: 48,  len: 25,  type: 'A' },
  { n: 8,  name: 'sub_account_no',        start: 73,  len: 4,   type: 'A' },
  { n: 9,  name: 'surname',               start: 77,  len: 25,  type: 'A' },
  { n: 10, name: 'title',                 start: 102, len: 5,   type: 'A' },
  { n: 11, name: 'forename1',             start: 107, len: 14,  type: 'A' },
  { n: 12, name: 'forename2',             start: 121, len: 14,  type: 'A' },
  { n: 13, name: 'forename3',             start: 135, len: 14,  type: 'A' },
  { n: 14, name: 'res_addr1',             start: 149, len: 25,  type: 'A' },
  { n: 15, name: 'res_addr2',             start: 174, len: 25,  type: 'A' },
  { n: 16, name: 'res_addr3',             start: 199, len: 25,  type: 'A' },
  { n: 17, name: 'res_addr4',             start: 224, len: 25,  type: 'A' },
  { n: 18, name: 'res_postal_code',       start: 249, len: 6,   type: 'A' },
  { n: 19, name: 'owner_tenant',          start: 255, len: 1,   type: 'A' },
  { n: 20, name: 'post_addr1',            start: 256, len: 25,  type: 'A' },
  { n: 21, name: 'post_addr2',            start: 281, len: 25,  type: 'A' },
  { n: 22, name: 'post_addr3',            start: 306, len: 25,  type: 'A' },
  { n: 23, name: 'post_addr4',            start: 331, len: 25,  type: 'A' },
  { n: 24, name: 'post_postal_code',      start: 356, len: 6,   type: 'A' },
  { n: 25, name: 'ownership_type',        start: 362, len: 2,   type: 'A' },
  { n: 26, name: 'loan_reason_code',      start: 364, len: 2,   type: 'A' },
  { n: 27, name: 'payment_type',          start: 366, len: 2,   type: 'A' },
  { n: 28, name: 'account_type',          start: 368, len: 2,   type: 'A' },
  { n: 29, name: 'date_account_opened',   start: 370, len: 8,   type: 'N' },
  { n: 30, name: 'deferred_payment_date', start: 378, len: 8,   type: 'N' },
  { n: 31, name: 'date_last_payment',     start: 386, len: 8,   type: 'N' },
  { n: 32, name: 'opening_balance',       start: 394, len: 9,   type: 'N' },
  { n: 33, name: 'current_balance',       start: 403, len: 9,   type: 'N' },
  { n: 34, name: 'current_balance_ind',   start: 412, len: 1,   type: 'A' },
  { n: 35, name: 'amount_overdue',        start: 413, len: 9,   type: 'N' },
  { n: 36, name: 'instalment_amount',     start: 422, len: 9,   type: 'N' },
  { n: 37, name: 'months_in_arrears',     start: 431, len: 2,   type: 'N' },
  { n: 38, name: 'status_code',           start: 433, len: 2,   type: 'A' },
  { n: 39, name: 'repayment_frequency',   start: 435, len: 2,   type: 'N' },
  { n: 40, name: 'terms',                 start: 437, len: 4,   type: 'N' },
  { n: 41, name: 'status_date',           start: 441, len: 8,   type: 'N' },
  { n: 42, name: 'old_supplier_branch',   start: 449, len: 8,   type: 'A' },
  { n: 43, name: 'old_account_no',        start: 457, len: 25,  type: 'A' },
  { n: 44, name: 'old_sub_account_no',    start: 482, len: 4,   type: 'A' },
  { n: 45, name: 'old_supplier_ref',      start: 486, len: 10,  type: 'A' },
  { n: 46, name: 'home_telephone',        start: 496, len: 16,  type: 'A' },
  { n: 47, name: 'cellular_telephone',    start: 512, len: 16,  type: 'A' },
  { n: 48, name: 'work_telephone',        start: 528, len: 16,  type: 'A' },
  { n: 49, name: 'employer_detail',       start: 544, len: 60,  type: 'A' },
  { n: 50, name: 'income',                start: 604, len: 9,   type: 'N' },
  { n: 51, name: 'income_frequency',      start: 613, len: 1,   type: 'A' },
  { n: 52, name: 'occupation',            start: 614, len: 20,  type: 'A' },
  { n: 53, name: 'third_party_name',      start: 634, len: 60,  type: 'A' },
  { n: 54, name: 'account_sold_3rd',      start: 694, len: 2,   type: 'N' },
  { n: 55, name: 'joint_loan_participants', start: 696, len: 3, type: 'N' },
  { n: 56, name: 'filler',                start: 699, len: 2,   type: 'A' },
];

export const MONTHLY_RECORD_LEN = 700;
export const DAILY_RECORD_LEN = 718;

// Daily appends fields 57 (supplier_ref) and 58 (transaction_date)
export const DAILY_EXTRA_FIELDS = [
  { n: 57, name: 'supplier_ref', start: 701, len: 10, type: 'A', rightAlign: true },
  { n: 58, name: 'transaction_date', start: 711, len: 8, type: 'N' },
];

// ── Account types catalogue (p.15-18 + change control p.2) ──────────────────
export const ACCOUNT_TYPES = {
  B: { name: 'Building Loan',                monthly: ['C','D','E','I','J','L','P','T','V','W','Z'], daily: ['C','T','V'] },
  C: { name: 'Credit Card',                  monthly: ['C','D','E','I','L','P','T','V','W','Z'],     daily: ['C','T','V'] },
  D: { name: 'Debt Recovery',                monthly: ['C','D','E','L','T','V','W','Z'],             daily: ['C','T','V'] },
  E: { name: 'Single Credit Facility',       monthly: ['C','D','E','I','J','L','P','T','V','W','Z'], daily: ['C','T','V'] },
  F: { name: 'Open Services',                monthly: ['C','D','E','I','L','P','T','V','W','Z'],     daily: ['C','T','V'] },
  G: { name: 'Garage Card',                  monthly: ['C','D','E','I','L','P','T','V','W','Z'],     daily: ['C','T','V'] },
  H: { name: 'Home Loans',                   monthly: ['C','D','E','I','J','L','P','T','V','W','Z'], daily: ['C','T','V'] },
  I: { name: 'Instalment',                   monthly: ['C','D','E','I','L','P','T','V','W','Z'],     daily: ['C','T','V'] },
  L: { name: 'Life Insurance',               monthly: ['C','F','K','M','S','V'],                     daily: ['C','F','K','M','S','V'] },
  M: { name: 'One Month Personal Loan',      monthly: ['C','D','E','I','L','P','T','V','W','Z'],     daily: ['C','T','V'] },
  N: { name: 'Secured Pension/Policy Loan',  monthly: ['C','D','E','I','L','P','T','V','W','Z'],     daily: ['C','T','V'] },
  O: { name: 'Open / Limitless Account',     monthly: ['C','D','E','I','L','P','T','V','W','Z'],     daily: ['C','T','V'] },
  P: { name: 'Personal Loans',               monthly: ['C','D','E','I','L','P','T','V','W','Z'],     daily: ['C','T','V'] },
  R: { name: 'Revolving Store Card',         monthly: ['C','D','E','I','L','P','T','V','W','Z'],     daily: ['C','T','V'] },
  S: { name: 'Short Term Insurance',         monthly: ['C','G','V'],                                 daily: ['C','G','V'] },
  T: { name: 'Student Loans',                monthly: ['C','D','E','I','L','P','T','V','W','Z'],     daily: ['C','T','V'] },
  U: { name: 'Utility',                      monthly: ['C','D','E','I','L','P','T','V','W','Z'],     daily: ['C','T','V'] },
  V: { name: 'Overdraft',                    monthly: ['C','D','E','I','L','P','T','V','W','Z'],     daily: ['C','T','V'] },
  W: { name: 'Rentals: Assets',              monthly: ['C','D','E','I','L','P','T','V','W','Z'],     daily: ['C','T','V'] },
  X: { name: 'Rentals: Property',            monthly: ['C','D','E','I','L','P','T','V','W','Z'],     daily: ['C','T','V'] },
  Y: { name: 'Vehicle and Asset Finance',    monthly: ['C','D','E','I','L','P','T','V','W','Z'],     daily: ['C','T','V'] },
  Z: { name: 'Revolving Non Store Card',     monthly: ['C','D','E','I','L','P','T','V','W','Z'],     daily: ['C','T','V'] },
};

export const STATUS_CODE_LABELS = {
  C: 'Closed', D: 'Dispute', E: 'Early settlement / paid up',
  F: 'Lapsed Policy', G: 'Cancelled by Consumer', I: 'Facility Revoked',
  J: 'Judgement', K: 'Paid Out Deceased Claim', L: 'Legal',
  M: 'Paid Out Disability', P: 'Paid Up', S: 'Surrendered',
  T: 'Early Settlement', V: 'Cooling Off Settlement',
  W: 'Write Off', Z: 'Bad Debt / Charge Off',
};

// ── SA ID validation (p.30-31) ────────────────────────────────────────────────
export function validateSaId(id) {
  const errs = [];
  if (!id || typeof id !== 'string') return { valid: false, errors: ['SA ID required'] };
  id = id.trim();
  if (!/^\d{13}$/.test(id)) errs.push('Must be 13 numeric digits');
  if (/^(\d)\1{12}$/.test(id)) errs.push('Cannot be all repeated digits');
  if (id.startsWith('0000')) errs.push('Cannot start with 4+ zeros');

  const yy = id.slice(0, 2), mm = id.slice(2, 4), dd = id.slice(4, 6);
  const month = parseInt(mm, 10), day = parseInt(dd, 10);
  if (month < 1 || month > 12) errs.push('Invalid birth month');
  if (day < 1 || day > 31) errs.push('Invalid birth day');

  const reg = parseInt(id.slice(6, 10), 10);
  const gender = isNaN(reg) ? null : (reg < 5000 ? 'F' : 'M');

  const status = id[10];
  if (!['0','1','2'].includes(status)) errs.push('Status digit (11) must be 0/1/2');

  // Luhn check digit
  let sumOdd = 0;
  for (let i = 0; i < 12; i += 2) sumOdd += parseInt(id[i], 10) || 0;
  let evenConcat = '';
  for (let i = 1; i < 12; i += 2) evenConcat += id[i];
  const evenDoubled = (parseInt(evenConcat, 10) || 0) * 2;
  let sumEven = 0;
  for (const c of String(evenDoubled)) sumEven += parseInt(c, 10);
  const total = sumOdd + sumEven;
  const expected = (10 - (total % 10)) % 10;
  if (parseInt(id[12], 10) !== expected) errs.push(`Check digit invalid (expected ${expected})`);

  // DOB
  const currentYY = new Date().getFullYear() % 100;
  const century = parseInt(yy, 10) > currentYY ? 1900 : 2000;
  const dob = `${century + parseInt(yy, 10)}${mm}${dd}`;
  const dobDate = new Date(`${dob.slice(0,4)}-${mm}-${dd}`);
  if (dobDate > new Date()) errs.push('DOB cannot be in the future');

  return { valid: errs.length === 0, errors: errs, gender, dob, citizenship: status };
}

// ── Field formatting ──────────────────────────────────────────────────────────
export function padField(value, len, type, rightAlignAlpha = false) {
  let v = value == null ? '' : String(value);
  if (type === 'N') {
    v = v.replace(/\D/g, '');
    if (v.length > len) v = v.slice(-len);
    return v.padStart(len, '0');
  }
  // Alpha
  v = v.replace(/[\r\n]/g, ' ').toUpperCase();
  if (v.length > len) v = v.slice(0, len);
  return rightAlignAlpha ? v.padStart(len, ' ') : v.padEnd(len, ' ');
}

// ── Header builder (p.22) ────────────────────────────────────────────────────
export function buildHeader({ supplierRef, monthEndDate, fileCreationDate, tradingName }) {
  let line = ''.padEnd(700, ' ');
  const arr = [...line];
  const set = (start, len, v, type, rightAlpha) => {
    const s = padField(v, len, type, rightAlpha);
    for (let i = 0; i < len; i++) arr[start - 1 + i] = s[i];
  };
  set(1,  1,   'H',                          'A');
  set(2,  10,  supplierRef,                  'A', true); // right-aligned per spec
  set(12, 8,   monthEndDate,                 'N');
  set(20, 2,   '06',                         'N'); // version 06 = L702
  set(22, 8,   fileCreationDate,             'N');
  set(30, 60,  tradingName,                  'A');
  // 90-700 spaces
  return arr.join('');
}

// ── Trailer (p.24) ───────────────────────────────────────────────────────────
export function buildTrailer(recordCount) {
  const arr = [...''.padEnd(700, ' ')];
  arr[0] = 'T';
  const num = padField(recordCount, 9, 'N');
  for (let i = 0; i < 9; i++) arr[1 + i] = num[i];
  return arr.join('');
}

// ── Data row (Monthly) ───────────────────────────────────────────────────────
export function buildDataRow(record, { daily = false, supplierRef = '', transactionDate = '' } = {}) {
  const len = daily ? DAILY_RECORD_LEN : MONTHLY_RECORD_LEN;
  const arr = [...''.padEnd(len, ' ')];
  for (const f of MONTHLY_FIELDS) {
    let value = f.fixed != null ? f.fixed : record[f.name];
    if (f.name === 'transaction_type' && !value) value = 'R'; // default to Repeat
    const s = padField(value, f.len, f.type);
    for (let i = 0; i < f.len; i++) arr[f.start - 1 + i] = s[i];
  }
  // Numeric fields default to zero-fill when missing
  for (const f of MONTHLY_FIELDS) {
    if (f.type === 'N' && (record[f.name] == null || record[f.name] === '')) {
      const z = ''.padStart(f.len, '0');
      for (let i = 0; i < f.len; i++) arr[f.start - 1 + i] = z[i];
    }
  }
  if (daily) {
    const sr = padField(supplierRef, 10, 'A', true);
    for (let i = 0; i < 10; i++) arr[700 + i] = sr[i];
    const td = padField(transactionDate, 8, 'N');
    for (let i = 0; i < 8; i++) arr[710 + i] = td[i];
  }
  return arr.join('');
}

// ── Filename (p.19-21) ──────────────────────────────────────────────────────
// {SenderID}_{RecipientID}_{FileType}{Frequency}_{Date}_{NumFiles}_{Sequence}.{ext}
export function buildFilename({
  senderId, recipientId = 'ALL', fileType = 'L702', frequency = 'M',
  date, numFiles = 1, sequence = 1, ext = 'txt',
}) {
  const validate = (v, max, alphanum, label) => {
    if (!v) throw new Error(`${label} required`);
    if (String(v).length > max) throw new Error(`${label} max ${max} chars`);
    if (alphanum && !/^[A-Za-z0-9]+$/.test(v)) throw new Error(`${label} must be alphanumeric`);
  };
  validate(senderId, 7, true, 'Sender ID');
  validate(recipientId, 7, true, 'Recipient ID');
  validate(fileType, 5, true, 'File type');
  if (!['D','M','A'].includes(frequency)) throw new Error('Frequency must be D/M/A');
  if (!/^\d{8}$/.test(date)) throw new Error('Date must be CCYYMMDD');
  return `${senderId}_${recipientId}_${fileType}_${frequency}_${date}_${numFiles}_${sequence}.${ext}`;
}

// ── Validation pipeline for a single record ─────────────────────────────────
export function validateRecord(rec, { accountType, daily = false } = {}) {
  const errors = [], warnings = [];
  // NCA minimum requirements (p.28)
  const hasSaId = rec.sa_id && /^\d{13}$/.test(rec.sa_id);
  const hasNonSaId = rec.non_sa_id && rec.non_sa_id.trim();
  if (!hasSaId && !(hasNonSaId && rec.date_of_birth)) {
    errors.push({ field: 'sa_id', msg: 'NCA requires SA ID, or Non-SA ID + DOB' });
  }
  if (!rec.surname) errors.push({ field: 'surname', msg: 'Surname mandatory' });
  if (!rec.forename1) errors.push({ field: 'forename1', msg: 'At least one forename/initial required' });
  if (hasSaId) {
    const sid = validateSaId(rec.sa_id);
    if (!sid.valid) errors.push(...sid.errors.map(e => ({ field: 'sa_id', msg: e })));
    if (sid.gender && rec.gender && rec.gender !== sid.gender) {
      warnings.push({ field: 'gender', msg: `Gender ${rec.gender} disagrees with ID-derived ${sid.gender}` });
    }
  }
  // Account type / status code
  if (accountType) {
    const at = ACCOUNT_TYPES[accountType];
    if (!at) errors.push({ field: 'account_type', msg: `Unknown account type ${accountType}` });
    else if (rec.status_code) {
      const allowed = daily ? at.daily : at.monthly;
      if (!allowed.includes(rec.status_code)) {
        errors.push({ field: 'status_code', msg: `Status ${rec.status_code} not allowed for ${accountType} ${daily?'daily':'monthly'}` });
      }
    }
  }
  // Date sanity
  for (const df of ['date_account_opened','date_last_payment','status_date']) {
    const v = rec[df];
    if (v && !/^\d{8}$/.test(String(v))) errors.push({ field: df, msg: 'Date must be CCYYMMDD' });
  }
  // Status date / last payment within 36 months (p.29 retention)
  const today = new Date();
  const cutoff = new Date(today.getFullYear(), today.getMonth() - 36, today.getDate());
  for (const df of ['date_last_payment','status_date']) {
    const v = String(rec[df] || '');
    if (/^\d{8}$/.test(v)) {
      const d = new Date(`${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`);
      if (d > today) errors.push({ field: df, msg: `${df} cannot be in the future` });
      if (d < cutoff) warnings.push({ field: df, msg: `${df} older than 36 months — Prescription Act` });
    }
  }
  return { errors, warnings, valid: errors.length === 0 };
}

// ── Build a complete extract file ───────────────────────────────────────────
// frequency: 'M' monthly (L702 with H+T), 'D' daily (L702 no H/T, 718-char rows),
//            'A' ad-hoc QE1 clean-up (L700 layout, includes H+T like Monthly)
export function buildExtract({
  records,
  supplierRef,
  monthEndDate,         // CCYYMMDD
  fileCreationDate,     // CCYYMMDD
  tradingName,
  daily = false,
  frequency,            // optional override; if 'A' enables QE1 mode
  accountType,
}) {
  const isDaily = daily || frequency === 'D';
  const isQE1   = frequency === 'A';
  const lines = [];
  if (!isDaily) {
    lines.push(buildHeader({ supplierRef, monthEndDate, fileCreationDate, tradingName }));
  }
  let valid = 0, rejected = [];
  for (const r of records) {
    const v = validateRecord(r, { accountType, daily: isDaily, qe1: isQE1 });
    if (!v.valid) { rejected.push({ record: r, errors: v.errors }); continue; }
    lines.push(buildDataRow(r, { daily: isDaily, supplierRef, transactionDate: r.transaction_date || monthEndDate }));
    valid++;
  }
  if (!isDaily) {
    lines.push(buildTrailer(lines.length + 1));
  }
  return { content: lines.join('\r\n') + '\r\n', validCount: valid, rejected };
}

// ── PGP encryption (lazy-loads openpgp.js from CDN) ─────────────────────────
let _openpgpPromise = null;
async function getOpenPGP() {
  if (typeof window === 'undefined') return null;
  if (window.openpgp) return window.openpgp;
  if (_openpgpPromise) return _openpgpPromise;
  _openpgpPromise = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/openpgp@5.11.2/dist/openpgp.min.js';
    s.onload = () => res(window.openpgp);
    s.onerror = () => rej(new Error('Failed to load openpgp.js'));
    document.head.appendChild(s);
  });
  return _openpgpPromise;
}

export async function encryptPgp(plaintext, armoredPublicKey) {
  const openpgp = await getOpenPGP();
  if (!openpgp) throw new Error('openpgp unavailable in this environment');
  const publicKey = await openpgp.readKey({ armoredKey: armoredPublicKey });
  const message = await openpgp.createMessage({ text: plaintext });
  return openpgp.encrypt({ message, encryptionKeys: publicKey, format: 'armored' });
}
