import { supabase } from '../services/supabaseClient.js';

const sacrraState = {
    view: 'overview',
    environment: 'PRODUCTION',
    loading: false,
    members: [],
    submissions: [],
    rejections: [],
    stats: {
        score: '0%',
        activeIssues: '0',
        totalRecords: '0',
        bureauAcceptance: {
            experian: 'PENDING',
            transunion: 'PENDING',
            xds: 'PENDING'
        }
    },
    exportSettings: {
        type: 'MONTHLY', 
        prefix: 'D'     
    }
};

export async function init(container) {
    container.innerHTML = `
        <div id="sacrra-portal" class="flex min-h-screen bg-[#fff8f6] font-sans text-slate-800">
            <aside id="sacrra-sidebar" class="fixed left-0 top-0 h-full w-[280px] z-40 bg-white border-r border-slate-200 shadow-[20px_0_40px_rgba(0,0,0,0.02)] flex flex-col py-8">
                <div class="px-8 mb-10">
                    <img src="/admin/assets/zfs-logo.png" alt="Zwane Financial Services" class="h-16 w-auto object-contain mb-2">
                    <div class="flex items-center gap-2 px-1">
                        <span class="w-2 h-2 rounded-full bg-[#a04100]"></span>
                        <p class="text-[10px] font-black text-[#a04100] uppercase tracking-[0.2em]">Compliance Engine</p>
                    </div>
                </div>

                <div class="px-4 mb-8">
                    <button onclick="window.location.href='/admin/dashboard'" class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all group">
                        <span class="material-symbols-outlined group-hover:text-slate-900">home</span>
                        <span class="font-black text-xs uppercase tracking-widest group-hover:text-slate-900">Return Home</span>
                    </button>
                </div>

                <nav id="sacrra-nav" class="flex-1 px-4 space-y-2"></nav>
                <div class="px-6 pt-6 border-t border-slate-100 mt-auto">
                    <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">System Status</p>
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span class="text-xs font-bold text-slate-700">700v2 Engine Live</span>
                        </div>
                    </div>
                </div>
            </aside>

            <main class="flex-1 ml-[280px] min-h-screen flex flex-col">
                <header class="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-10 py-6 flex justify-between items-center">
                    <div id="sacrra-header-title">
                        <h2 class="text-2xl font-black text-slate-900 tracking-tight">Compliance Dashboard</h2>
                        <p class="text-sm font-medium text-slate-500">Fixed-Width Formatting Engine</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <button onclick="window.refreshSacrraData()" class="p-3 bg-slate-50 text-slate-600 hover:bg-white hover:shadow-md rounded-xl transition-all">
                            <span class="material-symbols-outlined ${sacrraState.loading ? 'animate-spin' : ''}">refresh</span>
                        </button>
                        <button onclick="window.showExportModal()" class="flex items-center gap-2 px-6 py-3 bg-[#a04100] text-white rounded-xl font-bold shadow-lg shadow-orange-700/20 hover:translate-y-[-2px] transition-all">
                            <span class="material-symbols-outlined text-lg">ios_share</span>
                            Generate Compliance File
                        </button>
                    </div>
                </header>

                <div id="sacrra-canvas" class="p-10 flex-1"></div>
            </main>
        </div>

        <div id="export-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm hidden opacity-0 transition-all duration-300">
            <div class="bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-10 transform scale-95 transition-all">
                <div class="flex justify-between items-center mb-8">
                    <h3 class="text-2xl font-black text-slate-900">Export Parameters</h3>
                    <button onclick="window.hideExportModal()" class="text-slate-400 hover:text-slate-900 transition-all">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="space-y-6">
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Submission Type</label>
                        <div class="grid grid-cols-2 gap-4">
                            <button onclick="window.setExportType('MONTHLY')" id="btn-monthly" class="p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2">
                                <span class="material-symbols-outlined text-3xl">calendar_month</span>
                                <span class="font-bold text-slate-900">Monthly</span>
                            </button>
                            <button onclick="window.setExportType('DAILY')" id="btn-daily" class="p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2">
                                <span class="material-symbols-outlined text-3xl">timer</span>
                                <span class="font-bold text-slate-900">Daily</span>
                            </button>
                        </div>
                    </div>
                    <div id="daily-options" class="hidden">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Record Prefix</label>
                        <div class="flex gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                            <button onclick="window.setExportPrefix('R')" id="prefix-r" class="flex-1 py-3 rounded-xl font-bold text-xs">R (Registration)</button>
                            <button onclick="window.setExportPrefix('C')" id="prefix-c" class="flex-1 py-3 rounded-xl font-bold text-xs">C (Correction)</button>
                            <button onclick="window.setExportPrefix('D')" id="prefix-d" class="flex-1 py-3 rounded-xl font-bold text-xs">D (Data)</button>
                        </div>
                    </div>
                </div>
                <div class="mt-12 flex gap-4">
                    <button onclick="window.hideExportModal()" class="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                    <button onclick="window.generateSacrraFile()" class="flex-1 py-4 bg-[#a04100] text-white font-black rounded-2xl shadow-xl shadow-orange-900/20 hover:scale-[1.02] active:scale-95 transition-all">Download .TXT</button>
                </div>
            </div>
        </div>
    `;
    
    setupGlobalHandlers();

    try {
        await fetchData();
        renderView();
    } catch (e) {
        console.error("SACRRA Initialization Failed:", e);
    }
}

function setupGlobalHandlers() {
    window.switchSacrraView = (view) => { sacrraState.view = view; renderView(); };
    window.refreshSacrraData = async () => { await fetchData(); renderView(); };
    window.setExportType = (type) => { 
        sacrraState.exportSettings.type = type; 
        renderExportModalUI(); 
    };
    window.setExportPrefix = (prefix) => { 
        sacrraState.exportSettings.prefix = prefix; 
        renderExportModalUI(); 
    };
    window.showExportModal = () => { 
        const modal = document.getElementById('export-modal');
        modal.classList.remove('hidden');
        renderExportModalUI();
        setTimeout(() => { 
            modal.classList.remove('opacity-0'); 
            modal.children[0].classList.remove('scale-95'); 
        }, 10);
    };
    window.hideExportModal = () => {
        const modal = document.getElementById('export-modal');
        modal.classList.add('opacity-0');
        modal.children[0].classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    window.processBureauFile = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            const lines = content.split('\n');
            const newRejections = [];
            
            for (const line of lines) {
                if (line.startsWith('R') || line.startsWith('E')) { // Error/Rejection markers
                    const matchKey = line.substring(1, 41).trim();
                    const errorCode = line.substring(41, 45).trim();
                    const errorMessage = line.substring(45, 100).trim();
                    
                    if (matchKey && errorCode) {
                        newRejections.push({
                            match_key: matchKey,
                            error_code: errorCode,
                            error_message: errorMessage
                        });
                    }
                }
            }
            
            if (newRejections.length > 0) {
                await supabase.from('sacrra_rejections').insert(newRejections);
                alert(`Successfully parsed ${newRejections.length} bureau rejections.`);
                await fetchData();
                renderView();
            } else {
                alert("No rejection codes found in file.");
            }
        };
        reader.readAsText(file);
    };
}

async function fetchData() {
    sacrraState.loading = true;
    try {
        const [membersRes, historyRes, rejectionsRes] = await Promise.all([
            supabase.from('sacrra_700_view').select('*'),
            supabase.from('sacrra_submissions').select('*').order('created_at', { ascending: false }).limit(10),
            supabase.from('sacrra_rejections').select('*').eq('resolved', false)
        ]);
        
        if (membersRes.error) throw membersRes.error;
        
        sacrraState.members = (membersRes.data || []).map(m => ({
            ...m,
            isValidId: validateSAID(m.f10_id_number),
            matchKey: (m.f02_supplier_ref?.trim() || '') + (m.f40_account_number?.trim() || '')
        }));
        
        sacrraState.submissions = historyRes.data || [];
        sacrraState.rejections = rejectionsRes.data || [];
        
        const total = sacrraState.members.length;
        const issues = sacrraState.members.filter(m => !m.isValidId).length;
        
        sacrraState.stats = {
            score: total > 0 ? `${(((total - issues) / total) * 100).toFixed(1)}%` : '100%',
            activeIssues: issues.toString(),
            totalRecords: total.toString(),
            bureauAcceptance: {
                experian: sacrraState.submissions.some(s => s.status === 'ACCEPTED') ? 'VERIFIED' : 'PENDING',
                transunion: 'PENDING',
                xds: 'PENDING'
            }
        };
    } catch (e) {
        console.error("Data Load Error", e);
    } finally {
        sacrraState.loading = false;
    }
}

function validateSAID(id) {
    if (!id || id.trim().length !== 13) return false;
    let nCheck = 0, bEven = false;
    for (let n = id.trim().length - 1; n >= 0; n--) {
        let nDigit = parseInt(id.trim().charAt(n), 10);
        if (bEven && (nDigit *= 2) > 9) nDigit -= 9;
        nCheck += nDigit;
        bEven = !bEven;
    }
    return (nCheck % 10) === 0;
}

function renderView() {
    const nav = document.getElementById('sacrra-nav');
    const canvas = document.getElementById('sacrra-canvas');
    if (!nav || !canvas) return;

    nav.innerHTML = `
        <div class="px-6 mb-10">
            <div class="flex items-center gap-3 mb-8">
                <div class="w-10 h-10 bg-[#a04100] rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-900/20">
                    <span class="material-symbols-outlined fill-1">account_balance</span>
                </div>
                <div>
                    <h1 class="text-sm font-black text-slate-900 uppercase tracking-tighter">Zwane Official</h1>
                    <p class="text-[9px] font-bold text-orange-600 uppercase tracking-widest">Compliance Engine</p>
                </div>
            </div>
            <a href="index.html" class="w-full flex items-center gap-4 px-6 py-3 bg-slate-900 text-white rounded-xl shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-all mb-4">
                <span class="material-symbols-outlined text-sm">home</span>
                <span class="font-black text-[10px] uppercase tracking-widest">Return Home</span>
            </a>
        </div>
        ${renderNavItem('overview', 'dashboard', 'Dashboard')}
        ${renderNavItem('pipeline', 'account_tree', 'Submissions')}
        ${renderNavItem('parser', 'error', 'Rejections')}
    `;

    switch (sacrraState.view) {
        case 'overview': renderOverview(canvas); break;
        case 'pipeline': renderPipeline(canvas); break;
        case 'parser': renderParser(canvas); break;
        default: renderOverview(canvas);
    }
}

function renderNavItem(view, icon, label) {
    const active = sacrraState.view === view;
    return `
        <button onclick="window.switchSacrraView('${view}')" class="w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${active ? 'bg-orange-50 text-[#a04100] shadow-sm shadow-orange-900/5' : 'text-slate-500 hover:bg-slate-50'}">
            <span class="material-symbols-outlined ${active ? 'fill-1' : ''}">${icon}</span>
            <span class="font-black text-xs uppercase tracking-widest">${label}</span>
            ${active ? '<div class="ml-auto w-1.5 h-1.5 rounded-full bg-[#a04100]"></div>' : ''}
        </button>
    `;
}

function renderOverview(container) {
    container.innerHTML = `
        <div class="grid grid-cols-12 gap-8 mb-10">
            <div class="col-span-12 lg:col-span-4 bg-gradient-to-br from-[#a04100] to-[#6a2b00] p-8 rounded-[32px] shadow-2xl shadow-orange-900/20 text-white relative overflow-hidden group">
                <p class="text-white/70 font-bold uppercase tracking-widest text-[10px] mb-4">Compliance Score</p>
                <h3 class="text-6xl font-black mb-2">${sacrraState.stats.score}</h3>
                <div class="flex items-center gap-2 text-white/80 text-sm font-bold">
                    <span class="material-symbols-outlined text-sm">check_circle</span>
                    Institutional Schema Verified
                </div>
            </div>
            
            <div class="col-span-12 md:col-span-6 lg:col-span-4 bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm">
                <div class="flex justify-between items-start mb-6">
                    <div class="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                        <span class="material-symbols-outlined">warning</span>
                    </div>
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Bureau Health</span>
                </div>
                <div class="space-y-3">
                    ${renderBureauStatus('Experian', sacrraState.stats.bureauAcceptance.experian)}
                    ${renderBureauStatus('TransUnion', sacrraState.stats.bureauAcceptance.transunion)}
                </div>
            </div>

            <div class="col-span-12 md:col-span-6 lg:col-span-4 bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm flex flex-col justify-between">
                <div>
                    <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                        <span class="material-symbols-outlined">database</span>
                    </div>
                    <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Live Records</p>
                    <h3 class="text-4xl font-black text-slate-900">${sacrraState.stats.totalRecords}</h3>
                </div>
                <p class="text-xs font-bold text-blue-500 mt-4 bg-blue-50 px-3 py-1 rounded-full w-fit">Production Ready</p>
            </div>
        </div>
        <div id="sacrra-issue-workspace" class="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div class="px-8 py-8 border-b border-slate-50 flex justify-between items-center">
                <div>
                    <h3 class="text-xl font-black text-slate-900 tracking-tight">Issue Workspace</h3>
                    <p class="text-xs font-medium text-slate-500 mt-1">High-priority records requiring institutional correction</p>
                </div>
            </div>
            <div id="issue-list-container"></div>
        </div>
    `;
    renderIssueList();
}

function renderBureauStatus(name, status) {
    const isVerified = status === 'VERIFIED';
    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-600">${name}</span>
            <div class="flex items-center gap-2">
                <span class="text-[9px] font-black uppercase tracking-widest ${isVerified ? 'text-emerald-600' : 'text-slate-400'}">${status}</span>
                <span class="w-2 h-2 rounded-full ${isVerified ? 'bg-emerald-500' : 'bg-slate-200'}"></span>
            </div>
        </div>
    `;
}

function renderIssueList() {
    const container = document.getElementById('issue-list-container');
    if (!container) return;
    
    // DETECT DEEP COMPLIANCE ISSUES
    const issues = sacrraState.members.filter(m => {
        m.issues = [];
        if (!m.isValidId) m.issues.push('ID_LUHN_FAIL');
        if (!m.f13_address_1.trim()) m.issues.push('MISSING_ADDRESS');
        if (!m.f35_employer.trim()) m.issues.push('MISSING_EMPLOYER');
        if (!m.f10_id_number.trim()) m.issues.push('EMPTY_IDENTITY');
        return m.issues.length > 0;
    });
    
    if (issues.length === 0) {
        container.innerHTML = `
            <div class="p-20 flex flex-col items-center justify-center text-center">
                <div class="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                    <span class="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <h4 class="text-lg font-black text-slate-900">Zero Integrity Issues</h4>
                <p class="text-slate-500 text-sm max-w-xs mt-2">All identity records are bureau-compliant and pass the Deep Compliance audit.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <table class="w-full text-left">
            <thead>
                <tr class="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th class="px-8 py-5">Record Member</th>
                    <th class="px-6 py-5">Detected Integrity Issues</th>
                    <th class="px-8 py-5 text-right">Surgical Action</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
                ${issues.map(i => `
                    <tr class="hover:bg-slate-50/80 transition-colors group">
                        <td class="px-8 py-6">
                            <div class="font-bold text-slate-900 text-sm">${i.f07_first_names.trim()} ${i.f06_surname.trim()}</div>
                            <div class="text-[10px] font-mono text-slate-400 mt-1">${i.f10_id_number || 'NO ID'}</div>
                        </td>
                        <td class="px-6 py-6">
                            <div class="flex flex-wrap gap-2">
                                ${i.issues.map(issue => `
                                    <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${issue.includes('MISSING') ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}">
                                        ${issue.replace(/_/g, ' ')}
                                    </span>
                                `).join('')}
                            </div>
                        </td>
                        <td class="px-8 py-6 text-right">
                            <button onclick="window.showSurgicalFix('${i.internal_id}')" class="px-4 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase hover:scale-[1.05] active:scale-95 shadow-lg shadow-slate-900/10 transition-all">Surgical Fix</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

window.showSurgicalFix = async (loanId) => {
    const member = sacrraState.members.find(m => m.internal_id === loanId);
    if (!member) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6';
    modal.innerHTML = `
        <div class="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-10 relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div class="flex justify-between items-start mb-8">
                <div>
                    <h2 class="text-2xl font-black text-slate-900 tracking-tight">Surgical Correction</h2>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Refining record: ${member.f07_first_names.trim()} ${member.f06_surname.trim()}</p>
                </div>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="grid grid-cols-2 gap-6">
                <div class="col-span-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Full Residential Address</label>
                    <input id="fix-address" class="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" value="${member.f13_address_1.trim()}" placeholder="1 Main Street">
                </div>
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Employer Name</label>
                    <input id="fix-employer" class="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" value="${member.f35_employer.trim()}" placeholder="Oscorp">
                </div>
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Occupation</label>
                    <input id="fix-occupation" class="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" value="${member.f36_occupation.trim()}" placeholder="Clerk">
                </div>
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">ID Number</label>
                    <input id="fix-id" class="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" value="${member.f10_id_number.trim()}">
                </div>
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Middle Name</label>
                    <input id="fix-middle" class="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none" value="${member.f09_middle_names.trim()}" placeholder="Batman">
                </div>
            </div>

            <div class="mt-10 flex gap-4">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl">Cancel</button>
                <button id="save-fix-btn" class="flex-1 py-4 bg-[#a04100] text-white font-black rounded-2xl shadow-xl shadow-orange-900/20 hover:scale-[1.02] active:scale-95 transition-all">Save Changes</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('save-fix-btn').onclick = async () => {
        const btn = document.getElementById('save-fix-btn');
        btn.disabled = true;
        btn.innerText = 'Syncing...';

        try {
            // Find the profile ID from the loan record
            const { data: loan } = await supabase.from('loans').select('user_id').eq('id', loanId).single();
            
            await supabase.from('profiles').update({
                address_line_1: document.getElementById('fix-address').value,
                employer_name: document.getElementById('fix-employer').value,
                occupation: document.getElementById('fix-occupation').value,
                id_number: document.getElementById('fix-id').value,
                middle_name: document.getElementById('fix-middle').value
            }).eq('id', loan.user_id);

            modal.remove();
            await fetchData();
            renderView();
        } catch (err) {
            alert('Failed to save correction.');
            btn.disabled = false;
            btn.innerText = 'Save Changes';
        }
    };
};

function renderPipeline(container) {
    const history = sacrraState.submissions || [];
    container.innerHTML = `
        <div class="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div class="px-8 py-8 border-b border-slate-50 flex justify-between items-center">
                <div>
                    <h3 class="text-xl font-black text-slate-900 tracking-tight">Submission Pipeline</h3>
                    <p class="text-xs font-medium text-slate-500 mt-1">Audit trail of bureau file transmissions</p>
                </div>
                <span class="px-4 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full uppercase">${history.length} Recent Files</span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                            <th class="px-8 py-5">File Name</th>
                            <th class="px-6 py-5">Type</th>
                            <th class="px-6 py-5">Records</th>
                            <th class="px-6 py-5">Status</th>
                            <th class="px-8 py-5 text-right">Submitted At</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        ${history.map(s => `
                            <tr>
                                <td class="px-8 py-6 font-bold text-slate-900 text-sm">${s.file_name}</td>
                                <td class="px-6 py-6"><span class="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase">${s.submission_type}</span></td>
                                <td class="px-6 py-6 font-black text-slate-700">${s.record_count}</td>
                                <td class="px-6 py-6">
                                    <div class="flex items-center gap-2">
                                        <span class="w-1.5 h-1.5 rounded-full ${s.status === 'ACCEPTED' ? 'bg-emerald-500' : 'bg-orange-500'}"></span>
                                        <span class="text-xs font-bold ${s.status === 'ACCEPTED' ? 'text-emerald-600' : 'text-orange-600'}">${s.status}</span>
                                    </div>
                                </td>
                                <td class="px-8 py-6 text-right text-xs font-bold text-slate-400">${new Date(s.created_at).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderParser(container) {
    container.innerHTML = `
        <div class="flex flex-col gap-8">
            <div class="bg-white p-12 rounded-[40px] border-2 border-dashed border-slate-100 flex flex-col items-center text-center relative group overflow-hidden">
                <input type="file" onchange="window.processBureauFile(event)" class="absolute inset-0 opacity-0 cursor-pointer z-10">
                <div class="w-24 h-24 bg-orange-50 text-[#a04100] rounded-[32px] flex items-center justify-center mb-8 shadow-xl shadow-orange-900/10 group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-4xl">upload_file</span>
                </div>
                <h3 class="text-2xl font-black text-slate-900 tracking-tight">Rejection Parser</h3>
                <p class="text-slate-500 max-w-sm mt-2 font-medium">Drop the .TXT file provided by the Bureau here to automatically map and resolve rejection codes.</p>
                <div class="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Select Bureau File</div>
            </div>
            
            <div id="rejection-results" class="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div class="px-8 py-8 border-b border-slate-50">
                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Bureau Rejections</h4>
                </div>
                ${sacrraState.rejections.length === 0 ? `
                    <div class="p-12 text-center text-slate-300 font-bold text-xs uppercase tracking-widest">No active rejections found</div>
                ` : `
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                <th class="px-8 py-5">Match Key</th>
                                <th class="px-6 py-5">Error Code</th>
                                <th class="px-6 py-5">Message</th>
                                <th class="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            ${sacrraState.rejections.map(r => `
                                <tr>
                                    <td class="px-8 py-6 font-mono text-[10px] font-black text-slate-900">${r.match_key}</td>
                                    <td class="px-6 py-6 font-black text-red-600 text-xs">${r.error_code}</td>
                                    <td class="px-6 py-6 text-slate-500 text-xs font-medium">${r.error_message}</td>
                                    <td class="px-8 py-6 text-right">
                                        <button class="text-slate-400 hover:text-[#a04100] transition-colors"><span class="material-symbols-outlined">edit_note</span></button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `}
            </div>
        </div>
    `;
}

function renderExportModalUI() {
    const settings = sacrraState.exportSettings;
    const btnMonthly = document.getElementById('btn-monthly');
    const btnDaily = document.getElementById('btn-daily');
    const dailyOptions = document.getElementById('daily-options');
    
    if (settings.type === 'MONTHLY') {
        btnMonthly.classList.add('border-[#a04100]', 'bg-orange-50/50');
        btnMonthly.querySelector('.material-symbols-outlined').classList.add('text-[#a04100]');
        btnDaily.classList.remove('border-[#a04100]', 'bg-orange-50/50');
        btnDaily.querySelector('.material-symbols-outlined').classList.remove('text-[#a04100]');
        dailyOptions.classList.add('hidden');
    } else {
        btnDaily.classList.add('border-[#a04100]', 'bg-orange-50/50');
        btnDaily.querySelector('.material-symbols-outlined').classList.add('text-[#a04100]');
        btnMonthly.classList.remove('border-[#a04100]', 'bg-orange-50/50');
        btnMonthly.querySelector('.material-symbols-outlined').classList.remove('text-[#a04100]');
        dailyOptions.classList.remove('hidden');
    }

    ['R', 'C', 'D'].forEach(p => {
        const btn = document.getElementById(`prefix-${p.toLowerCase()}`);
        if (btn) {
            if (settings.prefix === p) {
                btn.classList.add('bg-white', 'shadow-sm', 'text-[#a04100]');
                btn.classList.remove('text-slate-500');
            } else {
                btn.classList.remove('bg-white', 'shadow-sm', 'text-[#a04100]');
                btn.classList.add('text-slate-500');
            }
        }
    });
}

window.generateSacrraFile = async () => {
    if (sacrraState.members.length === 0) return alert("No data found.");
    
    const settings = sacrraState.exportSettings;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `SACRRA_${settings.type}_${dateStr}.txt`;
    
    // Header Record (H)
    let fileContent = `H${dateStr}${'ZWANEFINANCE'.padEnd(20)}${'700V2'.padEnd(10)}${''.padEnd(659)}\n`;

    // Data Records (D) - SURGICAL SAMPLE ALIGNMENT
    sacrraState.members.forEach(m => {
        let line = settings.type === 'DAILY' ? settings.prefix : (m.f01_record_type || 'R'); 
        line += (m.f10_id_number || "").slice(0, 15).padEnd(15, " "); // Pos 2
        line += "".padEnd(15, " "); // SILENCE
        line += (m.f11_gender || "M").slice(0, 1).padEnd(1, " "); // Pos 32
        line += (m.f12_date_of_birth || "19000101").slice(0, 8).padEnd(8, " "); // Pos 33
        line += (m.f02_supplier_ref || "CS06626").slice(0, 15).padEnd(15, " "); // Pos 41
        line += (m.f40_match_index || "60").slice(0, 30).padEnd(30, " "); // Pos 56
        line += (m.f06_surname || "").toUpperCase().slice(0, 30).padEnd(30, " "); // Pos 86
        line += (m.f08_title || "MR").slice(0, 5).padEnd(5, " "); // Pos 116
        line += (m.f07_first_names || "").toUpperCase().slice(0, 30).padEnd(30, " "); // Pos 121
        line += (m.f09_middle_names || "").toUpperCase().slice(0, 15).padEnd(15, " "); // NEW: Middle
        
        // ADDRESS & EMPLOYMENT BLOCK
        line += (m.f13_address_1 || "").slice(0, 30).padEnd(30, " ");
        line += (m.f14_address_2 || "").slice(0, 30).padEnd(30, " ");
        line += (m.f15_city || "").slice(0, 30).padEnd(30, " ");
        line += (m.f16_province || "").slice(0, 30).padEnd(30, " ");
        line += (m.f17_postal || "").slice(0, 10).padEnd(10, " ");
        line += (m.f35_employer || "").slice(0, 50).padEnd(50, " ");
        line += (m.f36_occupation || "").slice(0, 30).padEnd(30, " ");

        // LIFECYCLE BLOCK
        line += "00O ".padEnd(4, " ");
        line += "00M ".padEnd(4, " ");
        line += (m.f43_date_opened || "20230302").slice(0, 8).padEnd(8, " ");
        line += (m.f44_current_balance || "000000000000").slice(0, 12).padEnd(12, " ");
        line += (m.f45_installment || "000000000000").slice(0, 12).padEnd(12, " ");
        line += (m.f49_arrears_amount || "000000000000").slice(0, 12).padEnd(12, " ");
        line += (m.f50_status_code || "00").slice(0, 2).padEnd(2, " ");

        // CONTACT MATRIX
        line += (m.f31_mobile || "").slice(0, 15).padEnd(15, " ");
        line += (m.f32_work || "").slice(0, 15).padEnd(15, " ");
        
        fileContent += line.padEnd(700, " ").slice(0, 700) + "\n";
    });

    // Trailer Record (T)
    const trailerCount = sacrraState.members.length.toString().padStart(10, '0');
    fileContent += `T${trailerCount}${''.padEnd(689)}\n`;

    // Log to Database
    await supabase.from('sacrra_submissions').insert([{
        file_name: fileName,
        submission_type: settings.type,
        record_count: sacrraState.members.length,
        status: 'PENDING'
    }]);

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    
    window.hideExportModal();
    setTimeout(() => window.refreshSacrraData(), 1000);
};
