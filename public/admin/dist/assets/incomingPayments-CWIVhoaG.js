import{supabase as b}from"./supabaseClient-WTCtVqgB.js";/* empty css              *//* empty css               */import{i as $}from"./layout-DLkpXMPI.js";import{a as u,b as E}from"./utils-CZwHw4kl.js";import{A as P,B as D}from"./dataService-edWZtrJs.js";import"https://esm.sh/@supabase/supabase-js@2";import"./theme-CeTh6-N5.js";let m=[];async function w(){const{data:e,error:n}=await b.from("manual_payments").select("*, profiles:user_id(full_name, phone, identity_number), loan_applications:application_id(loan_number, amount, status)").eq("status","pending").order("created_at",{ascending:!1});if(n){console.warn("[manual-payments]",n.message);return}m=e||[],h()}function h(){const e=document.getElementById("pending-manual-payments");if(!e)return;if(!m.length){e.innerHTML=`
      <div class="flex items-center gap-2 text-sm text-slate-400 py-4">
        <span class="material-symbols-outlined text-[18px]">check_circle</span>
        No pending manual payments
      </div>`;return}const n=document.getElementById("pending-count-badge");n&&(n.textContent=m.length,n.classList.remove("hidden")),e.innerHTML=m.map(t=>{const s=t.profiles?.full_name||"Unknown",r=t.profiles?.phone||"—",i=t.loan_applications?.loan_number||t.application_id?.toString().slice(0,8)||"—",a=t.payment_type==="settlement"?"Settlement":t.payment_type==="arrears"?"Arrears Payment":"Payment",o=t.payment_type==="settlement"?"text-purple-600 bg-purple-50":"text-green-700 bg-green-50",c=Math.floor((Date.now()-new Date(t.created_at))/36e5),f=c<1?"Just now":c<24?`${c}h ago`:`${Math.floor(c/24)}d ago`;return`
      <div class="border border-slate-100 rounded-2xl p-4 hover:border-orange-200 hover:bg-orange-50/30 transition-all" id="mp-${t.id}">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-600 text-sm flex-shrink-0">
              ${s.charAt(0).toUpperCase()}
            </div>
            <div class="min-w-0">
              <p class="font-bold text-slate-900 text-sm truncate">${s}</p>
              <p class="text-xs text-slate-400">${r} · Loan ${i}</p>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="font-black text-lg text-slate-900">R ${Number(t.amount).toLocaleString("en-ZA",{minimumFractionDigits:2})}</p>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${o}">${a}</span>
          </div>
        </div>

        ${t.reference?`<p class="text-xs text-slate-500 mt-2"><span class="font-semibold">Ref:</span> ${t.reference}</p>`:""}
        ${t.proof_url?`<p class="text-xs text-slate-500 mt-1"><span class="font-semibold">Proof:</span> <a href="${t.proof_url}" target="_blank" class="text-orange-600 underline">${t.proof_url.length>40?t.proof_url.slice(0,40)+"…":t.proof_url}</a></p>`:""}
        ${t.notes?`<p class="text-xs text-slate-500 mt-1 italic">"${t.notes}"</p>`:""}

        <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <span class="text-[10px] text-slate-400">${f}</span>
          <div class="flex gap-2">
            <button onclick="window.rejectManualPayment('${t.id}')"
              class="px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
              Reject
            </button>
            <button onclick="window.confirmManualPayment('${t.id}','${t.payment_type}','${s}')"
              class="px-3 py-1.5 text-xs font-bold text-white rounded-xl transition-colors flex items-center gap-1.5"
              style="background:var(--color-primary)">
              <span class="material-symbols-outlined text-[14px]">check</span> Confirm
            </button>
          </div>
        </div>
      </div>`}).join("")}window.confirmManualPayment=async(e,n,t)=>{if(!confirm(`Confirm ${n==="settlement"?"SETTLEMENT":"payment"} from ${t}?

This will:
• Mark as confirmed
• Post to Cash Ledger
• Send SMS to client${n==="settlement"?`
• Set loan status to SETTLED`:""}`))return;const{data:{session:s}}=await b.auth.getSession(),i=await(await fetch(`/api/admin/payment/confirm/${e}`,{method:"POST",headers:{Authorization:`Bearer ${s.access_token}`,"Content-Type":"application/json"}})).json();if(i.success){const a=document.getElementById(`mp-${e}`);a&&(a.style.opacity="0",a.style.transform="scale(0.95)",a.style.transition="all .3s",setTimeout(()=>a.remove(),300)),m=m.filter(o=>o.id!==e),h()}else alert("Error: "+(i.error||"Could not confirm"))};window.rejectManualPayment=async e=>{const n=prompt("Reason for rejection (sent to client):");if(n===null)return;const{data:{session:t}}=await b.auth.getSession(),{error:s}=await b.from("manual_payments").update({status:"rejected",rejection_reason:n,confirmed_at:new Date().toISOString()}).eq("id",e);if(!s){const r=document.getElementById(`mp-${e}`);r&&(r.style.opacity="0",r.style.transition="all .3s",setTimeout(()=>r.remove(),300)),m=m.filter(i=>i.id!==e),h()}};let y=[],_=[],d="30days",k="",x=1;const v=15;function I(){const e=document.getElementById("main-content");e&&(e.innerHTML=`
    <div id="recovery-dashboard" class="flex flex-col h-full animate-fade-in space-y-6">

      <!-- Pending Manual Payments Banner -->
      <div class="glass-card rounded-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]" style="color:var(--color-primary)">payments</span>
            </div>
            <div>
              <h3 class="font-bold text-slate-900">Manual Payment Proofs</h3>
              <p class="text-xs text-slate-400">EFT / self-submitted payments awaiting confirmation</p>
            </div>
            <span id="pending-count-badge" class="hidden ml-1 px-2 py-0.5 text-xs font-black text-white rounded-full" style="background:var(--color-primary)">0</span>
          </div>
          <button onclick="window.loadPendingManualPayments()" class="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors">
            <span class="material-symbols-outlined text-[14px]">refresh</span> Refresh
          </button>
        </div>
        <div id="pending-manual-payments" class="p-4 space-y-3">
          <div class="text-sm text-slate-400 py-4 text-center">Loading...</div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="glass-card p-8 rounded-2xl flex items-center justify-between relative overflow-hidden group">
            <div class="z-10">
                <p class="text-[11px] font-semibold uppercase tracking-widest text-outline">Total Recoveries (MTD)</p>
                <h2 id="stat-mtd-recoveries" class="text-3xl font-black text-on-surface mt-2">R 0.00</h2>
                <p id="stat-mtd-count" class="text-xs text-green-600 font-bold mt-1 flex items-center gap-1"></p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shadow-sm z-10">
                <span class="material-symbols-outlined">payments</span>
            </div>
        </div>

        <div class="glass-card p-8 rounded-2xl flex items-center justify-between relative overflow-hidden">
            <div class="z-10">
                <p class="text-[11px] font-semibold uppercase tracking-widest text-outline">Realized Profit (MTD)</p>
                <h2 id="stat-revenue-yield" class="text-3xl font-black text-indigo-900 mt-2">R 0.00</h2>
                <p class="text-xs text-indigo-400 font-bold mt-1 tracking-tight">Contractual Fees & Interest</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm z-10">
                <span class="material-symbols-outlined">donut_large</span>
            </div>
        </div>

        <div class="glass-card p-8 rounded-2xl flex items-center justify-between relative overflow-hidden">
            <div class="z-10">
                <p class="text-[11px] font-semibold uppercase tracking-widest text-outline">Active Payers</p>
                <h2 id="stat-active-payers" class="text-3xl font-black text-on-surface mt-2">0</h2>
                <p class="text-xs text-outline font-bold mt-1">Unique clients this period</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-surface-container text-outline flex items-center justify-center shadow-sm z-10">
                <span class="material-symbols-outlined">group</span>
            </div>
        </div>
      </div>

      <div class="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        <div class="lg:w-3/4 glass-card rounded-2xl flex flex-col overflow-hidden">

            <div class="p-5 border-b border-outline-variant/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 class="text-lg font-headline font-bold text-on-surface uppercase tracking-tight">Recovery Detail</h3>
                    <div class="flex gap-6 mt-2">
                        <button id="tab-today"   class="text-xs font-bold uppercase transition-colors pb-1 border-b-2 ${d==="today"?"border-[var(--color-primary)] text-on-surface":"text-outline border-transparent hover:text-on-surface"}">Today</button>
                        <button id="tab-7days"   class="text-xs font-bold uppercase transition-colors pb-1 border-b-2 ${d==="7days"?"border-[var(--color-primary)] text-on-surface":"text-outline border-transparent hover:text-on-surface"}">7 Days</button>
                        <button id="tab-30days"  class="text-xs font-bold uppercase transition-colors pb-1 border-b-2 ${d==="30days"?"border-[var(--color-primary)] text-on-surface":"text-outline border-transparent hover:text-on-surface"}">30 Days</button>
                        <button id="tab-all"     class="text-xs font-bold uppercase transition-colors pb-1 border-b-2 ${d==="all"?"border-[var(--color-primary)] text-on-surface":"text-outline border-transparent hover:text-on-surface"}">All</button>
                        <span class="text-outline text-xs">|</span>
                        <input type="date" id="filter-date-from" class="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:ring-orange-400 focus:outline-none" title="From date">
                        <span class="text-xs text-outline">→</span>
                        <input type="date" id="filter-date-to" class="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:ring-orange-400 focus:outline-none" title="To date">
                    </div>
                    <div style="margin-top:6px;">
                      <button id="btn-export-payments" class="text-xs font-bold text-orange-600 border border-orange-200 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                        <i class="fa-solid fa-download text-xs"></i> Export CSV
                      </button>
                    </div>
                </div>
                <div class="relative flex-1 sm:w-64">
                    <input type="text" id="search-input" placeholder="Search client or ID..." 
                           class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-orange-500 text-xs focus:bg-white transition-colors">
                    <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
                </div>
            </div>

            <div class="flex-1 overflow-auto custom-scrollbar relative">
                <table class="min-w-full divide-y divide-outline-variant/10">
                    <thead class="bg-surface-container sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                            <th class="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-outline">Date</th>
                            <th class="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-outline">Client & ID</th>
                            <th class="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-outline">Loan Ref</th>
                            <th class="px-6 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-outline">Status</th>
                            <th class="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-outline">Paid In</th>
                            <th class="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-outline">Balance</th>
                        </tr>
                    </thead>
                    <tbody id="payments-table-body" class="bg-white divide-y divide-outline-variant/10">
                        <tr><td colspan="6" class="p-10 text-center text-xs text-gray-400 italic">Initializing transaction view...</td></tr>
                    </tbody>
                </table>
            </div>
            
            <div id="pagination-controls" class="border-t border-gray-100 bg-gray-50/50 p-3"></div>
        </div>

        <div class="lg:w-1/4 flex flex-col gap-6">
            
            <div class="glass-card p-8 rounded-2xl">
                <h4 class="text-[11px] font-semibold uppercase tracking-widest text-outline mb-4">Allocation (MTD)</h4>
                
                <div class="relative w-40 h-40 mx-auto mb-6">
                    <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
                        <path class="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.8" />
                        <path id="chart-interest-ring" class="text-indigo-500 transition-all duration-1000" stroke-dasharray="0, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.8" />
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="text-[10px] text-gray-400 font-bold uppercase">Profit</span>
                        <span id="chart-profit-percent" class="text-xl font-black text-gray-900">0%</span>
                    </div>
                </div>

                <div class="space-y-2">
                    <div class="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span class="text-[10px] font-bold text-gray-500 uppercase">Capital Back</span>
                        <span id="label-principal-split" class="text-xs font-black text-gray-900">R 0</span>
                    </div>
                    <div class="flex justify-between items-center p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                        <span class="text-[10px] font-bold text-indigo-600 uppercase">Interest/Fees</span>
                        <span id="label-interest-split" class="text-xs font-black text-indigo-900">R 0</span>
                    </div>
                    <div class="flex justify-between items-center p-2 bg-purple-50 rounded-lg border border-purple-100">
                        <span class="text-[10px] font-bold text-purple-600 uppercase">Credit/Extra</span>
                        <span id="label-overpayment-split" class="text-xs font-black text-purple-900">R 0</span>
                    </div>
                </div>
            </div>

            <div class="glass-card p-8 rounded-2xl flex-1">
                <h4 class="text-[11px] font-semibold uppercase tracking-widest text-outline mb-4">Top Period Recoveries</h4>
                <div id="top-payments-list" class="space-y-3 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar"></div>
            </div>

        </div>
      </div>
    </div>
  `,j())}async function L(){try{const[e,n]=await Promise.all([P(),D()]);if(e.error)throw e.error;if(n.error)throw n.error;y=e.data||[],_=n.data||[],M(),g(!0)}catch(e){console.error("Load Error:",e);const n=e.message||"Unable to connect to the database. Please check your connection.",t=document.getElementById("payments-table-body");t&&(t.innerHTML=`
        <tr>
          <td colspan="6" class="p-10 text-center text-xs text-red-500 italic border-2 border-dashed border-red-50 rounded-xl">
            <i class="fa-solid fa-triangle-exclamation mb-2 text-lg"></i><br>
            Error Loading Data: ${n}
          </td>
        </tr>`),window.showToast&&window.showToast("Failed to load recovery data","error")}}function M(){const n=new Date().toISOString().slice(0,7),t=y.filter(l=>l.payment_date.startsWith(n)),s=t.reduce((l,p)=>l+Number(p.amount),0),r=new Set(t.map(l=>l.loan_id)).size,i=_.filter(l=>l.month===n),a=i.reduce((l,p)=>l+(p.profit_collected_month||0),0),o=i.reduce((l,p)=>l+(p.principal_collected_month||0),0),c=i.reduce((l,p)=>l+(p.overpayment_collected_month||0),0);document.getElementById("stat-mtd-recoveries").textContent=u(s),document.getElementById("stat-revenue-yield").textContent=u(a),document.getElementById("stat-active-payers").textContent=r,document.getElementById("stat-mtd-count").innerHTML=`<i class="fa-solid fa-arrow-trend-up"></i> <span>${t.length}</span> transactions`,document.getElementById("label-principal-split").textContent=u(o),document.getElementById("label-interest-split").textContent=u(a),document.getElementById("label-overpayment-split").textContent=u(c);const f=s>0?Math.round(a/s*100):0;document.getElementById("chart-profit-percent").textContent=`${f}%`,document.getElementById("chart-interest-ring").setAttribute("stroke-dasharray",`${f}, 100`),T(t.length>0?t:y.slice(0,10))}function T(e){const n=document.getElementById("top-payments-list");if(!n)return;const t=[...e].sort((s,r)=>Number(r.amount)-Number(s.amount)).slice(0,5);if(t.length===0){n.innerHTML='<div class="text-center py-10 text-xs text-gray-400">No data for period</div>';return}n.innerHTML=t.map(s=>`
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all cursor-pointer" onclick="window.location.href='/admin/application-detail?id=${s.loan_id}'">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-black">${s.profile?.full_name?.charAt(0)||"$"}</div>
                <div>
                    <p class="text-xs font-bold text-gray-900 truncate w-24">${s.profile?.full_name||"Unknown"}</p>
                    <p class="text-[10px] text-gray-400 font-mono">#${s.loan_id}</p>
                </div>
            </div>
            <span class="text-xs font-black text-green-600">+${u(s.amount)}</span>
        </div>
    `).join("")}function B(){let e=y;if(d==="today"){const t=new Date().toISOString().slice(0,10);e=e.filter(s=>s.payment_date?.slice(0,10)===t)}else if(d==="7days"){const t=new Date;t.setDate(t.getDate()-7),e=e.filter(s=>new Date(s.payment_date)>=t)}else if(d==="30days"){const t=new Date;t.setDate(t.getDate()-30),e=e.filter(s=>new Date(s.payment_date)>=t)}else if(d==="custom"){const t=document.getElementById("filter-date-from")?.value,s=document.getElementById("filter-date-to")?.value;t&&(e=e.filter(r=>r.payment_date?.slice(0,10)>=t)),s&&(e=e.filter(r=>r.payment_date?.slice(0,10)<=s))}const n=(document.getElementById("search-input")?.value||"").toLowerCase();return n&&(e=e.filter(t=>(t.profiles?.full_name||"").toLowerCase().includes(n)||(t.reference||"").toLowerCase().includes(n))),e}function g(e=!0){e&&(x=1);let n=y;if(d==="today"){const a=new Date().toISOString().slice(0,10);n=n.filter(o=>o.payment_date?.slice(0,10)===a)}else if(d==="7days"){const a=new Date;a.setDate(a.getDate()-7),n=n.filter(o=>new Date(o.payment_date)>=a)}else if(d==="30days"){const a=new Date;a.setDate(a.getDate()-30),n=n.filter(o=>new Date(o.payment_date)>=a)}else if(d==="custom"){const a=document.getElementById("filter-date-from")?.value,o=document.getElementById("filter-date-to")?.value;a&&(n=n.filter(c=>c.payment_date?.slice(0,10)>=a)),o&&(n=n.filter(c=>c.payment_date?.slice(0,10)<=o))}const t=k.toLowerCase();t&&(n=n.filter(a=>(a.profile?.full_name||"").toLowerCase().includes(t)||String(a.id).includes(t)||String(a.loan_id).includes(t)));const s=(x-1)*v,r=n.slice(s,s+v),i=document.getElementById("payments-table-body");i&&(r.length===0?i.innerHTML='<tr><td colspan="6" class="p-10 text-center text-xs text-gray-400 italic">No transactions found.</td></tr>':i.innerHTML=r.map(a=>{const o=a.loan?.outstanding_balance||0,c=a.loan?.application?.offer_monthly_repayment||0,f=Number(a.amount);let l="",p="";return o<-1?(l=`<span class="text-[10px] font-bold px-2 py-1 rounded bg-purple-50 text-purple-700 uppercase">Credit: ${u(Math.abs(o))}</span>`,p='<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Overpaid</span>'):o<=1?(l='<span class="text-[10px] font-bold px-2 py-1 rounded bg-green-50 text-green-700 uppercase tracking-tighter">Fully Settled</span>',p='<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">Complete</span>'):(l=`<span class="text-[10px] font-bold px-2 py-1 rounded bg-red-50 text-red-700 uppercase tracking-tighter">Due: ${u(o)}</span>`,p=f<c?'<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">Partial</span>':'<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">On Track</span>'),`
                <tr class="hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0">
                    <td class="px-6 py-4 text-xs text-gray-500 font-medium whitespace-nowrap">${E(a.payment_date)}</td>
                    <td class="px-6 py-4">
                        <div class="flex flex-col">
                            <span class="text-xs font-bold text-gray-900">${a.profile?.full_name||"Unknown"}</span>
                            <span class="text-[10px] text-gray-400 font-mono tracking-tighter">TX ID: #${a.id}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <a href="/admin/application-detail?id=${a.loan_id}" class="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100">
                            #${a.loan_id}
                        </a>
                    </td>
                    <td class="px-6 py-4 text-center">${p}</td>
                    <td class="px-6 py-4 text-right">
                        <span class="text-xs font-black text-gray-900">+ ${u(a.amount)}</span>
                    </td>
                    <td class="px-6 py-4 text-right">${l}</td>
                </tr>`}).join("")),C(n.length)}function C(e){const n=document.getElementById("pagination-controls");if(!n)return;const t=Math.ceil(e/v)||1;n.innerHTML=`
        <div class="flex justify-between items-center">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Page ${x} of ${t}</span>
            <div class="flex gap-2">
                <button onclick="window.changePageRecovery(${x-1})" ${x===1?"disabled":""} class="px-3 py-1 text-[10px] font-bold border rounded-lg bg-white disabled:opacity-30 hover:bg-gray-50 transition-all text-gray-700">Prev</button>
                <button onclick="window.changePageRecovery(${x+1})" ${x===t?"disabled":""} class="px-3 py-1 text-[10px] font-bold border rounded-lg bg-white disabled:opacity-30 hover:bg-gray-50 transition-all text-gray-700">Next</button>
            </div>
        </div>`}function j(){document.getElementById("search-input")?.addEventListener("input",n=>{k=n.target.value.trim(),g(!0)});const e=n=>{d=n,g(!0)};document.getElementById("tab-today")?.addEventListener("click",()=>e("today")),document.getElementById("tab-7days")?.addEventListener("click",()=>e("7days")),document.getElementById("tab-30days")?.addEventListener("click",()=>e("30days")),document.getElementById("tab-all")?.addEventListener("click",()=>e("all")),document.getElementById("filter-date-from")?.addEventListener("change",()=>{d="custom",g(!0)}),document.getElementById("filter-date-to")?.addEventListener("change",()=>{d="custom",g(!0)}),document.getElementById("btn-export-payments")?.addEventListener("click",S)}function S(){const e=B();if(!e.length){alert("No payments to export for this period.");return}const n=["Date","Client","ID Number","Reference","Amount Paid","Status","Payment Method"],t=e.map(o=>[o.payment_date?.slice(0,10)||"",`"${(o.profiles?.full_name||"").replace(/"/g,'""')}"`,o.profiles?.identity_number||"",o.reference||o.id||"",o.amount_paid||o.amount||0,o.status||"",o.payment_method||""].join(",")),s=[n.join(","),...t].join(`
`),r=new Blob([s],{type:"text/csv;charset=utf-8;"}),i=URL.createObjectURL(r),a=document.createElement("a");a.href=i,a.download=`incoming_payments_${d}_${new Date().toISOString().slice(0,10)}.csv`,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(i)}window.changePageRecovery=e=>{x=e,g(!1)};document.addEventListener("DOMContentLoaded",async()=>{await $()&&(I(),await Promise.all([L(),w()]))});window.loadPendingManualPayments=w;
