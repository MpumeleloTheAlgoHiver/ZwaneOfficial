import { initLayout } from '../shared/layout.js';
import { formatCurrency, formatDate } from '../shared/utils.js';
import { 
  fetchPayouts,
  approvePayout, 
  updateApplicationStatus,
  getCurrentAdminProfile
} from '../services/dataService.js';

// --- State ---
let allPayouts = [];
let selectedPayoutIds = new Set();
let activeTab = 'pending'; // 'pending' vs 'history'
let searchTerm = '';
let currentPagePayouts = 1;
const itemsPerPagePayouts = 20;
let userRole = 'borrower';
let currentAdminProfile = null;

// --- Main Page Rendering ---

function renderPageContent() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  // Layout: Stats Cards -> Tabs -> Table
  mainContent.innerHTML = `
    <div id="payout-list-view" class="flex flex-col h-full animate-fade-in space-y-6">
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Disbursed</p>
                <h2 id="stat-total-disbursed" class="text-3xl font-black text-gray-900 mt-2">R 0.00</h2>
            </div>
            <div class="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl shadow-sm">
                <i class="fa-solid fa-money-bill-wave"></i>
            </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Value</p>
                <h2 id="stat-pending-value" class="text-3xl font-black text-yellow-600 mt-2">R 0.00</h2>
            </div>
            <div class="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center text-xl shadow-sm">
                <i class="fa-solid fa-clock"></i>
            </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Queue</p>
                <h2 id="stat-pending-queue" class="text-3xl font-black text-gray-900 mt-2">0</h2>
            </div>
            <div class="w-12 h-12 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center text-xl shadow-sm">
                <i class="fa-solid fa-list-check"></i>
            </div>
        </div>

      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden flex-1 min-h-0">
        
        <div class="p-6 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
                <h3 class="text-lg font-bold text-gray-900 uppercase tracking-tight">Transaction View</h3>
                <div class="flex gap-6 mt-2">
                    <button id="tab-pending" class="text-xs font-bold uppercase transition-colors pb-1 border-b-2 ${activeTab === 'pending' ? 'text-orange-600 border-orange-600' : 'text-gray-400 border-transparent hover:text-gray-600'}">
                        Ready to Pay
                    </button>
                    <button id="tab-history" class="text-xs font-bold uppercase transition-colors pb-1 border-b-2 ${activeTab === 'history' ? 'text-orange-600 border-orange-600' : 'text-gray-400 border-transparent hover:text-gray-600'}">
                        Paid History
                    </button>
                </div>
            </div>
            
            <div class="flex items-center gap-3 w-full lg:w-auto">
                <div class="relative flex-1 lg:w-64">
                    <input type="text" id="payout-search-input" placeholder="Search ID or Name..." 
                           class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-orange-500 text-sm focus:bg-white transition-colors">
                    <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400"></i>
                </div>
                <button id="btn-bulk-disburse" class="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black disabled:opacity-30 transition-all flex items-center gap-2 shadow-sm" disabled>
                    <i class="fa-solid fa-file-csv"></i> <span>Export Data</span>
                </button>
            </div>
        </div>

        <div class="overflow-auto custom-scrollbar flex-1">
          <table class="min-w-full divide-y divide-gray-100">
            <thead class="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                    <th class="px-6 py-4 text-left w-10">
                        <input type="checkbox" id="select-all-checkbox" class="rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer">
                    </th>
                    <th class="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                    <th class="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction ID</th>
                    <th class="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recipient</th>
                    <th class="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                    <th class="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th class="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                </tr>
            </thead>
            <tbody id="payouts-table-body" class="bg-white divide-y divide-gray-50">
                <tr><td colspan="7" class="p-10 text-center text-gray-400 italic">
                    <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading transaction queue...
                </td></tr>
            </tbody>
          </table>
        </div>
        
        <div id="payout-pagination-container"></div>
      </div>
      
      <div class="mt-1 text-[10px] text-gray-400 text-right font-bold uppercase tracking-tight">
        Total Records Found: <span id="visible-count">0</span>
      </div>
    </div>
  `;
  
  attachEventListeners();
}

const filterAndSearch = (resetPage = true) => { 
    if (resetPage) currentPagePayouts = 1;
    searchTerm = document.getElementById('payout-search-input')?.value.toLowerCase().trim() || ''; 
    
    // FIX: Track Application IDs to ignore duplicates in the list
    const seenApplications = new Set();

    const filtered = allPayouts.filter(p => {
        // 1. Status Check: Only look at the payout record's status
        const isPending = p.status === 'pending_disbursement';
        const isPaid = p.status === 'disbursed';
        const statusMatch = (activeTab === 'pending') ? isPending : isPaid;

        // 2. Text Match
        const textMatch = !searchTerm || 
            (p.profile?.full_name || '').toLowerCase().includes(searchTerm) || 
            String(p.id).includes(searchTerm);

        const isMatch = statusMatch && textMatch;

        // 3. DUPLICATE GUARD: If we match, but already saw this App ID, skip it
        if (isMatch && !seenApplications.has(p.application_id)) {
            seenApplications.add(p.application_id);
            return true;
        }
        return false;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPagePayouts) || 1;
    const start = (currentPagePayouts - 1) * itemsPerPagePayouts;
    const paginatedData = filtered.slice(start, start + itemsPerPagePayouts);

    renderPayoutTable(paginatedData); 
    renderPayoutPaginationControls(totalPages, filtered.length);
    
    const countEl = document.getElementById('visible-count');
    if(countEl) countEl.textContent = filtered.length;
};

function renderPayoutTable(payouts) {
    const tb = document.getElementById('payouts-table-body');
    if (!tb) return;

    if (payouts.length === 0) {
        tb.innerHTML = `<tr><td colspan="7" class="p-10 text-center text-sm text-gray-400 italic">No transactions found for the selected view.</td></tr>`;
        return;
    }

    tb.innerHTML = payouts.map(p => {
        const isSelected = selectedPayoutIds.has(p.id);
        const dateStr = formatDate(p.created_at);
        
        return `
        <tr class="hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0">
            <td class="px-6 py-4">
                <input type="checkbox" class="payout-checkbox rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer" data-id="${p.id}" ${isSelected ? 'checked' : ''}>
            </td>
            <td class="px-6 py-4 text-xs text-gray-600 font-medium whitespace-nowrap">
                ${dateStr}
            </td>
            <td class="px-6 py-4">
                <div class="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded inline-block border border-gray-100">
                    #${p.id}
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="text-xs font-bold text-gray-900">${p.profile?.full_name || 'N/A'}</div>
                <div class="text-[10px] text-gray-400">App ID: ${p.application_id}</div>
            </td>
            <td class="px-6 py-4 text-xs font-black text-gray-900">
                ${formatCurrency(p.amount)}
            </td>
            <td class="px-6 py-4">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${activeTab === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}">
                    ${activeTab === 'pending' ? 'Pending' : 'Paid'}
                </span>
            </td>
            <td class="px-6 py-4 text-right">
                <a href="/admin/application-detail?id=${p.application_id}" class="text-gray-400 hover:text-orange-600 transition-colors p-2 rounded-full hover:bg-orange-50 inline-block">
                    <i class="fa-solid fa-eye"></i>
                </a>
            </td>
        </tr>
    `}).join('');

    // Attach row-specific checkbox listeners
    tb.querySelectorAll('.payout-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const id = parseInt(e.target.dataset.id);
            if (e.target.checked) selectedPayoutIds.add(id);
            else selectedPayoutIds.delete(id);
            updateBulkUI();
        });
    });
}

function updateBulkUI() {
    const btn = document.getElementById('btn-bulk-disburse');
    if (!btn) return;
    const count = selectedPayoutIds.size;
    btn.disabled = count === 0;
    
    // Change Button Text based on selection
    if (count > 0) {
        btn.innerHTML = `<i class="fa-solid fa-file-csv"></i> <span class="ml-2">Export & Process (${count})</span>`;
        btn.classList.remove('bg-gray-900');
        btn.classList.add('bg-orange-600');
    } else {
        btn.innerHTML = `<i class="fa-solid fa-file-csv"></i> <span class="ml-2">Export Data</span>`;
        btn.classList.add('bg-gray-900');
        btn.classList.remove('bg-orange-600');
    }
}

function renderPayoutPaginationControls(totalPages, totalRecords) {
    const container = document.getElementById('payout-pagination-container');
    if (!container) return; 

    if (totalPages <= 1) {
        container.innerHTML = `<div class="p-4 border-t border-gray-100 bg-gray-50/50 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">End of Records</div>`;
        return;
    }

    container.innerHTML = `
        <div class="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50/50">
            <span class="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Page ${currentPagePayouts} of ${totalPages}</span>
            <div class="flex gap-2">
                <button onclick="window.changePagePayouts(${currentPagePayouts - 1})" ${currentPagePayouts === 1 ? 'disabled' : ''} 
                    class="px-3 py-1 text-[10px] font-bold border rounded-lg bg-white disabled:opacity-30 hover:bg-gray-50 transition-all shadow-sm text-gray-700">Prev</button>
                <button onclick="window.changePagePayouts(${currentPagePayouts + 1})" ${currentPagePayouts === totalPages ? 'disabled' : ''} 
                    class="px-3 py-1 text-[10px] font-bold border rounded-lg bg-white disabled:opacity-30 hover:bg-gray-50 transition-all shadow-sm text-gray-700">Next</button>
            </div>
        </div>
    `;
}

// Global page changer attached to window
window.changePagePayouts = (page) => {
    currentPagePayouts = page;
    filterAndSearch(false); 
};

// --- Event Listeners ---
function attachEventListeners() {
    // Search Listener
    document.getElementById('payout-search-input')?.addEventListener('input', () => filterAndSearch(true));
    
    // Tab Listeners
    document.getElementById('tab-pending')?.addEventListener('click', () => { 
        activeTab = 'pending'; 
        selectedPayoutIds.clear();
        updateBulkUI();
        renderPageContent(); 
        updateDashboardStats(allPayouts); // Refresh stats
        filterAndSearch(true);
    });
    
    document.getElementById('tab-history')?.addEventListener('click', () => { 
        activeTab = 'history'; 
        selectedPayoutIds.clear();
        updateBulkUI();
        renderPageContent(); 
        updateDashboardStats(allPayouts); // Refresh stats
        filterAndSearch(true);
    });

    // Select All Listener
    document.getElementById('select-all-checkbox')?.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.payout-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            const id = parseInt(cb.dataset.id);
            if (e.target.checked) selectedPayoutIds.add(id);
            else selectedPayoutIds.delete(id);
        });
        updateBulkUI();
    });

    // Bulk Export/Process Button Listener
    document.getElementById('btn-bulk-disburse')?.addEventListener('click', () => {
        if (activeTab === 'pending') {
            handleBulkDisburse(); // Logic for processing payments
        } else {
            handleBulkExport(); // Logic for just exporting history
        }
    });
}

// --- Stats Logic ---
function updateDashboardStats(data) {
    // 1. Calculate Total Disbursed (All time)
    // Filter for disbursed status in history
    const disbursedItems = data.filter(p => p.status === 'disbursed' || p.application?.status === 'DISBURSED');
    const totalDisbursedVal = disbursedItems.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // 2. Calculate Pending Value & Queue
    const pendingItems = data.filter(p => p.status === 'pending_disbursement' || p.application?.status === 'READY_TO_DISBURSE');
    const pendingVal = pendingItems.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pendingCount = pendingItems.length;

    // 3. Update DOM
    const elTotal = document.getElementById('stat-total-disbursed');
    const elPendingVal = document.getElementById('stat-pending-value');
    const elPendingCount = document.getElementById('stat-pending-queue');

    if (elTotal) elTotal.textContent = formatCurrency(totalDisbursedVal);
    if (elPendingVal) elPendingVal.textContent = formatCurrency(pendingVal);
    if (elPendingCount) elPendingCount.textContent = pendingCount;
}

// --- Bulk Logic Actions ---

async function handleBulkDisburse() {
    if (selectedPayoutIds.size === 0) return;

    if (!confirm(`Are you sure you want to mark ${selectedPayoutIds.size} items as DISBURSED and download the CSV?`)) return;

    const selectedItems = allPayouts.filter(p => selectedPayoutIds.has(p.id));
    
    // 1. Download CSV first (safeguard)
    downloadCSV(selectedItems);

    const btn = document.getElementById('btn-bulk-disburse');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...`;
    btn.disabled = true;

    try {
        // 2. Process updates sequentially
        for (const payout of selectedItems) {
            await approvePayout(payout.id); 
            await updateApplicationStatus(payout.application_id, 'DISBURSED');
        }
        
        alert("Disbursement processed successfully!");
        selectedPayoutIds.clear();
        await loadData(); // Reload data to refresh list

    } catch (error) {
        console.error(error);
        alert("Some updates failed. Please refresh and check.");
        await loadData();
    } finally {
        btn.innerHTML = originalText;
    }
}

function handleBulkExport() {
    if (selectedPayoutIds.size === 0) return;
    const selectedItems = allPayouts.filter(p => selectedPayoutIds.has(p.id));
    downloadCSV(selectedItems);
    selectedPayoutIds.clear();
    updateBulkUI();
    // Uncheck select-all visually
    const selectAll = document.getElementById('select-all-checkbox');
    if(selectAll) selectAll.checked = false;
    document.querySelectorAll('.payout-checkbox').forEach(cb => cb.checked = false);
}

function downloadCSV(items) {
    const headers = ["Payout ID", "Recipient", "Amount", "Status", "Date", "Application ID", "Bank", "Account"];
    
    const rows = items.map(p => [
        p.id,
        `"${p.profile?.full_name || 'N/A'}"`,
        p.amount,
        activeTab === 'pending' ? 'Pending' : 'Paid',
        formatDate(p.created_at),
        p.application_id,
        // FIX: Reaching through 'application' to get the specific bank account
        `"${p.application?.bank_account?.bank_name || 'N/A'}"`,
        `"${p.application?.bank_account?.account_number || 'N/A'}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `payout_export_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
// --- Data Loading ---

async function loadData() {
  try {
    const { data, error } = await fetchPayouts();
    if (error) throw error;
    allPayouts = data;
    
    // Update dashboard stats immediately
    updateDashboardStats(allPayouts);
    
    filterAndSearch(true); 
    
  } catch (error) {
    console.error("Payout Load Error:", error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await initLayout();
  if (auth) {
      userRole = auth.role;
      currentAdminProfile = await getCurrentAdminProfile();
      renderPageContent();
      await loadData();
  }
});