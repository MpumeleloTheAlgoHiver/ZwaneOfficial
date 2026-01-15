import { initLayout } from '../shared/layout.js';
import { fetchUsers, fetchBranches, claimClientProtocol, getCurrentAdminProfile, fetchFullUserProfile } from '../services/dataService.js';
import { supabase } from '../services/supabaseClient.js'; 
import { formatDate, formatCurrency } from '../shared/utils.js';

// --- STATE ---
let allUsers = [];
let branches = [];
let currentAdmin = null;
let currentUserDetail = null;
let currentPageUsers = 1;
const itemsPerPageUsers = 20;

// Filters
let searchFilter = '';
let branchFilter = 'all';
let roleFilter = 'all';

// --- TEMPLATES ---

const LIST_VIEW_HTML = `
<div id="view-list" class="flex flex-col h-full animate-fade-in">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">User Directory</h1>
      <p class="mt-1 text-sm text-gray-500">Manage clients, staff, and assignments.</p>
    </div>
    
    <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <select id="role-filter" class="bg-white border border-gray-300 text-gray-700 py-2 pl-4 pr-8 rounded-lg text-sm font-medium focus:ring-orange-500">
            <option value="all">All Roles</option>
            <option value="client">Clients</option>
            <option value="staff">Staff</option>
        </select>

        <select id="branch-filter" class="bg-white border border-gray-300 text-gray-700 py-2 pl-4 pr-8 rounded-lg text-sm font-medium focus:ring-orange-500 w-full sm:w-48">
            <option value="all">All Branches</option>
            <option disabled>Loading...</option>
        </select>

        <div class="relative w-full sm:w-72">
            <input type="text" id="user-search" placeholder="Search Name, Email, ID or UUID..." 
                   class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 text-sm">
            <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400"></i>
        </div>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden flex-1 min-h-0">
    <div class="overflow-auto custom-scrollbar"> 
      <table class="min-w-full divide-y divide-gray-200 relative">
        <thead class="bg-gray-50 sticky top-0 z-10 shadow-sm"> 
          <tr>
            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">User Identity</th>
            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">System ID</th>
            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Branch</th>
            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Email / Contact</th>
            <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Action</th>
          </tr>
        </thead>
        <tbody id="users-table-body" class="bg-white divide-y divide-gray-200">
          <tr><td colspan="5" class="p-10 text-center text-gray-400">Loading...</td></tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="mt-2 text-xs text-gray-400 text-right">Showing <span id="visible-count">0</span> records</div>
</div>
`;

const DETAIL_VIEW_HTML = `
<div id="view-detail" class="hidden flex flex-col h-full animate-fade-in bg-gray-50 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
    <div class="flex items-center justify-between mb-6">
        <button onclick="window.switchView('list')" class="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors">
            <div class="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <i class="fa-solid fa-arrow-left"></i>
            </div>
            Back to Directory
        </button>
        <div class="flex gap-2">
            <button id="btn-transfer-branch" class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 shadow-sm">
                <i class="fa-solid fa-building-columns mr-2 text-orange-600"></i> Transfer Branch
            </button>
        </div>
    </div>

    <div class="grid grid-cols-12 gap-6 h-full overflow-hidden">
        
        <div class="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-10">
            
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-orange-600"></div>
                
                <div class="flex flex-col items-center text-center">
                    <div class="w-24 h-24 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-3xl font-bold mb-4 border-4 border-white shadow-md">
                        <span id="detail-avatar">U</span>
                    </div>
                    <h2 id="detail-name" class="text-xl font-bold text-gray-900">Loading...</h2>
                    <span id="detail-role-badge" class="mt-2 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">CLIENT</span>
                    
                    <div class="mt-6 w-full border-t border-gray-100 pt-4 grid grid-cols-2 gap-4 text-left">
                        <div>
                            <p class="text-[10px] uppercase font-bold text-gray-400">System ID (UUID)</p>
                            <p id="detail-uuid" class="text-xs font-mono text-gray-600 break-all select-all cursor-pointer hover:text-orange-600" title="Click to Copy">...</p>
                        </div>
                        <div>
                            <p class="text-[10px] uppercase font-bold text-gray-400">Joined</p>
                            <p id="detail-joined" class="text-xs font-medium text-gray-700">...</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-address-card text-gray-400"></i> Contact Details
                </h3>
                <div class="space-y-4">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-envelope"></i></div>
                        <div class="flex-1 min-w-0">
                            <p class="text-xs text-gray-400 font-bold">Email Address</p>
                            <p id="detail-email" class="text-sm font-medium text-gray-900 truncate">...</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-id-card"></i></div>
                        <div class="flex-1">
                            <p class="text-xs text-gray-400 font-bold">Identity Number</p>
                            <p id="detail-idnum" class="text-sm font-mono font-medium text-gray-900">...</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-location-dot"></i></div>
                        <div class="flex-1">
                            <p class="text-xs text-gray-400 font-bold">Assigned Branch</p>
                            <p id="detail-branch" class="text-sm font-bold text-gray-900">...</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-wallet text-gray-400"></i> Financial Snapshot
                </h3>
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-gray-50 p-3 rounded-lg">
                        <p class="text-[10px] text-gray-500 uppercase">Gross Income</p>
                        <p id="detail-income" class="text-sm font-bold text-gray-900">-</p>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg">
                        <p class="text-[10px] text-gray-500 uppercase">Expenses</p>
                        <p id="detail-expenses" class="text-sm font-bold text-gray-900">-</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-span-12 lg:col-span-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-10">
            
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div class="text-xs text-gray-500 font-bold uppercase">Total Loans</div>
                    <div id="stat-total-loans" class="text-2xl font-extrabold text-gray-900 mt-1">0</div>
                </div>
                <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div class="text-xs text-gray-500 font-bold uppercase">Active Debt</div>
                    <div id="stat-active-debt" class="text-2xl font-extrabold text-orange-600 mt-1">R 0.00</div>
                </div>
                <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div class="text-xs text-gray-500 font-bold uppercase">Uploaded Docs</div>
                    <div id="stat-total-docs" class="text-2xl font-extrabold text-blue-600 mt-1">0</div>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 class="font-bold text-gray-900">Application History</h3>
                    <span class="text-xs text-gray-400">Most recent first</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-100">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">ID</th>
                                <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Amount</th>
                                <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody id="detail-loans-body" class="bg-white divide-y divide-gray-50">
                            </tbody>
                    </table>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                 <h3 class="font-bold text-gray-900 mb-4">Uploaded Documents</h3>
                 <div id="detail-docs-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    </div>
            </div>

        </div>
    </div>
</div>

<div id="branch-modal" class="hidden fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center backdrop-blur-sm">
    <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md m-4 animate-scale-in">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Transfer User Branch</h3>
        <p class="text-sm text-gray-500 mb-4">Select the new branch for <span id="modal-username" class="font-bold text-gray-800"></span>.</p>
        
        <select id="modal-branch-select" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm mb-6 focus:ring-orange-500"></select>
        
        <div class="flex justify-end gap-3">
            <button onclick="document.getElementById('branch-modal').classList.add('hidden')" class="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onclick="window.confirmBranchTransfer()" class="px-4 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm">Confirm Transfer</button>
        </div>
    </div>
</div>
`;

// --- HELPER FUNCTIONS ---

const isStaff = (role) => ['admin', 'super_admin', 'base_admin'].includes(role);

const getRoleLabel = (role) => {
    const roles = { 'super_admin': 'SUPER ADMIN', 'admin': 'BRANCH MANAGER', 'base_admin': 'LOAN OFFICER' };
    return roles[role] || 'CLIENT';
};

const getStatusBadge = (status) => {
    const s = (status || 'UNKNOWN').toUpperCase();
    let color = 'bg-gray-100 text-gray-600';
    if(s === 'DISBURSED') color = 'bg-green-100 text-green-700';
    if(s === 'DECLINED') color = 'bg-red-100 text-red-700';
    if(['STARTED', 'SUBMITTED'].includes(s)) color = 'bg-blue-50 text-blue-700';
    return `<span class="px-2 py-0.5 rounded text-[10px] font-bold ${color}">${s}</span>`;
};

// --- CORE LOGIC ---

window.switchView = (viewName) => {
    const list = document.getElementById('view-list');
    const detail = document.getElementById('view-detail');
    
    if (viewName === 'detail') {
        list.classList.add('hidden');
        detail.classList.remove('hidden');
    } else {
        list.classList.remove('hidden');
        detail.classList.add('hidden');
        currentUserDetail = null; // Clear memory
    }
};

window.openUserDetail = async (userId) => {
    try {
        // 1. Show Loading UI
        document.body.style.cursor = 'wait';
        
        // 2. Fetch Deep Data
        const data = await fetchFullUserProfile(userId);
        currentUserDetail = data;

        // 3. Populate UI
        const p = data.profile;
        const branchName = p.branches?.name || 'Online / Unassigned';
        
        // Header
        document.getElementById('detail-avatar').textContent = (p.full_name || 'U').charAt(0);
        document.getElementById('detail-name').textContent = p.full_name || 'Unknown User';
        document.getElementById('detail-role-badge').textContent = getRoleLabel(p.role);
        
        // Sidebar Info
        document.getElementById('detail-uuid').textContent = p.id;
        document.getElementById('detail-joined').textContent = formatDate(p.created_at);
        document.getElementById('detail-email').textContent = p.email || 'No Email';
        document.getElementById('detail-email').title = p.email || ''; 
        document.getElementById('detail-idnum').textContent = p.identity_number || 'N/A';
        document.getElementById('detail-branch').textContent = branchName;

        // Financials
        const fins = data.financials || {};
        document.getElementById('detail-income').textContent = formatCurrency(fins.monthly_income || 0);
        document.getElementById('detail-expenses').textContent = formatCurrency(fins.monthly_expenses || 0);

        // Stats
        document.getElementById('stat-total-loans').textContent = data.loans.length;
        document.getElementById('stat-total-docs').textContent = data.documents.length;
        
        // Calc Active Debt
        const activeDebt = data.loans
            .filter(l => ['DISBURSED', 'ACTIVE'].includes(l.status))
            .reduce((sum, l) => sum + Number(l.amount), 0);
        document.getElementById('stat-active-debt').textContent = formatCurrency(activeDebt);

        // Render Loans Table
        const loanBody = document.getElementById('detail-loans-body');
        if (data.loans.length === 0) {
            loanBody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-sm text-gray-400">No application history found.</td></tr>`;
        } else {
            loanBody.innerHTML = data.loans.map(l => `
                <tr class="hover:bg-gray-50 transition-colors cursor-pointer" onclick="window.location.href='/admin/application-detail?id=${l.id}'">
                    <td class="px-6 py-3 text-xs font-mono text-gray-600">#${l.id}</td>
                    <td class="px-6 py-3 text-xs text-gray-600">${formatDate(l.created_at)}</td>
                    <td class="px-6 py-3 text-xs font-bold text-gray-900">${formatCurrency(l.amount)}</td>
                    <td class="px-6 py-3 text-xs">${getStatusBadge(l.status)}</td>
                    <td class="px-6 py-3 text-right">
                        <i class="fa-solid fa-chevron-right text-gray-300"></i>
                    </td>
                </tr>
            `).join('');
        }

        // Render Docs Grid
        const docGrid = document.getElementById('detail-docs-grid');
        if (data.documents.length === 0) {
            docGrid.innerHTML = `<div class="col-span-3 text-center text-sm text-gray-400 py-4 border-2 border-dashed border-gray-100 rounded-lg">No documents uploaded.</div>`;
        } else {
            docGrid.innerHTML = data.documents.map(d => `
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-white hover:shadow-sm transition-all group">
                    <div class="w-10 h-10 rounded bg-white border border-gray-200 flex items-center justify-center text-orange-500">
                        <i class="fa-solid fa-file-lines"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-gray-900 truncate" title="${d.file_name}">${d.file_name}</p>
                        <p class="text-[10px] text-gray-400 uppercase">${d.file_type || 'DOC'}</p>
                    </div>
                    <a href="${d.file_path}" target="_blank" class="text-gray-300 hover:text-orange-600 p-2"><i class="fa-solid fa-download"></i></a>
                </div>
            `).join('');
        }

        // Setup Branch Transfer Button
        const btnTransfer = document.getElementById('btn-transfer-branch');
        
        btnTransfer.onclick = () => window.openBranchModal();
        
        // Switch Views
        window.switchView('detail');

    } catch (error) {
        console.error("Detail Error:", error);
        alert("Could not load user details: " + error.message);
    } finally {
        document.body.style.cursor = 'default';
    }
};

window.openBranchModal = () => {
    if(!currentUserDetail) return;
    const p = currentUserDetail.profile;
    
    document.getElementById('modal-username').textContent = p.full_name;
    const select = document.getElementById('modal-branch-select');
    
    select.innerHTML = '<option value="online">Online / Unassigned</option>';
    branches.forEach(b => {
        const option = document.createElement('option');
        option.value = b.id;
        option.textContent = b.name;
        if(p.branch_id === b.id) option.selected = true;
        select.appendChild(option);
    });

    document.getElementById('branch-modal').classList.remove('hidden');
};

window.confirmBranchTransfer = async () => {
    const btn = document.querySelector('#branch-modal button.bg-orange-600');
    const newBranchId = document.getElementById('modal-branch-select').value;
    const p = currentUserDetail.profile;

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Moving...';

        const updateValue = (newBranchId === 'online') ? null : newBranchId;

        // 1. Update Profile
        const { error } = await supabase.from('profiles').update({ branch_id: updateValue }).eq('id', p.id);
        if (error) throw error;

        // 2. Update Loans
        await supabase.from('loan_applications').update({ branch_id: updateValue }).eq('user_id', p.id);

        alert('Success! User transferred.');
        document.getElementById('branch-modal').classList.add('hidden');
        window.location.reload(); 

    } catch (err) {
        alert('Transfer failed: ' + err.message);
        btn.disabled = false;
        btn.textContent = 'Confirm Transfer';
    }
};

// --- LIST RENDERER ---

const renderUserList = (data) => {
    const tbody = document.getElementById('users-table-body');
    const countEl = document.getElementById('visible-count');
    if (!tbody) return;

    // 1. Pagination Calculation
    const totalPages = Math.ceil(data.length / itemsPerPageUsers) || 1;
    const start = (currentPageUsers - 1) * itemsPerPageUsers;
    const paginatedData = data.slice(start, start + itemsPerPageUsers);

    if (countEl) countEl.textContent = data.length;

    if (paginatedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-sm text-gray-400">No users found.</td></tr>`;
        renderUserPaginationControls(0);
        return;
    }

    // 2. Render Rows
    tbody.innerHTML = paginatedData.map(u => {
        const branchName = u.branches?.name || 'Online';
        const isStaffMember = isStaff(u.role);
        
        let badgeClass = isStaffMember ? 'bg-purple-100 text-purple-700' : 'bg-green-50 text-green-700';
        // Highlight users not in my branch (for branch admins)
        if (!isStaffMember && currentAdmin.role !== 'super_admin' && u.branch_id !== currentAdmin.branch_id) {
            badgeClass = 'bg-yellow-50 text-yellow-700';
        }

        const shortId = u.id.substring(0, 6) + '...';

        return `
        <tr class="hover:bg-gray-50 transition-colors group">
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold mr-3 border border-gray-200 ${isStaffMember ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'}">
                        ${(u.full_name || 'U').charAt(0)}
                    </div>
                    <div>
                        <div class="text-sm font-bold text-gray-900">${u.full_name || 'Unknown'}</div>
                        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wide">${getRoleLabel(u.role)}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded inline-block border border-gray-100" title="Full UUID: ${u.id}">
                    ${shortId}
                </div>
            </td>
            <td class="px-6 py-4">
                 <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border border-transparent ${badgeClass}">
                    ${branchName}
                 </span>
            </td>
            <td class="px-6 py-4">
                <div class="text-xs text-gray-900 font-medium">${u.email || '-'}</div>
                <div class="text-[10px] text-gray-400">${u.identity_number || ''}</div>
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="window.openUserDetail('${u.id}')" class="text-gray-400 hover:text-orange-600 transition-colors p-2 rounded-full hover:bg-orange-50">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        </tr>`;
    }).join('');

    // 3. Update Controls
    renderUserPaginationControls(totalPages);
};

// ✅ FIXED: applyFilters now handles page resets correctly
const applyFilters = (resetPage = true) => {
    if (resetPage) currentPageUsers = 1;

    const term = document.getElementById('user-search').value.toLowerCase();
    const role = document.getElementById('role-filter').value;
    const branch = document.getElementById('branch-filter').value;

    const filtered = allUsers.filter(u => {
        // Search: Name, Email, ID Number, or UUID
        const textMatch = !term || 
            (u.full_name || '').toLowerCase().includes(term) ||
            (u.email || '').toLowerCase().includes(term) ||
            (u.identity_number || '').includes(term) ||
            (u.id || '').includes(term); 

        // Role Filter
        const isUserStaff = isStaff(u.role);
        let roleMatch = true;
        if(role === 'client') roleMatch = !isUserStaff;
        if(role === 'staff') roleMatch = isUserStaff;

        // Branch Filter
        const branchMatch = (branch === 'all') || (u.branch_id?.toString() === branch) || (branch === 'online' && !u.branch_id);

        return textMatch && roleMatch && branchMatch;
    });

    renderUserList(filtered);
};

// --- INIT ---

document.addEventListener('DOMContentLoaded', async () => {
  await initLayout();
  
  // Inject Main Views
  const main = document.getElementById('main-content');
  main.innerHTML = LIST_VIEW_HTML + DETAIL_VIEW_HTML;
  main.className = 'flex-1 p-4 sm:p-6 lg:p-8 h-screen overflow-hidden flex flex-col'; 

  try {
      const [admin, usersData, branchesData] = await Promise.all([
          getCurrentAdminProfile(),
          fetchUsers(),
          fetchBranches()
      ]);

      currentAdmin = admin;
      allUsers = usersData;
      branches = branchesData;

      // Populate Branch Filters
      const branchSelect = document.getElementById('branch-filter');
      branchSelect.innerHTML = '<option value="all">All Branches</option><option value="online">Online / Unassigned</option>';
      branches.forEach(b => branchSelect.innerHTML += `<option value="${b.id}">${b.name}</option>`);

      // --- ROLE FILTER LOCK ---
      // Fix: Only Super Admins can see "Staff" or "All"
      const roleSelect = document.getElementById('role-filter');
      
      if (currentAdmin.role !== 'super_admin') {
          roleSelect.innerHTML = '<option value="client">Clients</option>';
          roleSelect.value = 'client';
          roleSelect.disabled = true;
          roleSelect.classList.add('bg-gray-100', 'text-gray-500', 'cursor-not-allowed');
          
          // Apply filter immediately so they don't see staff
          applyFilters(true);
      } else {
          // Super Admins: Show everything by default
          renderUserList(allUsers);
      }

      // Event Listeners
      document.getElementById('user-search').addEventListener('input', () => applyFilters(true));
      document.getElementById('role-filter').addEventListener('change', () => applyFilters(true));
      document.getElementById('branch-filter').addEventListener('change', () => applyFilters(true));

  } catch (err) {
      console.error(err);
      main.innerHTML = `<div class="p-8 text-center text-red-500">Failed to load directory: ${err.message}</div>`;
  }
});

function renderUserPaginationControls(totalPages) {
    let container = document.getElementById('user-pagination-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'user-pagination-container';
        container.className = 'flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50/50';
        document.getElementById('view-list').appendChild(container);
    }

    if (totalPages <= 1) {
        container.innerHTML = `<span class="text-xs text-gray-400">Showing all users</span>`;
        return;
    }

    container.innerHTML = `
        <span class="text-xs font-bold text-gray-500 uppercase tracking-tight">Page ${currentPageUsers} of ${totalPages}</span>
        <div class="flex gap-2">
            <button onclick="window.changePageUsers(${currentPageUsers - 1})" ${currentPageUsers === 1 ? 'disabled' : ''} class="px-4 py-2 text-xs font-bold border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm">Prev</button>
            <button onclick="window.changePageUsers(${currentPageUsers + 1})" ${currentPageUsers === totalPages ? 'disabled' : ''} class="px-4 py-2 text-xs font-bold border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm">Next</button>
        </div>
    `;
}

// Global function to switch pages
window.changePageUsers = (page) => {
    currentPageUsers = page;
    applyFilters(false); 
};