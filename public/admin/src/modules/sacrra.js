import { initLayout } from '../shared/layout.js';
import { supabase } from '../services/supabaseClient.js';
import {
  ACCOUNT_TYPES, STATUS_CODE_LABELS, validateSaId, validateRecord,
  buildExtract, buildFilename, MONTHLY_FIELDS,
} from '../services/sacrraEngine.js';
import {
  BUREAUX, getBureauConfig, saveBureauConfig,
  fetchAccountsForExtract, fetchQE1Accounts, generateAndLog, submitToAll, submitToBureau,
  refreshConversions,
} from '../services/sacrraApi.js';

// ── State ────────────────────────────────────────────────────────────────────
let currentTab = 'overview';
let userProfile = null;
let stats = { totalAccounts: '0', activeThisMonth: '0', pendingValidation: '0', openRejections: '0' };
let extractHistory = [];
let rejections = [];
let allMembers = [];
let bureauConfig = [];
let supplierConfig = { supplier_ref: 'CP0001', trading_name: 'Zwane Financial Services' };
let monthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().slice(0, 10);
let selectedAccountType = 'P';
let lastExtract = null; // { content, filename, runId, validCount, rejected }

const ZWANE_LOGO = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill="#EA580C"/><path d="M12 10H28L12 30H28" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="28" cy="10" r="3" fill="#0B1C30"/></svg>`;

// ── Data load ────────────────────────────────────────────────────────────────
async function fetchData() {
  try {
    const [{ count: totalCount }, rejRes, histRes, memRes, bcfg, scfg] = await Promise.all([
      supabase.from('loans').select('*', { count: 'exact', head: true }),
      supabase.from('sacrra_rejections').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(200),
      supabase.from('sacrra_extract_runs').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('loans').select('id, status, profiles!loans_user_id_fkey(identity_number, full_name)').limit(500),
      getBureauConfig(),
      supabase.from('sacrra_supplier_config').select('*').eq('active', true).limit(1).maybeSingle(),
    ]);
    rejections = rejRes.data || [];
    extractHistory = histRes.data || [];
    allMembers = memRes.data || [];
    bureauConfig = bcfg;
    if (scfg.data) supplierConfig = scfg.data;
    stats.totalAccounts = (totalCount || 0).toLocaleString();
    stats.activeThisMonth = allMembers.filter(a => ['active','current','approved','pending'].includes(String(a.status||'').toLowerCase())).length.toLocaleString();
    stats.pendingValidation = allMembers.filter(a => {
      const id = a.profiles?.identity_number;
      return !id || !validateSaId(id).valid;
    }).length.toLocaleString();
    stats.openRejections = rejections.length.toLocaleString();
  } catch (e) { console.error('SACRRA sync error:', e); }
}

// ── Shell ────────────────────────────────────────────────────────────────────
export async function init(container) {
  const auth = await initLayout();
  if (!auth) return;
  userProfile = auth.profile;
  container.innerHTML = `
    <div class="flex h-screen bg-[#f1f5f9] text-[#0f172a] font-inter overflow-hidden">
      <aside class="w-64 bg-[#0b1c30] flex flex-col shrink-0">
        <div class="p-6 flex items-center gap-3">${ZWANE_LOGO}<div><h1 class="text-white font-bold text-xs uppercase">Zwane Financial</h1><p class="text-slate-500 text-[8px] uppercase tracking-widest font-black mt-1">SACRRA L702</p></div></div>
        <nav class="flex-1 mt-4 px-3 space-y-1" id="sacrra-nav"></nav>
        <div class="p-4 mt-auto">
          <a href="/admin/dashboard.html" class="flex items-center gap-3 px-4 py-3 text-slate-400 text-[10px] font-bold uppercase hover:text-white"><span class="material-symbols-outlined text-lg">arrow_back</span> EXIT</a>
        </div>
      </aside>
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div class="flex items-center gap-2 text-[10px] font-black uppercase">SACRRA Compliance Workspace</div>
          <div class="flex items-center gap-3 pl-6 border-l border-slate-100">
            <div class="text-right"><p class="text-[10px] font-black uppercase">${userProfile?.full_name || 'Admin'}</p><p class="text-[8px] font-bold text-slate-400 uppercase">Compliance Officer</p></div>
          </div>
        </header>
        <div id="sacrra-view" class="flex-1 overflow-y-auto p-8 bg-[#f8fafc]"></div>
      </div>
    </div>
    <div id="sacrra-toast" class="fixed bottom-6 right-6 z-50 space-y-2"></div>`;
  await fetchData();
  renderNav();
  switchTab(currentTab);
}

function renderNav() {
  const items = [
    { id:'overview',  icon:'grid_view',     label:'Overview' },
    { id:'generate',  icon:'upload_file',   label:'Generate Extract' },
    { id:'validate',  icon:'verified_user', label:'Rejections' },
    { id:'history',   icon:'assignment',    label:'Run History' },
    { id:'submissions', icon:'send',        label:'Bureau Submissions' },
    { id:'config',    icon:'settings',      label:'Bureau Config' },
    { id:'advanced',  icon:'tune',          label:'Advanced' },
    { id:'idtools',   icon:'badge',         label:'SA ID Tools' },
  ];
  document.getElementById('sacrra-nav').innerHTML = items.map(i =>
    `<a onclick="window.sacrraSwitchTab('${i.id}')" class="flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer ${currentTab===i.id?'bg-orange-600 text-white':'text-slate-400 hover:text-white hover:bg-slate-800/50'}"><span class="material-symbols-outlined text-xl">${i.icon}</span><span class="text-[10px] font-bold tracking-widest uppercase">${i.label}</span></a>`
  ).join('');
}

function switchTab(t) { currentTab = t; renderNav(); render(); }
window.sacrraSwitchTab = switchTab;

function render() {
  const v = document.getElementById('sacrra-view');
  switch (currentTab) {
    case 'overview':    return renderOverview(v);
    case 'generate':    return renderGenerate(v);
    case 'validate':    return renderRejections(v);
    case 'history':     return renderHistory(v);
    case 'submissions': return renderSubmissions(v);
    case 'config':      return renderConfig(v);
    case 'advanced':    return renderAdvanced(v);
    case 'idtools':     return renderIdTools(v);
  }
}

// ── Toast ────────────────────────────────────────────────────────────────────
function toast(msg, kind='success') {
  const colors = { success:'bg-emerald-600', error:'bg-red-600', info:'bg-slate-800' };
  const el = document.createElement('div');
  el.className = `${colors[kind]} text-white text-xs font-bold px-4 py-3 rounded-lg shadow-lg animate-fade-in`;
  el.textContent = msg;
  document.getElementById('sacrra-toast').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
window.showToast = toast;

// ── Overview ─────────────────────────────────────────────────────────────────
function renderOverview(v) {
  const cards = [
    { l:'TOTAL ACCOUNTS', v:stats.totalAccounts, i:'database' },
    { l:'ACTIVE THIS MONTH', v:stats.activeThisMonth, i:'bar_chart' },
    { l:'PENDING VALIDATION', v:stats.pendingValidation, i:'assignment_late' },
    { l:'OPEN REJECTIONS', v:stats.openRejections, i:'error', vc:'text-red-600' },
  ];
  v.innerHTML = `
    <div class="max-w-7xl mx-auto space-y-8">
      <div class="flex justify-between items-end">
        <div><h2 class="text-3xl font-bold">SACRRA Layout 700v2 Workspace</h2><p class="text-sm text-slate-500 mt-1">Compliant with SACRRA spec v2.8 — Monthly &amp; Daily extracts.</p></div>
        <div class="flex gap-3">
          <button onclick="window.sacrraQuickExport('M')" class="px-5 py-2.5 bg-orange-600 text-white rounded-lg text-xs font-black uppercase shadow flex items-center gap-2"><span class="material-symbols-outlined text-base">download</span> Export Monthly Sample</button>
          <button onclick="window.sacrraQuickExport('D')" class="px-5 py-2.5 bg-slate-800 text-white rounded-lg text-xs font-black uppercase shadow flex items-center gap-2"><span class="material-symbols-outlined text-base">download</span> Export Daily Sample</button>
        </div>
      </div>
      <div class="grid grid-cols-4 gap-6">
        ${cards.map(s=>`<div class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm"><div class="p-3 bg-slate-50 rounded-lg w-fit text-slate-400 mb-4"><span class="material-symbols-outlined">${s.i}</span></div><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${s.l}</p><p class="text-3xl font-black ${s.vc||'text-slate-900'} mt-2 tabular-nums">${s.v}</p></div>`).join('')}
      </div>
      <div class="grid grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-xl border border-slate-100 col-span-2">
          <h3 class="text-sm font-black uppercase mb-4">Bureau readiness</h3>
          ${bureauConfig.map(b=>`<div class="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"><div class="flex items-center gap-3"><span class="w-2 h-2 rounded-full ${b.enabled?'bg-emerald-500':'bg-slate-300'}"></span><span class="text-xs font-bold">${b.bureau}</span></div><span class="text-[10px] font-black uppercase ${b.enabled?'text-emerald-600':'text-slate-400'}">${b.enabled?'CONFIGURED':'NOT CONFIGURED'}</span></div>`).join('')}
        </div>
        <div class="bg-[#0b1c30] p-6 rounded-xl text-white">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Supplier</p>
          <p class="text-xl font-black">${supplierConfig.trading_name}</p>
          <p class="font-mono text-orange-400 text-sm mt-1">${supplierConfig.supplier_ref}</p>
          <p class="text-[10px] text-slate-400 mt-6 leading-relaxed">All extracts use this supplier reference in the file header (positions 2–11, right-aligned).</p>
        </div>
      </div>
    </div>`;
}

// ── Generate ─────────────────────────────────────────────────────────────────
function renderGenerate(v) {
  v.innerHTML = `
    <div class="max-w-5xl mx-auto space-y-8">
      <div><h2 class="text-3xl font-bold">Generate Layout 700v2 Extract</h2><p class="text-sm text-slate-500 mt-1">Builds a fixed-width ASCII file ready for bureau submission.</p></div>
      <div class="bg-white rounded-xl border border-slate-100 p-8 grid grid-cols-2 gap-6">
        <label class="block"><span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Frequency</span>
          <select id="freq" class="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="M">Monthly</option><option value="D">Daily</option>
          </select></label>
        <label class="block"><span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Account Type</span>
          <select id="acct-type" class="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg text-sm">
            ${Object.entries(ACCOUNT_TYPES).map(([k,a])=>`<option value="${k}" ${k===selectedAccountType?'selected':''}>${k} — ${a.name}</option>`).join('')}
          </select></label>
        <label class="block"><span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Month End Date</span>
          <input id="month-end" type="date" value="${monthEnd}" class="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg text-sm"/></label>
        <label class="block"><span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Sequence</span>
          <input id="seq" type="number" value="1" min="1" max="99" class="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg text-sm"/></label>
        <label class="block col-span-2"><span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Supplier Reference</span>
          <input id="supplier-ref" value="${supplierConfig.supplier_ref}" maxlength="10" class="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"/></label>
        <label class="block col-span-2"><span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Trading Name</span>
          <input id="trading-name" value="${supplierConfig.trading_name}" maxlength="60" class="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg text-sm"/></label>
      </div>
      <div class="flex gap-3">
        <button onclick="window.sacrraPreview()" class="px-6 py-3 bg-slate-800 text-white rounded-lg text-xs font-black uppercase">Preview Extract</button>
        <button onclick="window.sacrraGenerate()" class="px-6 py-3 bg-orange-600 text-white rounded-lg text-xs font-black uppercase">Generate &amp; Log</button>
        <button onclick="window.sacrraDownload()" class="px-6 py-3 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase" id="dl-btn" disabled>Download File</button>
        <button onclick="window.sacrraSubmitAll()" class="px-6 py-3 bg-blue-600 text-white rounded-lg text-xs font-black uppercase" id="sub-btn" disabled>Submit to All Bureaux</button>
      </div>
      <div id="extract-preview" class="bg-[#0b1c30] rounded-xl p-6 font-mono text-[10px] text-emerald-400 max-h-96 overflow-auto whitespace-pre"></div>
    </div>`;
  document.getElementById('acct-type').onchange = (e) => selectedAccountType = e.target.value;
  document.getElementById('month-end').onchange = (e) => monthEnd = e.target.value;
}

function readGenerateForm() {
  return {
    daily: document.getElementById('freq').value === 'D',
    accountType: document.getElementById('acct-type').value,
    monthEndDate: document.getElementById('month-end').value,
    supplierRef: document.getElementById('supplier-ref').value.trim(),
    tradingName: document.getElementById('trading-name').value.trim(),
    sequence: parseInt(document.getElementById('seq').value, 10) || 1,
  };
}

window.sacrraPreview = async () => {
  const f = readGenerateForm();
  toast('Building preview…', 'info');
  const records = await fetchAccountsForExtract({ accountType: f.accountType, monthEndDate: f.monthEndDate });
  if (!records.length) return toast('No accounts found for that account type', 'error');
  const meDate = f.monthEndDate.replace(/-/g,'');
  const fcDate = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const { content, validCount, rejected } = buildExtract({
    records: records.slice(0, 5), supplierRef: f.supplierRef, monthEndDate: meDate,
    fileCreationDate: fcDate, tradingName: f.tradingName, daily: f.daily, accountType: f.accountType,
  });
  document.getElementById('extract-preview').textContent =
    `# Preview — first 5 records (${records.length} total, ${rejected.length} would reject)\n\n${content}`;
};

window.sacrraGenerate = async () => {
  const f = readGenerateForm();
  toast('Generating extract…', 'info');
  try {
    const records = await fetchAccountsForExtract({ accountType: f.accountType, monthEndDate: f.monthEndDate });
    const result = await generateAndLog({ records, ...f });
    lastExtract = result;
    document.getElementById('dl-btn').disabled = false;
    document.getElementById('sub-btn').disabled = false;
    document.getElementById('extract-preview').textContent =
      `# ${result.filename}\n# ${result.validCount} valid, ${result.rejected.length} rejected\n\n${result.content.slice(0, 5000)}${result.content.length>5000?'\n…(truncated)':''}`;
    toast(`Generated ${result.filename} — ${result.validCount} records`, 'success');
    await fetchData();
  } catch (e) { toast(`Failed: ${e.message}`, 'error'); }
};

// One-click export: builds an L702 file from all available accounts and downloads it.
// Use this to share a compliant sample with a bureau before they issue API credentials.
window.sacrraQuickExport = async (frequency = 'M') => {
  toast('Building Layout 700v2 file…', 'info');
  try {
    const records = await fetchAccountsForExtract({});
    if (!records.length) return toast('No accounts available to export', 'error');
    const result = await generateAndLog({
      records,
      supplierRef: supplierConfig.supplier_ref,
      tradingName: supplierConfig.trading_name,
      monthEndDate: monthEnd,
      daily: frequency === 'D',
      accountType: null,
      sequence: 1,
    });
    lastExtract = result;
    const blob = new Blob([result.content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = result.filename;
    link.click();
    toast(`Downloaded ${result.filename} — ${result.validCount} records, ${result.rejected.length} rejected`, 'success');
    await fetchData();
  } catch (e) { toast(`Export failed: ${e.message}`, 'error'); }
};

window.sacrraDownload = () => {
  if (!lastExtract) return;
  const blob = new Blob([lastExtract.content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = lastExtract.filename;
  link.click();
};

window.sacrraSubmitAll = async () => {
  if (!lastExtract) return;
  toast('Submitting to all configured bureaux…', 'info');
  const results = await submitToAll(lastExtract);
  for (const r of results) {
    toast(`${r.bureau}: ${r.ok ? 'OK ('+r.status+')' : 'FAIL — '+(r.error||r.status)}`, r.ok?'success':'error');
  }
  switchTab('submissions');
};

// ── Rejections ───────────────────────────────────────────────────────────────
function renderRejections(v) {
  v.innerHTML = `
    <div class="max-w-7xl mx-auto space-y-6">
      <div class="flex justify-between items-end">
        <div><h2 class="text-3xl font-bold">Rejections</h2><p class="text-sm text-slate-500">${rejections.length} unresolved.</p></div>
        <button onclick="window.sacrraResolveAll()" class="px-6 py-2.5 bg-orange-600 text-white rounded-lg text-xs font-black uppercase">Mark All Resolved</button>
      </div>
      <div class="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-widest">
            <tr><th class="px-6 py-4">Account</th><th class="px-6 py-4">Field</th><th class="px-6 py-4">Error</th><th class="px-6 py-4">Severity</th><th class="px-6 py-4 text-right">Action</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            ${rejections.length ? rejections.map(r=>`
              <tr><td class="px-6 py-4 font-mono">${r.account_number||'—'}</td>
                  <td class="px-6 py-4">${r.field_name||'—'}</td>
                  <td class="px-6 py-4 text-red-600">${r.error_message||''}</td>
                  <td class="px-6 py-4"><span class="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[9px] font-black">${r.severity||'ERROR'}</span></td>
                  <td class="px-6 py-4 text-right"><button onclick="window.sacrraResolve('${r.id}')" class="text-orange-600 font-black text-[10px] uppercase">Resolve</button></td></tr>
            `).join('') : '<tr><td colspan="5" class="px-6 py-12 text-center text-slate-400 text-xs uppercase">No rejections</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;
}
window.sacrraResolve = async (id) => {
  await supabase.from('sacrra_rejections').update({ resolved: true }).eq('id', id);
  await fetchData(); render(); toast('Resolved', 'success');
};
window.sacrraResolveAll = async () => {
  await supabase.from('sacrra_rejections').update({ resolved: true }).eq('resolved', false);
  await fetchData(); render(); toast('All resolved', 'success');
};

// ── History ──────────────────────────────────────────────────────────────────
function renderHistory(v) {
  v.innerHTML = `
    <div class="max-w-7xl mx-auto space-y-6">
      <h2 class="text-3xl font-bold">Extract Run History</h2>
      <div class="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-widest"><tr><th class="px-6 py-4">Filename</th><th class="px-6 py-4">Month End</th><th class="px-6 py-4">Type</th><th class="px-6 py-4">Records</th><th class="px-6 py-4">Rejected</th><th class="px-6 py-4">When</th></tr></thead>
          <tbody class="divide-y divide-slate-50">
            ${extractHistory.length ? extractHistory.map(h=>`<tr><td class="px-6 py-4 font-mono">${h.filename||'—'}</td><td class="px-6 py-4">${h.month_end||''}</td><td class="px-6 py-4">${h.account_type||'—'} / ${h.frequency}</td><td class="px-6 py-4 tabular-nums">${h.record_count||0}</td><td class="px-6 py-4 tabular-nums text-red-600">${h.rejected_count||0}</td><td class="px-6 py-4 text-slate-400">${new Date(h.created_at).toLocaleString()}</td></tr>`).join('') : '<tr><td colspan="6" class="px-6 py-12 text-center text-slate-400 text-xs uppercase">No runs yet</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;
}

// ── Submissions ──────────────────────────────────────────────────────────────
async function renderSubmissions(v) {
  v.innerHTML = `<div class="max-w-7xl mx-auto"><h2 class="text-3xl font-bold mb-6">Bureau Submissions</h2><div id="sub-list" class="bg-white rounded-xl border border-slate-100 p-6 text-xs text-slate-400">Loading…</div></div>`;
  const { data } = await supabase.from('sacrra_submissions').select('*').order('submitted_at',{ascending:false}).limit(100);
  document.getElementById('sub-list').innerHTML = data?.length ? `
    <table class="w-full text-left text-xs">
      <thead class="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-widest"><tr><th class="px-4 py-3">Bureau</th><th class="px-4 py-3">Filename</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">HTTP</th><th class="px-4 py-3">When</th></tr></thead>
      <tbody class="divide-y divide-slate-50">
        ${data.map(s=>`<tr><td class="px-4 py-3 font-bold">${s.bureau}</td><td class="px-4 py-3 font-mono">${s.filename}</td><td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-[9px] font-black ${s.success?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-700'}">${s.success?'OK':'FAIL'}</span></td><td class="px-4 py-3 tabular-nums">${s.http_status}</td><td class="px-4 py-3 text-slate-400">${new Date(s.submitted_at).toLocaleString()}</td></tr>`).join('')}
      </tbody></table>` : '<p class="text-center py-8 uppercase text-slate-400">No submissions yet</p>';
}

// ── Bureau config ────────────────────────────────────────────────────────────
function renderConfig(v) {
  v.innerHTML = `
    <div class="max-w-4xl mx-auto space-y-6">
      <div><h2 class="text-3xl font-bold">Bureau API Configuration</h2><p class="text-sm text-slate-500 mt-1">Configure the endpoint each bureau provides for direct submission. Authorization header is sent verbatim.</p></div>
      <div class="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
        ${BUREAUX.map(b => {
          const c = bureauConfig.find(x=>x.bureau===b) || { bureau:b, endpoint:'', auth_header:'', enabled:false, transport:'https' };
          const t = c.transport || 'https';
          return `<div class="pb-4 border-b border-slate-50 last:border-0 space-y-2">
            <div class="grid grid-cols-12 gap-3 items-center">
              <div class="col-span-2"><span class="text-xs font-black">${b}</span></div>
              <select id="tr-${b}" class="col-span-2 px-2 py-2 border border-slate-200 rounded-lg text-xs">
                <option value="https" ${t==='https'?'selected':''}>HTTPS</option>
                <option value="sftp" ${t==='sftp'?'selected':''}>SFTP</option>
              </select>
              <input id="ep-${b}" placeholder="${t==='sftp'?'(unused)':'https://api.'+b.toLowerCase()+'.co.za/sacrra/upload'}" value="${c.endpoint||''}" class="col-span-4 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"/>
              <input id="auth-${b}" placeholder="Bearer …" value="${c.auth_header||''}" class="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"/>
              <label class="col-span-1 flex items-center gap-2"><input type="checkbox" id="en-${b}" ${c.enabled?'checked':''}/><span class="text-[10px] font-black uppercase">On</span></label>
              <button onclick="window.sacrraTest('${b}')" class="col-span-1 text-[10px] font-black uppercase text-blue-600">Test</button>
            </div>
            <div class="grid grid-cols-12 gap-3">
              <input id="sh-${b}" placeholder="SFTP host" value="${c.sftp_host||''}" class="col-span-3 px-3 py-1.5 border border-slate-200 rounded text-[11px] font-mono"/>
              <input id="sp-${b}" placeholder="22" value="${c.sftp_port||22}" class="col-span-1 px-3 py-1.5 border border-slate-200 rounded text-[11px] font-mono"/>
              <input id="su-${b}" placeholder="username" value="${c.sftp_username||''}" class="col-span-2 px-3 py-1.5 border border-slate-200 rounded text-[11px] font-mono"/>
              <input id="sw-${b}" type="password" placeholder="password" value="${c.sftp_password||''}" class="col-span-2 px-3 py-1.5 border border-slate-200 rounded text-[11px] font-mono"/>
              <input id="sr-${b}" placeholder="/inbox" value="${c.sftp_remote_path||''}" class="col-span-4 px-3 py-1.5 border border-slate-200 rounded text-[11px] font-mono"/>
            </div>
            <textarea id="pk-${b}" placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----&#10;(armored public key, optional — enables PGP encryption)" rows="2" class="w-full px-3 py-1.5 border border-slate-200 rounded text-[10px] font-mono">${c.public_key||''}</textarea>
          </div>`;
        }).join('')}
        <button onclick="window.sacrraSaveConfig()" class="px-6 py-2.5 bg-orange-600 text-white rounded-lg text-xs font-black uppercase">Save Configuration</button>
      </div>
    </div>`;
}
window.sacrraSaveConfig = async () => {
  const rows = BUREAUX.map(b => ({
    bureau: b,
    endpoint: document.getElementById(`ep-${b}`).value.trim(),
    auth_header: document.getElementById(`auth-${b}`).value.trim(),
    enabled: document.getElementById(`en-${b}`).checked,
    transport: document.getElementById(`tr-${b}`).value,
    sftp_host: document.getElementById(`sh-${b}`).value.trim(),
    sftp_port: parseInt(document.getElementById(`sp-${b}`).value, 10) || 22,
    sftp_username: document.getElementById(`su-${b}`).value.trim(),
    sftp_password: document.getElementById(`sw-${b}`).value,
    sftp_remote_path: document.getElementById(`sr-${b}`).value.trim(),
    public_key: document.getElementById(`pk-${b}`).value.trim(),
    updated_at: new Date().toISOString(),
  }));
  const { error } = await saveBureauConfig(rows);
  if (error) return toast('Save failed: '+error.message,'error');
  bureauConfig = rows;
  toast('Bureau configuration saved','success');
};
window.sacrraTest = async (bureau) => {
  if (!lastExtract) return toast('Generate an extract first','error');
  toast(`Testing ${bureau}…`,'info');
  const r = await submitToBureau({ bureau, ...lastExtract });
  toast(`${bureau}: ${r.ok?'OK '+r.status:'FAIL '+(r.error||r.status)}`, r.ok?'success':'error');
};

// ── SA ID Tools ──────────────────────────────────────────────────────────────
function renderIdTools(v) {
  v.innerHTML = `
    <div class="max-w-3xl mx-auto space-y-6">
      <h2 class="text-3xl font-bold">SA ID Validator</h2>
      <p class="text-sm text-slate-500">Validates RSA ID per SACRRA Home Affairs algorithm — composition, Luhn check digit, DOB, gender, citizenship.</p>
      <div class="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
        <input id="id-input" placeholder="13-digit SA ID" maxlength="13" class="w-full px-4 py-3 border border-slate-200 rounded-lg font-mono text-lg"/>
        <button onclick="window.sacrraCheckId()" class="px-6 py-2.5 bg-orange-600 text-white rounded-lg text-xs font-black uppercase">Validate</button>
        <pre id="id-result" class="bg-slate-50 p-4 rounded-lg text-xs font-mono text-slate-600 whitespace-pre-wrap"></pre>
      </div>
      <div class="bg-white rounded-xl border border-slate-100 p-6">
        <h3 class="text-sm font-black uppercase mb-4">Status codes reference</h3>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          ${Object.entries(STATUS_CODE_LABELS).map(([k,v])=>`<div><span class="font-black font-mono">${k}</span> — ${v}</div>`).join('')}
        </div>
      </div>
    </div>`;
}
window.sacrraCheckId = () => {
  const id = document.getElementById('id-input').value.trim();
  const r = validateSaId(id);
  document.getElementById('id-result').textContent =
    `Valid: ${r.valid}\nDOB: ${r.dob||'—'}\nGender: ${r.gender||'—'}\nCitizenship: ${r.citizenship==='0'?'RSA Citizen':r.citizenship==='1'?'Permanent Resident':r.citizenship==='2'?'Foreigner/Refugee':'—'}\n${r.errors?.length?'\nErrors:\n - '+r.errors.join('\n - '):''}`;
};

// ── Advanced (QE1, Conversions, Multi-supplier batch) ───────────────────────
function renderAdvanced(v) {
  v.innerHTML = `
    <div class="max-w-5xl mx-auto space-y-8">
      <div><h2 class="text-3xl font-bold">Advanced</h2><p class="text-sm text-slate-500 mt-1">QE1 ad-hoc clean-up, conversion files, and multi-supplier batching.</p></div>

      <div class="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
        <h3 class="text-sm font-black uppercase">QE1 — Ad-hoc Clean-up Extract (L700)</h3>
        <p class="text-xs text-slate-500">Generates a Layout 700 file containing all accounts whose status code was touched in the last 36 months. Use for SACRRA-requested clean-ups outside the regular monthly cycle.</p>
        <div class="grid grid-cols-3 gap-3">
          <select id="qe1-acct" class="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="">All account types</option>
            ${Object.entries(ACCOUNT_TYPES).map(([k,a])=>`<option value="${k}">${k} — ${a.name}</option>`).join('')}
          </select>
          <button onclick="window.sacrraGenerateQE1()" class="px-5 py-2.5 bg-orange-600 text-white rounded-lg text-xs font-black uppercase">Generate QE1</button>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
        <h3 class="text-sm font-black uppercase">Conversion file mapping</h3>
        <p class="text-xs text-slate-500">Bind a new account number to its old SACRRA identifiers. The engine populates fields 42–45 (old branch / account / sub-account / supplier ref) automatically on the next extract.</p>
        <div class="grid grid-cols-5 gap-2">
          <input id="cv-new"    placeholder="New account no"     class="px-3 py-2 border border-slate-200 rounded text-xs font-mono"/>
          <input id="cv-oldac"  placeholder="Old account no"     class="px-3 py-2 border border-slate-200 rounded text-xs font-mono"/>
          <input id="cv-oldsub" placeholder="Old sub-acct"       class="px-3 py-2 border border-slate-200 rounded text-xs font-mono"/>
          <input id="cv-oldbr"  placeholder="Old branch"         class="px-3 py-2 border border-slate-200 rounded text-xs font-mono"/>
          <input id="cv-oldsup" placeholder="Old supplier ref"   class="px-3 py-2 border border-slate-200 rounded text-xs font-mono"/>
        </div>
        <button onclick="window.sacrraAddConversion()" class="px-5 py-2 bg-slate-800 text-white rounded-lg text-xs font-black uppercase">Add mapping</button>
        <div id="cv-list" class="text-xs text-slate-500">Loading…</div>
      </div>

      <div class="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
        <h3 class="text-sm font-black uppercase">Multi-supplier batch (SP zip)</h3>
        <p class="text-xs text-slate-500">Generates a Monthly extract per supplier reference and combines them into a single zip per the SACRRA SP filename convention (<code>SP0001_..._.zip</code>).</p>
        <textarea id="sp-list" rows="3" placeholder="One supplier ref per line, e.g.&#10;CP0001&#10;CP0002" class="w-full px-3 py-2 border border-slate-200 rounded text-xs font-mono">${supplierConfig.supplier_ref}</textarea>
        <button onclick="window.sacrraBuildSpZip()" class="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase">Build &amp; Download Zip</button>
      </div>
    </div>`;
  loadConversionList();
}

async function loadConversionList() {
  const { data } = await supabase.from('sacrra_conversions').select('*').order('created_at',{ascending:false}).limit(100);
  const el = document.getElementById('cv-list');
  if (!el) return;
  el.innerHTML = data?.length
    ? `<table class="w-full mt-2"><thead><tr class="text-[10px] font-black uppercase text-slate-400"><th class="text-left py-1">New</th><th class="text-left py-1">Old account</th><th class="text-left py-1">Old sub</th><th class="text-left py-1">Old br</th><th class="text-left py-1">Old sup</th><th></th></tr></thead><tbody>${
        data.map(r=>`<tr class="border-t border-slate-50"><td class="py-1 font-mono">${r.new_account_no}</td><td class="py-1 font-mono">${r.old_account_no}</td><td class="py-1 font-mono">${r.old_sub_account_no||''}</td><td class="py-1 font-mono">${r.old_supplier_branch||''}</td><td class="py-1 font-mono">${r.old_supplier_ref||''}</td><td class="text-right"><button onclick="window.sacrraDelConv('${r.id}')" class="text-red-600 text-[10px] font-black">Remove</button></td></tr>`).join('')
      }</tbody></table>`
    : '<p class="uppercase text-slate-400 py-2">No conversion mappings yet.</p>';
}

window.sacrraAddConversion = async () => {
  const row = {
    new_account_no:      document.getElementById('cv-new').value.trim(),
    old_account_no:      document.getElementById('cv-oldac').value.trim(),
    old_sub_account_no:  document.getElementById('cv-oldsub').value.trim() || null,
    old_supplier_branch: document.getElementById('cv-oldbr').value.trim() || null,
    old_supplier_ref:    document.getElementById('cv-oldsup').value.trim() || null,
  };
  if (!row.new_account_no || !row.old_account_no) return toast('New + old account required','error');
  const { error } = await supabase.from('sacrra_conversions').insert(row);
  if (error) return toast(error.message,'error');
  await refreshConversions();
  ['cv-new','cv-oldac','cv-oldsub','cv-oldbr','cv-oldsup'].forEach(i=>{document.getElementById(i).value='';});
  toast('Mapping added','success');
  loadConversionList();
};
window.sacrraDelConv = async (id) => {
  await supabase.from('sacrra_conversions').delete().eq('id', id);
  await refreshConversions();
  loadConversionList();
};

window.sacrraGenerateQE1 = async () => {
  const accountType = document.getElementById('qe1-acct').value || null;
  toast('Building QE1 ad-hoc extract…','info');
  try {
    const records = await fetchQE1Accounts({ accountType });
    if (!records.length) return toast('No accounts touched in last 36 months','error');
    const result = await generateAndLog({
      records,
      supplierRef: supplierConfig.supplier_ref,
      tradingName: supplierConfig.trading_name,
      monthEndDate: monthEnd,
      frequency: 'A',
      accountType,
    });
    lastExtract = result;
    const blob = new Blob([result.content], { type: 'text/plain' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = result.filename; link.click();
    toast(`QE1: ${result.filename} — ${result.validCount} records`,'success');
    await fetchData();
  } catch (e) { toast('QE1 failed: '+e.message,'error'); }
};

let _jszipPromise = null;
function loadJsZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  if (_jszipPromise) return _jszipPromise;
  _jszipPromise = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
    s.onload = () => res(window.JSZip);
    s.onerror = () => rej(new Error('Failed to load JSZip'));
    document.head.appendChild(s);
  });
  return _jszipPromise;
}

window.sacrraBuildSpZip = async () => {
  const refs = document.getElementById('sp-list').value.split(/\s+/).map(s=>s.trim()).filter(Boolean);
  if (!refs.length) return toast('Enter at least one supplier ref','error');
  toast(`Building zip for ${refs.length} supplier(s)…`,'info');
  try {
    const JSZip = await loadJsZip();
    const zip = new JSZip();
    const meDate = monthEnd.replace(/-/g,'');
    for (const ref of refs) {
      const records = await fetchAccountsForExtract({});
      const result = await generateAndLog({
        records, supplierRef: ref, tradingName: supplierConfig.trading_name,
        monthEndDate: monthEnd, frequency: 'M',
      });
      zip.file(result.filename, result.content);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const today = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const zipName = `SP0001_ALL_L702_M_${meDate||today}_1_1.zip`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = zipName; link.click();
    toast(`Built ${zipName}`,'success');
  } catch (e) { toast('Zip failed: '+e.message,'error'); }
};

// ── Boot ─────────────────────────────────────────────────────────────────────
const shell = document.getElementById('app-shell');
if (shell) init(shell);
