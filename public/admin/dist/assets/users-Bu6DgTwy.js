import{supabase as v}from"./supabaseClient-WTCtVqgB.js";/* empty css              *//* empty css               */import{i as I}from"./layout-DN9eRATl.js";import{n as L,o as _,j as B,p as $}from"./dataService-BhimCAFl.js";import{v as w,a as b,b as C}from"./utils-CZwHw4kl.js";import"https://esm.sh/@supabase/supabase-js@2";import"./theme-CeTh6-N5.js";function T(t,e={}){const{showActions:a=!0,className:n="",isLuhnValid:l=!0}=e;let s=t.full_name||t.first_name+" "+t.surname;s=s.replace("NOT_PROVIDED","").trim();const i=s.split(" ").map(x=>x[0]).join("").substring(0,2).toUpperCase(),o=l?"bg-emerald-50 text-emerald-700 border-emerald-100":"bg-red-50 text-red-700 border-red-100",d=l?"check_circle":"warning",c=l?"Verified ID":"ID Error";return`
        <div class="bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden relative group transition-all hover:shadow-xl hover:shadow-slate-200/40 ${n}">
            <!-- Brand Accent -->
            <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#7C3AED] to-[#5B21B6]"></div>
            
            <div class="p-8">
                <div class="flex items-start justify-between mb-8">
                    <div class="flex items-center gap-5">
                        <div class="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl font-black text-slate-400 shadow-inner group-hover:scale-105 transition-transform">
                            ${i||"U"}
                        </div>
                        <div>
                            <h3 class="text-xl font-black text-slate-900 tracking-tight leading-none">${s||"Unknown Client"}</h3>
                            <div class="flex items-center gap-2 mt-2">
                                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">${t.role||"CLIENT"}</span>
                                <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span class="text-[10px] font-bold text-slate-500">${t.branches?.name||"Unassigned"}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="px-3 py-1.5 rounded-xl border ${o} flex items-center gap-2 animate-pulse-slow">
                        <span class="material-symbols-outlined text-[14px]">${d}</span>
                        <span class="text-[10px] font-black uppercase tracking-widest">${c}</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-8">
                    <div class="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                        <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Identity Number</p>
                        <p class="text-xs font-bold text-slate-700 font-mono">${t.identity_number||t.id_number||"---"}</p>
                    </div>
                    <div class="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                        <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">System UUID</p>
                        <p class="text-[10px] font-bold text-slate-500 font-mono truncate">${t.id.substring(0,13)}...</p>
                    </div>
                </div>

                <div class="space-y-3">
                    <div class="flex items-center gap-3 text-slate-600">
                        <span class="material-symbols-outlined text-[18px] text-slate-400">mail</span>
                        <span class="text-xs font-bold truncate">${t.email||"No email provided"}</span>
                    </div>
                    <div class="flex items-center gap-3 text-slate-600">
                        <span class="material-symbols-outlined text-[18px] text-slate-400">call</span>
                        <span class="text-xs font-bold">${t.contact_number||t.phone_mobile||"No contact"}</span>
                    </div>
                </div>

                ${a?`
                <div class="mt-8 pt-8 border-t border-slate-50 flex gap-3">
                    <button onclick="window.openUserDetail('${t.id}')" class="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:bg-black transition-all">View Details</button>
                    <button class="w-12 h-12 flex items-center justify-center border border-slate-200 rounded-xl text-slate-400 hover:text-[#7C3AED] hover:border-[#7C3AED] transition-all">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                </div>
                `:""}
            </div>
        </div>
    `}let k=[],h=[],D=null,m=null,p=1;const g=20;let E="all";const U=`
<div id="view-list" class="flex flex-col h-full animate-fade-in">

  <!-- Header -->
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4 shrink-0">
    <div>
      <h1 class="text-2xl font-headline font-bold text-on-surface tracking-tight">Users</h1>
      <p class="mt-1 text-[11px] font-semibold uppercase tracking-widest text-outline">Clients · Staff · Admins</p>
    </div>
    <div class="flex items-center gap-3">
      <button id="btn-invite-staff"
        class="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5"
        style="background:var(--color-primary)">
        <span class="material-symbols-outlined text-[16px]">person_add</span> Invite Staff
      </button>
    </div>
  </div>

  <!-- Tabs: Clients | Staff -->
  <div class="flex items-center gap-1 mb-5 bg-gray-100 rounded-2xl p-1 w-fit shrink-0">
    <button id="tab-clients" onclick="window.switchUserTab('clients')"
      class="user-tab-btn px-5 py-2 rounded-xl text-sm font-bold transition-all bg-white shadow-sm text-on-surface">
      Clients
    </button>
    <button id="tab-staff" onclick="window.switchUserTab('staff')"
      class="user-tab-btn px-5 py-2 rounded-xl text-sm font-bold transition-all text-outline hover:text-on-surface">
      Staff &amp; Admins
    </button>
  </div>

  <!-- Filters -->
  <div class="flex flex-wrap gap-3 mb-5 shrink-0">
    <select id="branch-filter" class="bg-white border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-xl text-sm font-semibold focus:outline-none shadow-sm">
      <option value="all">All Branches</option>
      <option disabled>Loading...</option>
    </select>
    <div class="relative flex-1 min-w-[200px]">
      <input type="text" id="user-search" placeholder="Search name, email, ID number..."
        class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none shadow-sm bg-white">
      <span class="material-symbols-outlined absolute left-3 top-2 text-slate-400 text-[16px]">search</span>
    </div>
  </div>

  <div class="glass-card rounded-2xl flex flex-col overflow-hidden flex-1 min-h-0">
    <div class="overflow-auto custom-scrollbar"> 
      <table class="min-w-full divide-y divide-slate-50 relative">
        <thead class="bg-white sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"> 
          <tr>
            <th class="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Identity</th>
            <th class="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Match Key</th>
            <th class="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch</th>
            <th class="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance</th>
            <th class="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
          </tr>
        </thead>
        <tbody id="users-table-body" class="bg-white divide-y divide-slate-50">
          <tr><td colspan="5" class="p-20 text-center text-slate-300 font-bold">Initialising Directory...</td></tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="mt-4 flex justify-between items-center px-2">
    <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry <span id="visible-count">0</span></div>
    <div id="user-pagination-container"></div>
  </div>
</div>
`,M=`
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
                <i class="fa-solid fa-building-columns mr-2 text-[#a04100]"></i> Transfer Branch
            </button>
        </div>
    </div>

    <div class="grid grid-cols-12 gap-8 h-full overflow-hidden">
        
        <div id="profile-card-container" class="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-10">
            <!-- Profile Card Injected Here -->
        </div>

        <div class="col-span-12 lg:col-span-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-10">

            <div class="glass-card p-6 rounded-2xl">
                <h3 class="text-sm font-semibold uppercase tracking-widest text-outline mb-4 flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">account_balance_wallet</span> Financial Snapshot
                </h3>
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-surface-container p-3 rounded-xl">
                        <p class="text-[10px] text-outline uppercase">Gross Income</p>
                        <p id="detail-income" class="text-sm font-bold text-on-surface">-</p>
                    </div>
                    <div class="bg-surface-container p-3 rounded-xl">
                        <p class="text-[10px] text-outline uppercase">Expenses</p>
                        <p id="detail-expenses" class="text-sm font-bold text-on-surface">-</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-span-12 lg:col-span-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-10">
            
            <div class="grid grid-cols-3 gap-4">
                <div class="glass-card p-4 rounded-2xl">
                    <div class="text-[10px] font-semibold uppercase tracking-widest text-outline">Total Loans</div>
                    <div id="stat-total-loans" class="text-2xl font-extrabold text-on-surface mt-1">0</div>
                </div>
                <div class="glass-card p-4 rounded-2xl">
                    <div class="text-[10px] font-semibold uppercase tracking-widest text-outline">Active Debt</div>
                    <div id="stat-active-debt" class="text-2xl font-extrabold mt-1" style="color:var(--color-primary)">R 0.00</div>
                </div>
                <div class="glass-card p-4 rounded-2xl">
                    <div class="text-[10px] font-semibold uppercase tracking-widest text-outline">Uploaded Docs</div>
                    <div id="stat-total-docs" class="text-2xl font-extrabold text-blue-600 mt-1">0</div>
                </div>
            </div>

            <div class="glass-card rounded-2xl overflow-hidden">
                <div class="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center">
                    <h3 class="font-headline font-bold text-on-surface">Application History</h3>
                    <span class="text-[11px] font-semibold uppercase tracking-widest text-outline">Most recent first</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-outline-variant/10">
                        <thead class="bg-surface-container">
                            <tr>
                                <th class="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-outline">ID</th>
                                <th class="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-outline">Date</th>
                                <th class="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-outline">Amount</th>
                                <th class="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-outline">Status</th>
                                <th class="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-outline">Action</th>
                            </tr>
                        </thead>
                        <tbody id="detail-loans-body" class="bg-white divide-y divide-outline-variant/10">
                            </tbody>
                    </table>
                </div>
            </div>

            <div class="glass-card p-6 rounded-2xl">
                 <h3 class="font-headline font-bold text-on-surface mb-4">Uploaded Documents</h3>
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
            <button id="btn-confirm-transfer" onclick="window.confirmBranchTransfer()" class="px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm" style="background:var(--color-primary)">Confirm Transfer</button>
        </div>
    </div>
</div>
`,S=t=>["admin","super_admin","base_admin"].includes(t),A=t=>({super_admin:"SUPER ADMIN",admin:"BRANCH MANAGER",base_admin:"LOAN OFFICER"})[t]||"CLIENT",j=t=>{const e=(t||"UNKNOWN").toUpperCase();let a="bg-gray-100 text-gray-600";return e==="DISBURSED"&&(a="bg-green-100 text-green-700"),e==="DECLINED"&&(a="bg-red-100 text-red-700"),["STARTED","SUBMITTED"].includes(e)&&(a="bg-blue-50 text-blue-700"),`<span class="px-2 py-0.5 rounded text-[10px] font-bold ${a}">${e}</span>`};window.switchView=t=>{const e=document.getElementById("view-list"),a=document.getElementById("view-detail");t==="detail"?(e.classList.add("hidden"),a.classList.remove("hidden")):(e.classList.remove("hidden"),a.classList.add("hidden"),m=null)};window.openUserDetail=async t=>{try{document.body.style.cursor="wait";const e=await L(t);if(!e?.profile)throw new Error("Profile not found for this user.");m=e;const a=e.profile,n=w(a?.identity_number||a?.id_number),l=document.getElementById("profile-card-container");l&&(l.innerHTML=T(a,{isLuhnValid:n}));const s=e.financials||{},i=(r,f)=>{const y=document.getElementById(r);y&&(y.textContent=f)};i("detail-income",b(s.monthly_income||0)),i("detail-expenses",b(s.monthly_expenses||0)),i("stat-total-loans",e.loans.length),i("stat-total-docs",e.documents.length);const o=e.loans.filter(r=>["DISBURSED","ACTIVE"].includes(r.status)).reduce((r,f)=>r+Number(f.amount),0);i("stat-active-debt",b(o));const d=document.getElementById("detail-loans-body");d||console.warn("[users] #detail-loans-body not found in DOM"),d&&e.loans.length===0?d.innerHTML='<tr><td colspan="5" class="p-12 text-center text-xs font-bold text-slate-300">No applications found.</td></tr>':d&&(d.innerHTML=e.loans.map(r=>`
                <tr class="hover:bg-slate-50 transition-colors cursor-pointer group" onclick="window.location.href='/admin/application-detail?id=${r.id}'">
                    <td class="px-8 py-5 text-[10px] font-black text-slate-400 font-mono">#${String(r.id).substring(0,8)}</td>
                    <td class="px-6 py-5 text-xs font-bold text-slate-600">${C(r.created_at)}</td>
                    <td class="px-6 py-5 text-sm font-black text-slate-900">${b(r.amount)}</td>
                    <td class="px-6 py-5">${j(r.status)}</td>
                    <td class="px-8 py-5 text-right">
                        <span class="material-symbols-outlined text-slate-300 group-hover:text-[#a04100] transition-colors">chevron_right</span>
                    </td>
                </tr>
            `).join(""));const c=document.getElementById("detail-docs-grid");c||console.warn("[users] #detail-docs-grid not found in DOM"),c&&e.documents.length===0?c.innerHTML='<div class="col-span-3 text-center text-[10px] font-black text-slate-400 py-8 border-2 border-dashed border-slate-50 rounded-3xl">No documents found</div>':c&&(c.innerHTML=e.documents.map(r=>`
                <div class="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/20 transition-all group">
                    <div class="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[#a04100] shadow-sm">
                        <span class="material-symbols-outlined">description</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[10px] font-black text-slate-900 truncate" title="${r.file_name}">${r.file_name}</p>
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">${r.file_type||"DOC"}</p>
                    </div>
                    <a href="${r.file_path}" target="_blank" class="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-[#a04100] transition-all"><span class="material-symbols-outlined text-[20px]">download</span></a>
                </div>
            `).join(""));const x=document.getElementById("btn-transfer-branch");x&&(x.onclick=()=>window.openBranchModal()),window.switchView("detail")}catch(e){console.error("Detail Error:",e?.message||e),alert(`Could not load user details: ${e?.message||"Unknown error — check console"}`)}finally{document.body.style.cursor="default"}};window.openBranchModal=()=>{if(!m)return;const t=m.profile;document.getElementById("modal-username").textContent=t.full_name;const e=document.getElementById("modal-branch-select");e.innerHTML='<option value="online">Online / Unassigned</option>',h.forEach(a=>{const n=document.createElement("option");n.value=a.id,n.textContent=a.name,t.branch_id===a.id&&(n.selected=!0),e.appendChild(n)}),document.getElementById("branch-modal").classList.remove("hidden")};window.confirmBranchTransfer=async()=>{const t=document.getElementById("btn-confirm-transfer"),e=document.getElementById("modal-branch-select").value,a=m.profile;try{t.disabled=!0,t.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Moving...';const n=e==="online"||!e?null:parseInt(e,10),{error:l}=await v.from("profiles").update({branch_id:n}).eq("id",a.id);if(l)throw l;await v.from("loan_applications").update({branch_id:n}).eq("user_id",a.id),alert("Success! User transferred."),document.getElementById("branch-modal").classList.add("hidden"),window.location.reload()}catch(n){alert("Transfer failed: "+n.message),t.disabled=!1,t.textContent="Confirm Transfer"}};const N=t=>{const e=document.getElementById("users-table-body");if(!e)return;const a=(p-1)*g,n=t.slice(a,a+g);if(n.length===0){e.innerHTML='<tr><td colspan="5" class="p-20 text-center text-slate-300 font-bold">No results matching your query.</td></tr>';return}e.innerHTML=n.map(s=>{const i=s.branches?.name||"Online",o=w(s.identity_number||s.id_number);return`
        <tr class="hover:bg-slate-50/50 transition-colors group cursor-pointer" onclick="window.openUserDetail('${s.id}')">
            <td class="px-8 py-6">
                <div class="flex items-center gap-4">
                    <div class="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-black text-slate-400">
                        ${(s.full_name||"U").charAt(0)}
                    </div>
                    <div>
                        <div class="text-sm font-black text-slate-900">${s.full_name||"Unknown"}</div>
                        <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest">${A(s.role)}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-6">
                <div class="text-[10px] font-black text-slate-500 font-mono tracking-tighter">
                    ${s.id.substring(0,13).toUpperCase()}
                </div>
            </td>
            <td class="px-6 py-6">
                 <span class="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500">
                    ${i}
                 </span>
            </td>
            <td class="px-6 py-6">
                <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                        <span class="w-1.5 h-1.5 rounded-full ${o?"bg-emerald-500":"bg-red-500"}"></span>
                        <span class="text-[10px] font-black uppercase tracking-widest ${o?"text-emerald-600":"text-red-600"}">
                            ${o?"ID Valid":"ID Invalid"}
                        </span>
                    </div>
                    ${s.employer_verified?'<div class="text-[10px] font-bold text-blue-600 flex items-center gap-1"><span>✓</span> Employer verified</div>':""}
                    ${s.credit_limit_override?`<div class="text-[10px] font-bold text-orange-600">Cap: R${Number(s.credit_limit_override).toLocaleString("en-ZA")}</div>`:""}
                    ${s.last_active_at?`<div class="text-[9px] text-slate-400">Active: ${new Date(s.last_active_at).toLocaleDateString("en-ZA")}</div>`:""}
                </div>
            </td>
            <td class="px-8 py-6 text-right">
                <button class="w-10 h-10 flex items-center justify-center text-slate-300 group-hover:text-[#a04100] transition-colors">
                    <span class="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
            </td>
        </tr>`}).join("");const l=document.getElementById("visible-count");l&&(l.textContent=t.length),P(Math.ceil(t.length/g)||1)},u=(t=!0)=>{t&&(p=1);const e=(document.getElementById("user-search")?.value||"").toLowerCase(),a=document.getElementById("role-filter")?.value||E||"client",n=document.getElementById("branch-filter")?.value||"all",l=k.filter(s=>{const i=!e||(s.full_name||"").toLowerCase().includes(e)||(s.email||"").toLowerCase().includes(e)||(s.identity_number||"").includes(e)||(s.id||"").includes(e),o=S(s.role);let d=!0;a==="client"&&(d=!o),a==="staff"&&(d=o);const c=n==="all"||s.branch_id?.toString()===n||n==="online"&&!s.branch_id;return i&&d&&c});N(l)};function H(t){if(document.getElementById("invite-staff-modal"))return;const e=document.createElement("div");e.id="invite-staff-modal",e.className="hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4",e.innerHTML=`
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-bold text-gray-900">Invite Staff Member</h3>
            <p class="text-xs text-gray-500 mt-0.5">Creates a login account and profile immediately.</p>
          </div>
          <button onclick="document.getElementById('invite-staff-modal').classList.add('hidden')"
            class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <div id="invite-error" class="hidden mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium"></div>
        <div id="invite-success" class="hidden mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium"></div>

        <form id="invite-form" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Full Name *</label>
              <input name="full_name" type="text" required placeholder="Jane Smith"
                class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none">
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Email Address *</label>
              <input name="email" type="email" required placeholder="jane@company.co.za"
                class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Role *</label>
              <select name="role" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-white">
                <option value="base_admin">Loan Officer</option>
                <option value="admin">Branch Manager</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Branch</label>
              <select name="branch_id" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-white">
                <option value="">No branch</option>
                ${t.map(a=>`<option value="${a.id}">${a.name}</option>`).join("")}
              </select>
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Temporary Password *</label>
              <input name="password" type="password" required placeholder="Min 8 characters" minlength="8"
                class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none">
              <p class="text-xs text-gray-400 mt-1">Staff member should change this on first login.</p>
            </div>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" onclick="document.getElementById('invite-staff-modal').classList.add('hidden')"
              class="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 text-sm">Cancel</button>
            <button type="submit" id="invite-submit-btn"
              class="flex-1 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              style="background:var(--color-primary)">Send Invite</button>
          </div>
        </form>
      </div>`,document.body.appendChild(e),e.addEventListener("click",()=>e.classList.add("hidden")),document.getElementById("invite-form").addEventListener("submit",async a=>{a.preventDefault();const n=document.getElementById("invite-submit-btn"),l=document.getElementById("invite-error"),s=document.getElementById("invite-success");l.classList.add("hidden"),s.classList.add("hidden"),n.textContent="Inviting…",n.disabled=!0;try{const i=new FormData(a.target),o=Object.fromEntries(i),{data:{session:d}}=await v.auth.getSession(),c=await fetch("/api/admin/invite-staff",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${d.access_token}`},body:JSON.stringify(o)}),x=await c.json();if(!c.ok)throw new Error(x.error||"Failed");s.textContent=`✓ ${o.full_name} has been invited and can now log in.`,s.classList.remove("hidden"),a.target.reset(),setTimeout(()=>{e.classList.add("hidden"),window.location.reload()},2e3)}catch(i){l.textContent=i.message,l.classList.remove("hidden")}finally{n.textContent="Send Invite",n.disabled=!1}})}document.addEventListener("DOMContentLoaded",async()=>{await I();const t=document.getElementById("main-content");t.innerHTML=U+M,t.className="flex-1 p-4 sm:p-6 lg:p-8 h-screen overflow-hidden flex flex-col";try{const[e,a,n]=await Promise.all([_(),B(),$()]);D=e,k=a,h=n.data||[];const l=document.getElementById("branch-filter");l.innerHTML='<option value="all">All Branches</option><option value="online">Online / Unassigned</option>',h.forEach(s=>l.innerHTML+=`<option value="${s.id}">${s.name}</option>`),u(!0),document.getElementById("user-search").addEventListener("input",()=>u(!0)),document.getElementById("branch-filter").addEventListener("change",()=>u(!0)),window.switchUserTab=s=>{E=s==="staff"?"staff":"client",document.querySelectorAll(".user-tab-btn").forEach(i=>{const o=i.id===`tab-${s}`;i.classList.toggle("bg-white",o),i.classList.toggle("shadow-sm",o),i.classList.toggle("text-on-surface",o),i.classList.toggle("text-outline",!o)}),u(!0)},window.switchUserTab("clients"),H(n.data||[]),document.getElementById("btn-invite-staff")?.addEventListener("click",()=>{document.getElementById("invite-staff-modal")?.classList.remove("hidden")})}catch(e){console.error(e),t.innerHTML=`<div class="p-8 text-center text-red-500">Failed to load directory: ${e.message}</div>`}});function P(t){let e=document.getElementById("user-pagination-container");if(e||(e=document.createElement("div"),e.id="user-pagination-container",e.className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50/50",document.getElementById("view-list").appendChild(e)),t<=1){e.innerHTML='<span class="text-xs text-gray-400">Showing all users</span>';return}e.innerHTML=`
        <span class="text-xs font-bold text-gray-500 uppercase tracking-tight">Page ${p} of ${t}</span>
        <div class="flex gap-2">
            <button onclick="window.changePageUsers(${p-1})" ${p===1?"disabled":""} class="px-4 py-2 text-xs font-bold border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm">Prev</button>
            <button onclick="window.changePageUsers(${p+1})" ${p===t?"disabled":""} class="px-4 py-2 text-xs font-bold border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm">Next</button>
        </div>
    `}window.changePageUsers=t=>{p=t,u(!1)};
