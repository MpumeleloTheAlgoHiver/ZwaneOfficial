import { initLayout } from '../shared/layout.js';

let mandatesData = [];
let currentMandate = null;

const THEME = {
  success: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: 'fa-check-circle' },
  failed: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: 'fa-circle-xmark' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: 'fa-clock' },
  unknown: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', icon: 'fa-circle-question' }
};

const getTheme = (status) => THEME[status?.toLowerCase()] || THEME.unknown;

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const formatCurrency = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return 'R 0.00';
  return `R ${num.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const renderMainContent = () => `
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <i class="fa-solid fa-file-invoice text-orange-600"></i> SureSystems Mandates
        </h1>
        <p class="mt-2 text-sm text-gray-500 font-medium">Track and debug all DebiCheck mandate activation attempts.</p>
      </div>
      <div class="flex gap-3">
        <button onclick="window.loadMandatesData()" class="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm font-semibold flex items-center gap-2">
            <i class="fa-solid fa-rotate-right"></i> Refresh
        </button>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div class="relative w-full sm:w-96">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i class="fa-solid fa-search text-gray-400"></i>
        </div>
        <input type="text" id="mandate-search" placeholder="Search by name, reference, or app ID..." class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all bg-gray-50 hover:bg-white focus:bg-white">
      </div>
      <div class="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
        <button class="filter-btn active px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-gray-800 text-white" data-filter="all">All</button>
        <button class="filter-btn px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-gray-100 text-gray-600 hover:bg-gray-200" data-filter="failed">Failed</button>
        <button class="filter-btn px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-gray-100 text-gray-600 hover:bg-gray-200" data-filter="success">Success</button>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Applicant / App ID</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reference / Amount</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th scope="col" class="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody id="mandates-table-body" class="bg-white divide-y divide-gray-100">
            <tr><td colspan="5" class="px-6 py-12 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2 text-orange-500"></i><p>Loading mandates...</p></td></tr>
          </tbody>
        </table>
      </div>
      <div id="empty-state" class="hidden px-6 py-12 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <i class="fa-solid fa-folder-open text-2xl text-gray-400"></i>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-1">No mandates found</h3>
        <p class="text-sm text-gray-500">No SureSystems mandate records match your current filters.</p>
      </div>
    </div>
  </div>
`;

window.loadMandatesData = async () => {
  const tbody = document.getElementById('mandates-table-body');
  try {
    const res = await fetch('/api/suresystems/mandates/history');
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    
    mandatesData = json.data || [];
    renderTable(mandatesData);
  } catch (error) {
    console.error('Failed to load mandates:', error);
    tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-500 font-medium bg-red-50">Error loading data: ${error.message}</td></tr>`;
  }
};

const renderTable = (data) => {
  const tbody = document.getElementById('mandates-table-body');
  const emptyState = document.getElementById('empty-state');
  
  if (!data || data.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  
  tbody.innerHTML = data.map(m => {
    const theme = getTheme(m.status);
    const applicantName = m.profiles?.full_name || m.user_id || 'Unknown User';
    const amount = m.loan_applications?.amount ? formatCurrency(m.loan_applications.amount) : 'Unknown Amount';
    const ref = m.contract_reference || '<span class="text-gray-400 italic">No reference generated</span>';
    const errorMsg = m.status === 'failed' ? `<div class="text-xs text-red-600 mt-1 truncate max-w-xs" title="${m.message}">${m.message}</div>` : '';

    return \`
      <tr class="hover:bg-gray-50 transition-colors cursor-pointer group" onclick="window.viewMandate('\${m.id}')">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-bold text-gray-600 shadow-inner">
              \${applicantName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="font-bold text-gray-900 text-sm">\${applicantName}</div>
              <div class="text-xs text-gray-500 font-mono mt-0.5">App ID: \${m.application_id}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold \${theme.bg} \${theme.text} border \${theme.border}">
            <i class="fa-solid \${theme.icon}"></i> \${m.status.toUpperCase()}
          </span>
          \${errorMsg}
        </td>
        <td class="px-6 py-4">
          <div class="text-sm font-bold text-gray-900 font-mono">\${ref}</div>
          <div class="text-xs text-gray-500 mt-0.5">\${amount}</div>
        </td>
        <td class="px-6 py-4">
          <div class="text-sm text-gray-900 font-medium">\${formatDate(m.updated_at)}</div>
          <div class="text-xs text-gray-500 mt-0.5">Created: \${formatDate(m.created_at)}</div>
        </td>
        <td class="px-6 py-4 text-right">
          <button class="text-gray-400 hover:text-orange-600 transition-colors bg-white hover:bg-orange-50 w-8 h-8 rounded-lg border border-transparent hover:border-orange-200">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </td>
      </tr>
    \`;
  }).join('');
};

window.viewMandate = (id) => {
  const mandate = mandatesData.find(m => String(m.id) === String(id));
  if (!mandate) return;
  currentMandate = mandate;

  const modal = document.getElementById('payload-modal');
  const banner = document.getElementById('modal-status-banner');
  const icon = document.getElementById('modal-status-icon');
  const reqPre = document.getElementById('modal-request-payload');
  const resPre = document.getElementById('modal-response-payload');
  const retryBtn = document.getElementById('btn-retry-mandate');
  const fateBtn = document.getElementById('btn-check-fate');

  const theme = getTheme(mandate.status);
  
  // Setup banner
  banner.className = \`p-4 rounded-xl font-semibold flex items-start gap-3 border \${theme.bg} \${theme.text} \${theme.border}\`;
  icon.className = \`fa-solid \${theme.icon} text-xl mt-0.5\`;
  document.getElementById('modal-status-text').textContent = \`Status: \${mandate.status.toUpperCase()}\`;
  document.getElementById('modal-message-text').textContent = mandate.message || 'No additional message provided.';

  // Format JSON
  reqPre.textContent = mandate.request_payload ? JSON.stringify(mandate.request_payload, null, 2) : 'No request payload recorded.';
  
  const responseData = mandate.error_payload || mandate.response_payload || null;
  resPre.textContent = responseData ? JSON.stringify(responseData, null, 2) : 'No response payload recorded.';
  
  if (mandate.status === 'failed') {
      resPre.classList.remove('text-blue-400');
      resPre.classList.add('text-red-400');
  } else {
      resPre.classList.remove('text-red-400');
      resPre.classList.add('text-blue-400');
  }

  // Buttons
  retryBtn.classList.toggle('hidden', mandate.status === 'success');
  fateBtn.classList.toggle('hidden', !mandate.contract_reference);

  // Show
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setTimeout(() => modal.firstElementChild.classList.remove('scale-95'), 10);
};

window.retryMandate = async () => {
    if (!currentMandate) return;
    
    const btn = document.getElementById('btn-retry-mandate');
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Retrying...';

    try {
        const response = await fetch('/api/suresystems/activate-application', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId: currentMandate.application_id })
        });
        
        const data = await response.json().catch(() => ({}));
        
        if (!response.ok || !data.success) {
            throw new Error(data.error || data.message || 'Retry failed');
        }

        alert('✅ Mandate retry initiated successfully!');
        window.closePayloadModal();
        await window.loadMandatesData();
        
    } catch (error) {
        alert(\`❌ Retry Failed: \${error.message}\`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
};

window.closePayloadModal = () => {
  const modal = document.getElementById('payload-modal');
  modal.firstElementChild.classList.add('scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    currentMandate = null;
  }, 300);
};

// Setup Event Listeners
const setupListeners = () => {
  document.getElementById('close-modal-btn')?.addEventListener('click', window.closePayloadModal);
  document.getElementById('btn-retry-mandate')?.addEventListener('click', window.retryMandate);
  
  document.getElementById('payload-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'payload-modal') window.closePayloadModal();
  });

  const searchInput = document.getElementById('mandate-search');
  const filterBtns = document.querySelectorAll('.filter-btn');
  let currentFilter = 'all';

  const applyFilters = () => {
    const term = searchInput.value.toLowerCase();
    const filtered = mandatesData.filter(m => {
      const matchFilter = currentFilter === 'all' || m.status.toLowerCase() === currentFilter;
      const applicantName = (m.profiles?.full_name || '').toLowerCase();
      const ref = (m.contract_reference || '').toLowerCase();
      const appId = String(m.application_id);
      
      const matchSearch = !term || applicantName.includes(term) || ref.includes(term) || appId.includes(term);
      return matchFilter && matchSearch;
    });
    renderTable(filtered);
  };

  searchInput?.addEventListener('input', applyFilters);

  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => {
        b.classList.remove('bg-gray-800', 'text-white');
        b.classList.add('bg-gray-100', 'text-gray-600');
      });
      e.target.classList.remove('bg-gray-100', 'text-gray-600');
      e.target.classList.add('bg-gray-800', 'text-white');
      
      currentFilter = e.target.getAttribute('data-filter');
      applyFilters();
    });
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  const shell = document.getElementById('app-shell');
  if (shell) {
    await initLayout();
    shell.innerHTML = renderMainContent();
    setupListeners();
    window.loadMandatesData();
  }
});
