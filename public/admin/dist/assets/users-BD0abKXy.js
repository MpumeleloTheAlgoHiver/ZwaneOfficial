import{supabase as v}from"./supabaseClient-WTCtVqgB.js";/* empty css              *//* empty css               */import{i as E}from"./layout-CF2NSHyg.js";import{n as I,o as _,j as B,p as L}from"./dataService-BdJkK1bK.js";import{v as y,a as m,b as $}from"./utils-CZwHw4kl.js";import"https://esm.sh/@supabase/supabase-js@2";import"./theme-CeTh6-N5.js";function C(e,t={}){const{showActions:a=!0,className:n="",isLuhnValid:l=!0}=t;let s=e.full_name||e.first_name+" "+e.surname;s=s.replace("NOT_PROVIDED","").trim();const r=s.split(" ").map(i=>i[0]).join("").substring(0,2).toUpperCase(),o=l?"bg-emerald-50 text-emerald-700 border-emerald-100":"bg-red-50 text-red-700 border-red-100",d=l?"check_circle":"warning",p=l?"Verified ID":"ID Error";return`
        <div class="bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden relative group transition-all hover:shadow-xl hover:shadow-slate-200/40 ${n}">
            <!-- Brand Accent -->
            <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#7C3AED] to-[#5B21B6]"></div>
            
            <div class="p-8">
                <div class="flex items-start justify-between mb-8">
                    <div class="flex items-center gap-5">
                        <div class="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl font-black text-slate-400 shadow-inner group-hover:scale-105 transition-transform">
                            ${r||"U"}
                        </div>
                        <div>
                            <h3 class="text-xl font-black text-slate-900 tracking-tight leading-none">${s||"Unknown Client"}</h3>
                            <div class="flex items-center gap-2 mt-2">
                                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">${e.role||"CLIENT"}</span>
                                <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span class="text-[10px] font-bold text-slate-500">${e.branches?.name||"Unassigned"}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="px-3 py-1.5 rounded-xl border ${o} flex items-center gap-2 animate-pulse-slow">
                        <span class="material-symbols-outlined text-[14px]">${d}</span>
                        <span class="text-[10px] font-black uppercase tracking-widest">${p}</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-8">
                    <div class="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                        <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Identity Number</p>
                        <p class="text-xs font-bold text-slate-700 font-mono">${e.identity_number||e.id_number||"---"}</p>
                    </div>
                    <div class="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                        <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">System UUID</p>
                        <p class="text-[10px] font-bold text-slate-500 font-mono truncate">${e.id.substring(0,13)}...</p>
                    </div>
                </div>

                <div class="space-y-3">
                    <div class="flex items-center gap-3 text-slate-600">
                        <span class="material-symbols-outlined text-[18px] text-slate-400">mail</span>
                        <span class="text-xs font-bold truncate">${e.email||"No email provided"}</span>
                    </div>
                    <div class="flex items-center gap-3 text-slate-600">
                        <span class="material-symbols-outlined text-[18px] text-slate-400">call</span>
                        <span class="text-xs font-bold">${e.contact_number||e.phone_mobile||"No contact"}</span>
                    </div>
                </div>

                ${a?`
                <div class="mt-8 pt-8 border-t border-slate-50 flex gap-3">
                    <button onclick="window.openUserDetail('${e.id}')" class="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:bg-black transition-all">View Details</button>
                    <button class="w-12 h-12 flex items-center justify-center border border-slate-200 rounded-xl text-slate-400 hover:text-[#7C3AED] hover:border-[#7C3AED] transition-all">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                </div>
                `:""}
            </div>
        </div>
    `}let f=[],g=[],h=null,u=null,c=1;const b=20,D=`
<div id="view-list" class="flex flex-col h-full animate-fade-in">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
    <div>
      <h1 class="text-2xl font-headline font-bold text-on-surface tracking-tight">User Directory</h1>
      <p class="mt-1 text-[11px] font-semibold uppercase tracking-widest text-outline">Manage institutional clients and branch assignments.</p>
    </div>
    
    <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <select id="role-filter" class="bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-2xl text-sm font-bold focus:ring-[#a04100] shadow-sm">
            <option value="all">All Roles</option>
            <option value="client">Clients</option>
            <option value="staff">Staff</option>
        </select>

        <select id="branch-filter" class="bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-2xl text-sm font-bold focus:ring-[#a04100] w-full sm:w-48 shadow-sm">
            <option value="all">All Branches</option>
            <option disabled>Loading...</option>
        </select>

        <div class="relative w-full sm:w-72">
            <input type="text" id="user-search" placeholder="Search Identity, Email, ID..." 
                   class="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-[#a04100] text-sm font-bold shadow-sm">
            <span class="material-symbols-outlined absolute left-4 top-2.5 text-slate-400">search</span>
        </div>
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
`,T=`
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
            <button onclick="window.confirmBranchTransfer()" class="px-4 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm">Confirm Transfer</button>
        </div>
    </div>
</div>
`,U=e=>["admin","super_admin","base_admin"].includes(e),M=e=>({super_admin:"SUPER ADMIN",admin:"BRANCH MANAGER",base_admin:"LOAN OFFICER"})[e]||"CLIENT",A=e=>{const t=(e||"UNKNOWN").toUpperCase();let a="bg-gray-100 text-gray-600";return t==="DISBURSED"&&(a="bg-green-100 text-green-700"),t==="DECLINED"&&(a="bg-red-100 text-red-700"),["STARTED","SUBMITTED"].includes(t)&&(a="bg-blue-50 text-blue-700"),`<span class="px-2 py-0.5 rounded text-[10px] font-bold ${a}">${t}</span>`};window.switchView=e=>{const t=document.getElementById("view-list"),a=document.getElementById("view-detail");e==="detail"?(t.classList.add("hidden"),a.classList.remove("hidden")):(t.classList.remove("hidden"),a.classList.add("hidden"),u=null)};window.openUserDetail=async e=>{try{document.body.style.cursor="wait";const t=await I(e);u=t;const a=t.profile,n=y(a.identity_number||a.id_number),l=document.getElementById("profile-card-container");l&&(l.innerHTML=C(a,{isLuhnValid:n}));const s=t.financials||{};document.getElementById("detail-income").textContent=m(s.monthly_income||0),document.getElementById("detail-expenses").textContent=m(s.monthly_expenses||0),document.getElementById("stat-total-loans").textContent=t.loans.length,document.getElementById("stat-total-docs").textContent=t.documents.length;const r=t.loans.filter(i=>["DISBURSED","ACTIVE"].includes(i.status)).reduce((i,k)=>i+Number(k.amount),0);document.getElementById("stat-active-debt").textContent=m(r);const o=document.getElementById("detail-loans-body");t.loans.length===0?o.innerHTML='<tr><td colspan="5" class="p-12 text-center text-xs font-bold text-slate-300">No applications found.</td></tr>':o.innerHTML=t.loans.map(i=>`
                <tr class="hover:bg-slate-50 transition-colors cursor-pointer group" onclick="window.location.href='/admin/application-detail?id=${i.id}'">
                    <td class="px-8 py-5 text-[10px] font-black text-slate-400 font-mono">#${i.id.substring(0,8)}</td>
                    <td class="px-6 py-5 text-xs font-bold text-slate-600">${$(i.created_at)}</td>
                    <td class="px-6 py-5 text-sm font-black text-slate-900">${m(i.amount)}</td>
                    <td class="px-6 py-5">${A(i.status)}</td>
                    <td class="px-8 py-5 text-right">
                        <span class="material-symbols-outlined text-slate-300 group-hover:text-[#a04100] transition-colors">chevron_right</span>
                    </td>
                </tr>
            `).join("");const d=document.getElementById("detail-docs-grid");t.documents.length===0?d.innerHTML='<div class="col-span-3 text-center text-[10px] font-black text-slate-400 py-8 border-2 border-dashed border-slate-50 rounded-3xl">No documents found</div>':d.innerHTML=t.documents.map(i=>`
                <div class="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/20 transition-all group">
                    <div class="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[#a04100] shadow-sm">
                        <span class="material-symbols-outlined">description</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[10px] font-black text-slate-900 truncate" title="${i.file_name}">${i.file_name}</p>
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">${i.file_type||"DOC"}</p>
                    </div>
                    <a href="${i.file_path}" target="_blank" class="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-[#a04100] transition-all"><span class="material-symbols-outlined text-[20px]">download</span></a>
                </div>
            `).join("");const p=document.getElementById("btn-transfer-branch");p&&(p.onclick=()=>window.openBranchModal()),window.switchView("detail")}catch(t){console.error("Detail Error:",t),alert("Could not load user details.")}finally{document.body.style.cursor="default"}};window.openBranchModal=()=>{if(!u)return;const e=u.profile;document.getElementById("modal-username").textContent=e.full_name;const t=document.getElementById("modal-branch-select");t.innerHTML='<option value="online">Online / Unassigned</option>',g.forEach(a=>{const n=document.createElement("option");n.value=a.id,n.textContent=a.name,e.branch_id===a.id&&(n.selected=!0),t.appendChild(n)}),document.getElementById("branch-modal").classList.remove("hidden")};window.confirmBranchTransfer=async()=>{const e=document.querySelector("#branch-modal button.bg-orange-600"),t=document.getElementById("modal-branch-select").value,a=u.profile;try{e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Moving...';const n=t==="online"?null:t,{error:l}=await v.from("profiles").update({branch_id:n}).eq("id",a.id);if(l)throw l;await v.from("loan_applications").update({branch_id:n}).eq("user_id",a.id),alert("Success! User transferred."),document.getElementById("branch-modal").classList.add("hidden"),window.location.reload()}catch(n){alert("Transfer failed: "+n.message),e.disabled=!1,e.textContent="Confirm Transfer"}};const w=e=>{const t=document.getElementById("users-table-body");if(!t)return;const a=(c-1)*b,n=e.slice(a,a+b);if(n.length===0){t.innerHTML='<tr><td colspan="5" class="p-20 text-center text-slate-300 font-bold">No results matching your query.</td></tr>';return}t.innerHTML=n.map(s=>{const r=s.branches?.name||"Online",o=y(s.identity_number||s.id_number);return`
        <tr class="hover:bg-slate-50/50 transition-colors group cursor-pointer" onclick="window.openUserDetail('${s.id}')">
            <td class="px-8 py-6">
                <div class="flex items-center gap-4">
                    <div class="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-black text-slate-400">
                        ${(s.full_name||"U").charAt(0)}
                    </div>
                    <div>
                        <div class="text-sm font-black text-slate-900">${s.full_name||"Unknown"}</div>
                        <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest">${M(s.role)}</div>
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
                    ${r}
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
        </tr>`}).join("");const l=document.getElementById("visible-count");l&&(l.textContent=e.length),S(Math.ceil(e.length/b)||1)},x=(e=!0)=>{e&&(c=1);const t=document.getElementById("user-search").value.toLowerCase(),a=document.getElementById("role-filter").value,n=document.getElementById("branch-filter").value,l=f.filter(s=>{const r=!t||(s.full_name||"").toLowerCase().includes(t)||(s.email||"").toLowerCase().includes(t)||(s.identity_number||"").includes(t)||(s.id||"").includes(t),o=U(s.role);let d=!0;a==="client"&&(d=!o),a==="staff"&&(d=o);const p=n==="all"||s.branch_id?.toString()===n||n==="online"&&!s.branch_id;return r&&d&&p});w(l)};document.addEventListener("DOMContentLoaded",async()=>{await E();const e=document.getElementById("main-content");e.innerHTML=D+T,e.className="flex-1 p-4 sm:p-6 lg:p-8 h-screen overflow-hidden flex flex-col";try{const[t,a,n]=await Promise.all([_(),B(),L()]);h=t,f=a,g=n.data||[];const l=document.getElementById("branch-filter");l.innerHTML='<option value="all">All Branches</option><option value="online">Online / Unassigned</option>',g.forEach(r=>l.innerHTML+=`<option value="${r.id}">${r.name}</option>`);const s=document.getElementById("role-filter");h.role!=="super_admin"?(s.innerHTML='<option value="client">Clients</option>',s.value="client",s.disabled=!0,s.classList.add("bg-gray-100","text-gray-500","cursor-not-allowed"),x(!0)):w(f),document.getElementById("user-search").addEventListener("input",()=>x(!0)),document.getElementById("role-filter").addEventListener("change",()=>x(!0)),document.getElementById("branch-filter").addEventListener("change",()=>x(!0))}catch(t){console.error(t),e.innerHTML=`<div class="p-8 text-center text-red-500">Failed to load directory: ${t.message}</div>`}});function S(e){let t=document.getElementById("user-pagination-container");if(t||(t=document.createElement("div"),t.id="user-pagination-container",t.className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50/50",document.getElementById("view-list").appendChild(t)),e<=1){t.innerHTML='<span class="text-xs text-gray-400">Showing all users</span>';return}t.innerHTML=`
        <span class="text-xs font-bold text-gray-500 uppercase tracking-tight">Page ${c} of ${e}</span>
        <div class="flex gap-2">
            <button onclick="window.changePageUsers(${c-1})" ${c===1?"disabled":""} class="px-4 py-2 text-xs font-bold border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm">Prev</button>
            <button onclick="window.changePageUsers(${c+1})" ${c===e?"disabled":""} class="px-4 py-2 text-xs font-bold border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm">Next</button>
        </div>
    `}window.changePageUsers=e=>{c=e,x(!1)};
