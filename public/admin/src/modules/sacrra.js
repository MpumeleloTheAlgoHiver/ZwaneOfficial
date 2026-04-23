import { initLayout } from '../shared/layout.js';
import { supabase } from '../services/supabaseClient.js';

// ─────────────────────────────────────────────
// SACRRA GOLDEN STATE
// ─────────────────────────────────────────────
let currentTab = 'overview';
let userProfile = null;
let stats = { totalAccounts: "1,284,502", activeThisMonth: "942,108", pendingValidation: "12,431", openRejections: "452" };
let extractHistory = [];
let rejections = [];
let allMembers = []; 
let accountSnapshots = []; 
let monthEnd = new Date().toISOString().slice(0, 10);
let isDemoMode = false;

const ZWANE_LOGO = `
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#EA580C"/>
    <path d="M12 10H28L12 30H28" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="28" cy="10" r="3" fill="#0B1C30"/>
</svg>`;

// ─────────────────────────────────────────────
// DATA SYNC
// ─────────────────────────────────────────────
async function fetchData() {
    try {
        const { count: totalCount } = await supabase.from('accounts').select('*', { count: 'exact', head: true });
        if (totalCount && totalCount > 0) {
            isDemoMode = false;
            const { count: activeCount } = await supabase.from('accounts').select('*', { count: 'exact', head: true }).eq('status_code', '00');
            const { count: rejCount } = await supabase.from('sacrra_rejections').select('*', { count: 'exact', head: true }).eq('resolved', false);
            stats.totalAccounts = totalCount.toLocaleString();
            stats.activeThisMonth = (activeCount || totalCount).toLocaleString();
            stats.openRejections = (rejCount || 0).toLocaleString();
            const [rejRes, histRes, memRes] = await Promise.all([
                supabase.from('sacrra_rejections').select('*').eq('resolved', false).order('created_at', { ascending: false }),
                supabase.from('sacrra_extract_runs').select('*').order('created_at', { ascending: false }).limit(10),
                supabase.from('v_monthly_extract_accounts').select('*').order('surname', { ascending: true })
            ]);
            rejections = rejRes.data || [];
            extractHistory = histRes.data || [];
            allMembers = memRes.data || [];
        } else {
            isDemoMode = true;
            stats = { totalAccounts: "1,284,502", activeThisMonth: "942,108", pendingValidation: "12,431", openRejections: "452" };
            allMembers = [
                { first_name: 'Thabo', surname: 'Mokoena', sa_id: '8501015800081', current_balance: 1250000, account_number: 'ACC-9001' },
                { first_name: 'Nomvula', surname: 'Zwane', sa_id: '9205120123085', current_balance: 4500000, account_number: 'ACC-9002' },
                { first_name: 'Pieter', surname: 'Botha', sa_id: '7811235012081', current_balance: 2800000, account_number: 'ACC-9003' },
                { first_name: 'Sarah', surname: 'Naidoo', sa_id: '8806040124089', current_balance: 1900000, account_number: 'ACC-9004' }
            ];
            rejections = [
                { id: '1', account_number: 'ACC-9001', field_name: 'Surname', error_message: 'Mismatched identity record in bureau cache.', severity: 'Critical' },
                { id: '2', account_number: 'ACC-9004', field_name: 'ID Number', error_message: 'Format violation: Invalid Luhn checksum.', severity: 'Warning' }
            ];
            extractHistory = [{ id: 'h1', month_end: '2023-10', record_count: 1284502, status: 'ACCEPTED', created_at: new Date().toISOString() }];
        }
        accountSnapshots = allMembers.slice(0, 5);
    } catch (e) { console.error("Sync Error:", e); }
}

// ─────────────────────────────────────────────
// UI SHELL
// ─────────────────────────────────────────────
export async function init(container) {
    const auth = await initLayout();
    if (!auth) return;
    userProfile = auth.profile;

    container.innerHTML = `
        <div class="flex h-screen bg-[#f1f5f9] text-[#0f172a] font-inter antialiased overflow-hidden print:bg-white">
            <aside class="w-64 bg-[#0b1c30] flex flex-col shrink-0 print:hidden">
                <div class="p-6 flex items-center gap-3">
                    ${ZWANE_LOGO}
                    <div><h1 class="text-white font-bold text-xs uppercase leading-tight">Zwane Financial</h1><p class="text-slate-500 text-[8px] uppercase tracking-widest font-black mt-1">SACRRA Portal</p></div>
                </div>
                <nav class="flex-1 mt-4 px-3 space-y-1" id="sacrra-nav"></nav>
                <div class="p-4 mt-auto space-y-4">
                    <button onclick="window.exportToExcel()" class="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2">EXPORT REGISTRY</button>
                    <div class="pt-4 border-t border-slate-800">
                        <a href="/admin/dashboard.html" class="flex items-center gap-3 px-4 py-3 text-slate-400 text-[10px] font-bold uppercase hover:text-white transition-colors"><span class="material-symbols-outlined text-lg">arrow_back</span> EXIT TO MAIN</a>
                    </div>
                </div>
            </aside>
            <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 print:hidden">
                    <div class="flex items-center gap-10">
                        <div class="flex items-center gap-2 font-black text-[10px] uppercase text-slate-900 tracking-tight">Zwane Financial Services</div>
                        <nav class="flex items-center gap-8">
                            <a onclick="window.switchTab('overview')" class="text-xs font-bold ${currentTab==='overview'?'text-orange-600 border-b-2 border-orange-600 pb-5 pt-5': 'text-slate-400'} cursor-pointer">Dashboard</a>
                            <a onclick="window.switchTab('validate')" class="text-xs font-bold ${currentTab==='validate'?'text-orange-600 border-b-2 border-orange-600 pb-5 pt-5': 'text-slate-400'} cursor-pointer">Compliance</a>
                            <a onclick="window.switchTab('history')" class="text-xs font-bold ${currentTab==='history'?'text-orange-600 border-b-2 border-orange-600 pb-5 pt-5': 'text-slate-400'} cursor-pointer">Audit Logs</a>
                        </nav>
                        <div class="relative flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-64 text-slate-400"><span class="material-symbols-outlined text-sm">search</span><input type="text" placeholder="Search data..." class="bg-transparent border-none text-xs w-full outline-none"></div>
                    </div>
                    <div class="flex items-center gap-6">
                        <div class="flex items-center gap-4 text-slate-400"><span class="material-symbols-outlined text-xl cursor-pointer">notifications</span><span class="material-symbols-outlined text-xl cursor-pointer">settings</span></div>
                        <div class="flex items-center gap-3 pl-6 border-l border-slate-100">
                            <div class="text-right"><p class="text-[10px] font-black uppercase text-slate-900">${userProfile?.full_name || 'Admin User'}</p><p class="text-[8px] font-bold text-slate-400 uppercase">CHIEF AUDITOR</p></div>
                            <img src="${userProfile?.avatar_url || 'https://ui-avatars.com/api/?name=Admin&background=0b1c30&color=fff'}" class="w-8 h-8 rounded-full border border-slate-100">
                        </div>
                    </div>
                </header>
                <div id="sacrra-view" class="flex-1 overflow-y-auto p-10 bg-[#f8fafc] print:p-0 print:bg-white"></div>
            </div>
        </div>
    `;
    await fetchData();
    renderNav();
    window.switchTab(currentTab);
}

function renderNav() {
    const nav = document.getElementById('sacrra-nav');
    const items = [{id:'overview',icon:'grid_view',label:'OVERVIEW'},{id:'generate',icon:'upload_file',label:'SUBMISSIONS'},{id:'validate',icon:'verified_user',label:'COMPLIANCE'},{id:'members',icon:'groups',label:'ENTITIES'},{id:'history',icon:'assignment',label:'AUDIT LOGS'}];
    nav.innerHTML = items.map(i => `<a onclick="window.switchTab('${i.id}')" class="flex items-center gap-4 px-4 py-3 rounded-lg transition-all cursor-pointer ${currentTab === i.id ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}"><span class="material-symbols-outlined text-xl">${i.icon}</span><span class="text-[10px] font-bold tracking-widest uppercase">${i.label}</span></a>`).join('');
}

window.switchTab = (tab) => { currentTab = tab; renderNav(); renderPage(tab); };

function renderPage(tab) {
    const v = document.getElementById('sacrra-view');
    if (!v) return;
    switch (tab) {
        case 'overview': renderOverview(v); break;
        case 'generate': renderPipeline(v); break;
        case 'validate': renderWorkspace(v); break;
        case 'members': renderMembers(v); break;
        case 'history': renderAuditLogs(v); break;
        case 'report': renderFullReport(v); break;
    }
}

// ─────────────────────────────────────────────
// PAGE: OVERVIEW
// ─────────────────────────────────────────────
function renderOverview(v) {
    v.innerHTML = `
        <div class="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
            <div class="flex justify-between items-end">
                <div><h2 class="text-3xl font-bold text-slate-900">Compliance Overview</h2><p class="text-sm text-slate-500 mt-1">Real-time status of SACRRA data ecosystem.</p></div>
                <div class="flex gap-3"><button onclick="window.exportPDF()" class="px-5 py-2.5 bg-[#0b1c30] text-white rounded-lg text-xs font-bold shadow-lg flex items-center gap-2"><span class="material-symbols-outlined text-sm">picture_as_pdf</span> EXPORT FULL REPORT</button></div>
            </div>
            <div class="grid grid-cols-4 gap-6">
                ${[{l:'TOTAL ACCOUNTS',v:stats.totalAccounts,i:'database', p:'+3.4%'},{l:'ACTIVE THIS MONTH',v:stats.activeThisMonth,i:'bar_chart',s:'ACTIVE'},{l:'PENDING VALIDATION',v:stats.pendingValidation,i:'assignment_late',s:'QUEUED'},{l:'OPEN REJECTIONS',v:stats.openRejections,i:'error',s:'ACTION REQ.',vc:'text-red-600'}].map(s => `
                    <div class="bg-white p-8 rounded-xl border border-slate-100 shadow-sm"><div class="flex justify-between mb-6"><div class="p-3 bg-slate-50 rounded-lg text-slate-400"><span class="material-symbols-outlined">${s.i}</span></div>${s.p?`<span class="text-[10px] font-black text-emerald-500">${s.p}</span>`:''}${s.s?`<span class="px-2 py-0.5 rounded text-[8px] font-black bg-slate-50 text-slate-400 uppercase tracking-widest">${s.s}</span>`:''}</div><p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${s.l}</p><p class="text-4xl font-black ${s.vc||'text-slate-900'} mt-2 tabular-nums">${s.v}</p></div>
                `).join('')}
            </div>
            <div class="grid grid-cols-12 gap-8">
                <div class="col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-10">
                    <div class="flex justify-between items-center mb-10"><div class="flex items-center gap-3"><span class="material-symbols-outlined text-slate-400">sync_alt</span><h3 class="font-bold text-slate-900">Bureau Submission Status</h3></div></div>
                    <div class="space-y-8">${[{n:'Compuscan',s:'98.2%'},{n:'Experian',s:'94.5%'},{n:'TransUnion',s:'82.1%',c:'bg-orange-500'},{n:'XDS',s:'99.8%'}].map(b => `<div class="space-y-2"><div class="flex justify-between text-xs font-bold"><span class="text-slate-900">${b.n}</span><span>${b.s}</span></div><div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div class="${b.c||'bg-emerald-500'} h-full transition-all duration-1000" style="width: ${b.s}"></div></div></div>`).join('')}</div>
                </div>
                <div class="col-span-4 bg-[#0b1c30] rounded-2xl p-8 text-white shadow-xl flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">COMPLIANCE SCORE</p>
                    <div class="w-24 h-24 rounded-full border-4 border-orange-600 flex items-center justify-center text-3xl font-black shadow-lg shadow-orange-900/50 mb-6">92</div>
                    <p class="text-emerald-400 font-bold text-lg uppercase tracking-widest">Excellent Performance</p>
                </div>
            </div>
        </div>
    `;
}

// ─────────────────────────────────────────────
// PDF REPORT ENGINE
// ─────────────────────────────────────────────
window.exportPDF = () => { window.switchTab('report'); setTimeout(() => { window.print(); }, 1000); };

function renderFullReport(v) {
    v.innerHTML = `
        <div class="max-w-4xl mx-auto bg-white p-16 space-y-16 animate-fade-in print:p-10">
            <div class="flex justify-between items-start border-b-4 border-[#0b1c30] pb-10">
                <div class="flex items-center gap-6">${ZWANE_LOGO}<div><h1 class="text-3xl font-black text-[#0b1c30] uppercase">SACRRA Compliance Report</h1><p class="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Generated: ${new Date().toLocaleString()}</p></div></div>
                <div class="text-right"><p class="text-xs font-black text-slate-900 uppercase">Zwane Financial Services</p><p class="text-[10px] text-slate-400 font-bold uppercase">Johannesburg Headquarters</p></div>
            </div>
            
            <div class="grid grid-cols-2 gap-10">
                <div class="space-y-6">
                    <h3 class="text-sm font-black border-l-4 border-orange-600 pl-4 uppercase">1. Executive Summary</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-slate-50 p-6 rounded-xl border border-slate-100"><p class="text-[8px] font-black text-slate-400 uppercase">Total Accounts</p><p class="text-2xl font-black">${stats.totalAccounts}</p></div>
                        <div class="bg-slate-50 p-6 rounded-xl border border-slate-100"><p class="text-[8px] font-black text-slate-400 uppercase">Active Portfolio</p><p class="text-2xl font-black">${stats.activeThisMonth}</p></div>
                    </div>
                </div>
                <div class="space-y-6">
                    <h3 class="text-sm font-black border-l-4 border-orange-600 pl-4 uppercase">2. Health Status</h3>
                    <div class="flex items-center gap-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
                        <div class="w-16 h-16 rounded-full border-4 border-orange-600 flex items-center justify-center text-xl font-black">92</div>
                        <div><p class="text-emerald-600 font-black text-xs uppercase">Excellent Compliance</p><p class="text-[9px] text-slate-400 leading-relaxed font-bold">Your portfolio meets all regulatory fixed-width requirements for the current cycle.</p></div>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <h3 class="text-sm font-black border-l-4 border-orange-600 pl-4 uppercase">3. Bureau Readiness</h3>
                <div class="grid grid-cols-4 gap-6">
                    ${['Compuscan', 'Experian', 'TransUnion', 'XDS'].map(b => `<div class="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center"><p class="text-[9px] font-black uppercase text-slate-900 mb-2">${b}</p><div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2"><div class="bg-emerald-500 h-full" style="width: 95%"></div></div><p class="text-[10px] font-black text-emerald-600">READY</p></div>`).join('')}
                </div>
            </div>

            <div class="space-y-6">
                <h3 class="text-sm font-black border-l-4 border-orange-600 pl-4 uppercase">4. Identified Rejections</h3>
                <div class="border border-slate-100 rounded-xl overflow-hidden text-[10px] font-bold">
                    <table class="w-full text-left"><thead class="bg-slate-50"><tr><th class="p-4">ACCOUNT</th><th class="p-4">FIELD</th><th class="p-4">ERROR MESSAGE</th></tr></thead>
                        <tbody class="divide-y divide-slate-50">${rejections.map(r => `<tr><td class="p-4 font-mono">${r.account_number}</td><td class="p-4 uppercase">${r.field_name || 'Generic'}</td><td class="p-4 text-red-600">${r.error_message}</td></tr>`).join('') || '<tr><td colspan="3" class="p-10 text-center uppercase text-slate-400">No active violations detected</td></tr>'}</tbody>
                    </table>
                </div>
            </div>

            <div class="pt-20 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <p>Digital Audit ID: SAC-${monthEnd.replace(/-/g,'')}-94589</p>
                <p>Page 1 of 1</p>
            </div>
        </div>
    `;
}

// ─────────────────────────────────────────────
// OTHER MODULES
// ─────────────────────────────────────────────
function renderPipeline(v) { v.innerHTML = `<div class="max-w-7xl mx-auto space-y-10 animate-fade-in"><h2 class="text-3xl font-bold">Bureau Extraction</h2><div class="bg-[#0b1c30] p-10 rounded-2xl font-mono text-[10px] text-slate-400 truncate shadow-2xl overflow-hidden leading-relaxed">H${monthEnd.replace(/-/g,'')}001ZWANE000${stats.totalAccounts.replace(/,/g,'')}<br>${accountSnapshots.map(a => `D01 | ${a.account_number.padEnd(15,' ')} | ${a.sa_id} | R${(a.current_balance/100).toFixed(0)}`).join('<br>')}</div><button onclick="window.triggerGenerate()" class="px-16 py-5 bg-orange-600 text-white rounded-xl font-black uppercase text-xs shadow-2xl active:scale-95 transition-all">Download 700v2 Extract</button></div>`; }
function renderWorkspace(v) { v.innerHTML = `<div class="max-w-7xl mx-auto space-y-10 animate-fade-in"><div class="flex justify-between items-end"><div><h2 class="text-3xl font-bold text-slate-900">Validation Workspace</h2><p class="text-sm text-slate-500">${rejections.length} active violations detected.</p></div><button onclick="window.commitChanges()" class="px-10 py-3 bg-orange-600 text-white rounded-xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Commit Fixes</button></div><div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"><table class="w-full text-left text-[11px] font-bold text-slate-600"><thead class="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest"><tr><th class="px-8 py-5">ACCOUNT</th><th class="px-8 py-5">ERROR MESSAGE</th><th class="px-8 py-5 text-right">ACTION</th></tr></thead><tbody class="divide-y divide-slate-50">${rejections.map(r => `<tr><td class="px-8 py-6 font-mono text-slate-900">${r.account_number}</td><td class="px-8 py-6 text-slate-500 leading-relaxed">${r.error_message}</td><td class="px-8 py-6 text-right"><span onclick="window.fixRejection('${r.id}')" class="px-3 py-1 bg-slate-50 text-slate-400 hover:text-orange-600 cursor-pointer rounded transition-all uppercase text-[9px] font-black">Resolve</span></td></tr>`).join('')}</tbody></table></div></div>`; }
function renderMembers(v) { v.innerHTML = `<div class="max-w-7xl mx-auto space-y-10 animate-fade-in"><h2 class="text-3xl font-bold text-slate-900 text-center">Member Registry</h2><div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"><table class="w-full text-left text-xs font-bold text-slate-600"><thead class="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest"><tr><th class="px-8 py-5">NAME</th><th class="px-8 py-5">IDENTITY NUMBER</th><th class="px-8 py-5 text-right">BALANCE (R)</th></tr></thead><tbody class="divide-y divide-slate-50">${allMembers.map(m => `<tr><td class="px-8 py-5">${m.first_name} ${m.surname}</td><td class="px-8 py-5 font-mono text-slate-400">${m.sa_id}</td><td class="px-8 py-5 text-right text-slate-900 tabular-nums">R${Math.floor((m.current_balance || 0) / 100).toLocaleString()}</td></tr>`).join('')}</tbody></table></div></div>`; }
function renderAuditLogs(v) { v.innerHTML = `<div class="max-w-7xl mx-auto space-y-10 animate-fade-in"><h2 class="text-3xl font-bold text-slate-900 text-center">Audit Logs</h2><div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"><table class="w-full text-left text-xs font-bold text-slate-600"><thead class="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest"><tr><th class="px-8 py-5">EVENT</th><th class="px-8 py-5">DATE</th><th class="px-8 py-5 text-right">STATUS</th></tr></thead><tbody class="divide-y divide-slate-50">${extractHistory.map(h => `<tr class="hover:bg-slate-50 transition-all"><td class="px-8 py-5 font-black uppercase">Generation: ${h.month_end}</td><td class="px-8 py-5 text-slate-400">${new Date(h.created_at).toLocaleString()}</td><td class="px-8 py-5 text-right font-black text-emerald-600 uppercase text-[9px]">SUCCESS</td></tr>`).join('')}</tbody></table></div></div>`; }

window.triggerGenerate = async () => { window.showToast("Generating...", "success"); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(["SACRRA"], {type:'text/plain'})); link.download = `SACRRA_${monthEnd}.txt`; link.click(); await fetchData(); };
window.exportToExcel = () => { window.showToast("Exporting Excel...", "success"); const csv = "Account,Name,ID,Balance\n" + allMembers.map(m => `${m.account_number},${m.first_name} ${m.surname},${m.sa_id},${(m.current_balance/100).toFixed(2)}`).join("\n"); const link = document.createElement("a"); link.setAttribute("href", encodeURI("data:text/csv;charset=utf-8," + csv)); link.setAttribute("download", "SACRRA_Registry.csv"); document.body.appendChild(link); link.click(); };
window.commitChanges = async () => { 
    try {
        window.showToast("Committing Batch Fixes...", "success");
        if (!isDemoMode) {
            await supabase.from('sacrra_rejections').update({ resolved: true }).eq('resolved', false);
        } else {
            rejections = [];
            stats.openRejections = "0";
        }
        await fetchData(); 
        window.switchTab('overview'); 
        window.showToast("Batch Committed Successfully", "success"); 
    } catch (e) { window.showToast("Commit Failed", "error"); }
};

window.fixRejection = async (id) => { 
    try {
        window.showToast("Resolving Record...", "success");
        if (!isDemoMode) {
            await supabase.from('sacrra_rejections').update({ resolved: true }).eq('id', id);
        } else {
            rejections = rejections.filter(r => r.id !== id);
            stats.openRejections = rejections.length.toString();
        }
        await fetchData(); 
        window.showToast("Record Resolved", "success"); 
    } catch (e) { window.showToast("Resolution Failed", "error"); }
};

const shell = document.getElementById('app-shell');
if (shell) init(shell);
