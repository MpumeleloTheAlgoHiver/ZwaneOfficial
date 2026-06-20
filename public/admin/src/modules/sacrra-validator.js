import { initLayout } from '../shared/layout.js';
import { apiFetch } from '../shared/apiFetch.js';

let lastResults = null;
let activeFilter = 'all';

// ─────────────────────────────────────────────
// SA ID helpers (for CSV fallback)
// ─────────────────────────────────────────────
function validateLuhn(id) {
    if (!/^\d{13}$/.test(id)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        let n = parseInt(id[i]);
        if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
        sum += n;
    }
    return (10 - sum % 10) % 10 === parseInt(id[12]);
}

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
function render() {
    const shell = document.getElementById('app-shell');
    const main  = shell.querySelector('main') || shell;
    let content = main.querySelector('#validator-content');
    if (!content) {
        content = document.createElement('div');
        content.id = 'validator-content';
        content.className = 'p-6 max-w-5xl mx-auto';
        main.appendChild(content);
    }

    content.innerHTML = `
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span class="material-symbols-outlined" style="color:var(--color-primary,#E7762E)">fact_check</span>
            SACRRA Compliance Check
          </h1>
          <p class="text-sm text-gray-500 mt-0.5">Validates live database records against Layout 700v2 rules</p>
        </div>
        <a href="/admin/sacrra" class="text-xs font-bold text-orange-600 border border-orange-200 bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-lg flex items-center gap-1">
          <span class="material-symbols-outlined text-[16px]">arrow_back</span> Back to SACRRA
        </a>
      </div>

      <!-- One-click validate -->
      <div id="validate-cta" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center text-center gap-4 mb-6">
        <span class="material-symbols-outlined text-5xl text-gray-200">shield_check</span>
        <div>
          <p class="font-bold text-gray-900 text-lg">Check your live data now</p>
          <p class="text-sm text-gray-500 mt-1">Scans all records in the SACRRA view against the same rules the bureaux use to reject submissions.</p>
        </div>
        <button id="btn-validate" onclick="window._runValidation()"
          class="flex items-center gap-2 px-8 py-3 text-white font-bold rounded-xl text-sm transition-all hover:-translate-y-0.5 shadow-md"
          style="background:var(--color-primary,#E7762E)">
          <span class="material-symbols-outlined text-[18px]">play_arrow</span>
          Run Compliance Check
        </button>
      </div>

      <!-- Results (hidden until run) -->
      <div id="results-panel" class="hidden space-y-4">

        <!-- Summary cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Total Records</p>
            <p id="s-total" class="text-3xl font-black text-gray-900">—</p>
          </div>
          <div class="bg-white rounded-2xl border border-green-100 p-4 text-center">
            <p class="text-[10px] font-bold uppercase tracking-widest text-green-500 mb-1">Passing</p>
            <p id="s-pass" class="text-3xl font-black text-green-600">—</p>
          </div>
          <div class="bg-white rounded-2xl border border-red-100 p-4 text-center">
            <p class="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Issues Found</p>
            <p id="s-fail" class="text-3xl font-black text-red-600">—</p>
          </div>
          <div class="bg-white rounded-2xl border border-orange-100 p-4 text-center">
            <p class="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-1">Compliance</p>
            <p id="s-pct" class="text-3xl font-black text-orange-600">—</p>
          </div>
        </div>

        <!-- Issue breakdown -->
        <div id="issue-breakdown" class="bg-white rounded-2xl border border-gray-100 p-5 hidden">
          <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Issue Breakdown</p>
          <div id="breakdown-list" class="space-y-2"></div>
        </div>

        <!-- Records table -->
        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div class="flex gap-1">
              <button data-filter="all"    class="filter-tab px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100">All Issues</button>
              <button data-filter="balance" class="filter-tab px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-gray-50">Balance</button>
              <button data-filter="id"      class="filter-tab px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-gray-50">ID / Name</button>
              <button data-filter="payment" class="filter-tab px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-gray-50">Payment Date</button>
              <button data-filter="stale"   class="filter-tab px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-gray-50">36-Month</button>
            </div>
            <button onclick="window._runValidation()" class="text-xs font-bold text-orange-600 flex items-center gap-1 hover:underline">
              <span class="material-symbols-outlined text-[14px]">refresh</span> Re-run
            </button>
          </div>
          <div id="table-wrap" class="overflow-x-auto max-h-[500px]">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Account</th>
                  <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                  <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Issues</th>
                </tr>
              </thead>
              <tbody id="results-tbody"></tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    document.querySelectorAll('.filter-tab').forEach(t => {
        t.addEventListener('click', e => {
            document.querySelectorAll('.filter-tab').forEach(x => x.classList.remove('bg-gray-100'));
            e.target.classList.add('bg-gray-100');
            activeFilter = e.target.dataset.filter;
            renderTable();
        });
    });
}

// ─────────────────────────────────────────────
// VALIDATE
// ─────────────────────────────────────────────
window._runValidation = async function () {
    const btn = document.getElementById('btn-validate');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">refresh</span> Checking…'; }

    try {
        const res  = await apiFetch('/api/sacrra/validate');
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Validation failed');
        lastResults = data;
        showResults(data);
    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">play_arrow</span> Run Compliance Check'; }
    }
};

function showResults(data) {
    const { summary, failed } = data;

    document.getElementById('s-total').textContent = summary.total.toLocaleString();
    document.getElementById('s-pass').textContent  = summary.passed.toLocaleString();
    document.getElementById('s-fail').textContent  = summary.failed.toLocaleString();
    document.getElementById('s-pct').textContent   = summary.compliance + '%';

    // Issue breakdown
    const byField = summary.by_field || {};
    if (Object.keys(byField).length) {
        const list = document.getElementById('breakdown-list');
        const sorted = Object.entries(byField).sort((a,b) => b[1] - a[1]);
        const max = sorted[0][1];
        list.innerHTML = sorted.map(([field, count]) => `
          <div class="flex items-center gap-3">
            <span class="text-xs font-semibold text-gray-700 w-52 shrink-0">${field}</span>
            <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div class="h-2 rounded-full bg-red-400" style="width:${Math.round(count/max*100)}%"></div>
            </div>
            <span class="text-xs font-bold text-red-600 w-12 text-right">${count}</span>
          </div>`).join('');
        document.getElementById('issue-breakdown').classList.remove('hidden');
    }

    document.getElementById('results-panel').classList.remove('hidden');
    document.getElementById('validate-cta').classList.add('hidden');
    renderTable();
}

const FILTER_KEYWORDS = {
    balance: ['balance','installment','overdue'],
    id:      ['id','surname','first names','name'],
    payment: ['payment','last payment'],
    stale:   ['36-month','36 month','stale']
};

function renderTable() {
    const tbody = document.getElementById('results-tbody');
    if (!lastResults) return;

    let rows = lastResults.failed;
    if (activeFilter !== 'all') {
        const kw = FILTER_KEYWORDS[activeFilter] || [];
        rows = rows.filter(r => r.issues.some(i =>
            kw.some(k => i.field.toLowerCase().includes(k) || i.msg.toLowerCase().includes(k))
        ));
    }

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-10 text-center text-gray-400 text-sm">
          ${activeFilter === 'all' ? '✅ No issues found — all records pass Layout 700v2 rules.' : 'No records match this filter.'}
        </td></tr>`;
        return;
    }

    tbody.innerHTML = rows.slice(0, 500).map(r => `
      <tr class="border-t border-gray-50 hover:bg-red-50/30">
        <td class="px-4 py-3 text-xs font-mono text-gray-600">${r.account || r.id}</td>
        <td class="px-4 py-3 text-xs font-semibold text-gray-900">${r.name || '—'}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
            r.status === 'T' ? 'bg-gray-100 text-gray-500' :
            r.status === 'V' ? 'bg-purple-50 text-purple-600' :
            'bg-green-50 text-green-700'
          }">${r.status === 'T' ? 'CLOSED' : r.status === 'V' ? 'VOID' : 'ACTIVE'}</span>
        </td>
        <td class="px-4 py-3">
          <div class="space-y-0.5">
            ${r.issues.map(i => `
              <div class="flex items-start gap-1.5">
                <span class="material-symbols-outlined text-red-400 text-[13px] mt-0.5 shrink-0">error</span>
                <span class="text-[11px] text-gray-700"><strong class="text-red-600">${i.field}:</strong> ${i.msg}</span>
              </div>`).join('')}
          </div>
        </td>
      </tr>`).join('');

    if (rows.length > 500) {
        tbody.innerHTML += `<tr><td colspan="4" class="p-4 text-center text-xs text-gray-400 bg-gray-50">
          Showing 500 of ${rows.length} — all issues counted in summary above.
        </td></tr>`;
    }
}

// ─────────────────────────────────────────────
// BOOTSTRAP
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await initLayout({ pageTitle: 'SACRRA Validator', activeNav: 'sacrra' });
    render();
});
