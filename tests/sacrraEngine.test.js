// Standalone test for sacrraEngine. Run: node tests/sacrraEngine.test.js
import {
  validateSaId, buildHeader, buildTrailer, buildDataRow,
  buildFilename, buildExtract, validateRecord,
  MONTHLY_RECORD_LEN, DAILY_RECORD_LEN, ACCOUNT_TYPES,
} from '../public/admin/src/services/sacrraEngine.js';

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); console.log(`  ✓ ${name}`); pass++; }
  catch (e) { console.log(`  ✗ ${name}\n      ${e.message}`); fail++; }
};
const eq = (a, b, msg='') => { if (a !== b) throw new Error(`${msg} expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`); };
const ok = (v, msg='') => { if (!v) throw new Error(msg || 'expected truthy'); };

console.log('\n— SA ID validator —');
t('valid SA ID 4408155031082 (spec example 1)', () => {
  const r = validateSaId('4408155031082');
  eq(r.valid, true, 'valid');
  eq(r.gender, 'M');
  eq(r.dob, '19440815');
  eq(r.citizenship, '0');
});
t('valid SA ID 5710300020087 (spec example 2 reworked)', () => {
  // spec example 2 was 5710300020087 — let's verify check digit math
  const r = validateSaId('5710300020087');
  eq(r.valid, true);
});
t('rejects bad check digit', () => {
  const r = validateSaId('8501015800080');
  eq(r.valid, false);
});
t('rejects all repeated', () => {
  const r = validateSaId('1111111111111');
  eq(r.valid, false);
});
t('rejects non-numeric', () => {
  const r = validateSaId('ABCDEFGHIJKLM');
  eq(r.valid, false);
});

console.log('\n— Header / Trailer / Data row —');
t('header is 700 chars', () => {
  const h = buildHeader({ supplierRef: 'CP0001', monthEndDate: '20240331', fileCreationDate: '20240401', tradingName: 'ZWANE FINANCIAL' });
  eq(h.length, 700);
  eq(h[0], 'H');
  eq(h.slice(1, 11), '    CP0001'); // right-aligned per spec
  eq(h.slice(11, 19), '20240331');
  eq(h.slice(19, 21), '06');
  eq(h.slice(21, 29), '20240401');
  ok(h.slice(29, 89).startsWith('ZWANE FINANCIAL'));
});

t('trailer is 700 chars and counts', () => {
  const tr = buildTrailer(123456);
  eq(tr.length, 700);
  eq(tr[0], 'T');
  eq(tr.slice(1, 10), '000123456');
});

t('monthly data row is 700 chars', () => {
  const row = buildDataRow({
    sa_id: '4408155031082', surname: 'MOKOENA', forename1: 'THABO',
    account_no: 'ACC-9001', account_type: 'P', status_code: 'P',
    current_balance: 125000, opening_balance: 200000,
    date_account_opened: '20210101', status_date: '20240101',
  });
  eq(row.length, MONTHLY_RECORD_LEN);
  eq(row[0], 'R'); // transaction type defaults to Repeat (ongoing)
  eq(row.slice(1, 14), '4408155031082'); // SA ID at 2-14
  eq(row.slice(76, 101).trim(), 'MOKOENA');
  eq(row.slice(106, 120).trim(), 'THABO');
  eq(row.slice(367, 369), 'P '); // account type alpha left
  eq(row.slice(432, 434), 'P '); // status code
  eq(row.slice(393, 402), '000200000'); // opening balance zero-padded
  eq(row.slice(402, 411), '000125000'); // current balance
});

t('daily data row is 718 chars and includes supplier+txn date', () => {
  const row = buildDataRow(
    { sa_id: '4408155031082', surname: 'MOKOENA', forename1: 'THABO', account_no: 'ACC-1' },
    { daily: true, supplierRef: 'CP0001', transactionDate: '20240401' }
  );
  eq(row.length, DAILY_RECORD_LEN);
  eq(row.slice(700, 710), '    CP0001');
  eq(row.slice(710, 718), '20240401');
});

console.log('\n— Filename builder —');
t('monthly live filename', () => {
  const fn = buildFilename({ senderId: 'CP0001', fileType: 'L702', frequency: 'M', date: '20240331' });
  eq(fn, 'CP0001_ALL_L702_M_20240331_1_1.txt');
});
t('daily test filename', () => {
  const fn = buildFilename({ senderId: '1234', fileType: 'TATA', frequency: 'D', date: '20240401' });
  eq(fn, '1234_ALL_TATA_D_20240401_1_1.txt');
});
t('rejects bad date', () => {
  let threw = false;
  try { buildFilename({ senderId: 'CP0001', date: '2024' }); } catch { threw = true; }
  ok(threw, 'should reject bad date');
});

console.log('\n— Record validation —');
t('NCA minimum: rejects record without ID and surname', () => {
  const r = validateRecord({}, { accountType: 'P' });
  eq(r.valid, false);
  ok(r.errors.some(e => e.field === 'sa_id'));
  ok(r.errors.some(e => e.field === 'surname'));
});
t('Status code mismatch with account type rejects', () => {
  const r = validateRecord({
    sa_id: '4408155031082', surname: 'A', forename1: 'B', status_code: 'X',
  }, { accountType: 'P' });
  ok(r.errors.some(e => e.field === 'status_code'));
});
t('Future status date rejects', () => {
  const future = new Date(); future.setFullYear(future.getFullYear() + 1);
  const fd = future.toISOString().slice(0,10).replace(/-/g,'');
  const r = validateRecord({
    sa_id: '4408155031082', surname: 'A', forename1: 'B', status_date: fd,
  });
  ok(r.errors.some(e => e.field === 'status_date'));
});

console.log('\n— Full extract build —');
t('Monthly extract has H + N data rows + T', () => {
  const records = [
    { sa_id: '4408155031082', surname: 'MOKOENA', forename1: 'THABO', account_no: 'A1', account_type: 'P', status_code: 'P' },
    { sa_id: '4408155031082', surname: 'NAIDOO',  forename1: 'SARAH', account_no: 'A2', account_type: 'P', status_code: 'C' },
  ];
  const out = buildExtract({
    records, supplierRef: 'CP0001', monthEndDate: '20240331',
    fileCreationDate: '20240401', tradingName: 'ZWANE', daily: false, accountType: 'P',
  });
  eq(out.validCount, 2);
  eq(out.rejected.length, 0);
  const lines = out.content.split('\r\n').filter(Boolean);
  eq(lines.length, 4); // H + 2 data + T
  eq(lines[0][0], 'H');
  eq(lines[1][0], 'R');
  eq(lines[2][0], 'R');
  eq(lines[3][0], 'T');
  eq(lines[3].slice(1,10), '000000004'); // count includes H+data+T
  for (const l of lines) eq(l.length, 700);
});

t('Daily extract has no header/trailer and rows are 718', () => {
  const records = [{ sa_id: '4408155031082', surname: 'A', forename1: 'B', account_no: 'A1', account_type: 'P', status_code: 'C' }];
  const out = buildExtract({
    records, supplierRef: 'CP0001', monthEndDate: '20240401',
    fileCreationDate: '20240401', tradingName: 'ZWANE', daily: true, accountType: 'P',
  });
  const lines = out.content.split('\r\n').filter(Boolean);
  eq(lines.length, 1);
  eq(lines[0][0], 'R');
  eq(lines[0].length, DAILY_RECORD_LEN);
});

t('Account types catalog has 22 types', () => {
  eq(Object.keys(ACCOUNT_TYPES).length, 22);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
