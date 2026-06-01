import"./supabaseClient-WTCtVqgB.js";/* empty css              *//* empty css               */import{i as h}from"./layout-CF2NSHyg.js";import{a as p,b as w}from"./utils-CZwHw4kl.js";import{A as k,B as E}from"./dataService-BdJkK1bK.js";import"https://esm.sh/@supabase/supabase-js@2";import"./theme-CeTh6-N5.js";let m=[],y=[],l="30days",v="",x=1;const b=15;function _(){const t=document.getElementById("main-content");t&&(t.innerHTML=`
    <div id="recovery-dashboard" class="flex flex-col h-full animate-fade-in space-y-6">
      
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
                        <button id="tab-today"   class="text-xs font-bold uppercase transition-colors pb-1 border-b-2 ${l==="today"?"border-[var(--color-primary)] text-on-surface":"text-outline border-transparent hover:text-on-surface"}">Today</button>
                        <button id="tab-7days"   class="text-xs font-bold uppercase transition-colors pb-1 border-b-2 ${l==="7days"?"border-[var(--color-primary)] text-on-surface":"text-outline border-transparent hover:text-on-surface"}">7 Days</button>
                        <button id="tab-30days"  class="text-xs font-bold uppercase transition-colors pb-1 border-b-2 ${l==="30days"?"border-[var(--color-primary)] text-on-surface":"text-outline border-transparent hover:text-on-surface"}">30 Days</button>
                        <button id="tab-all"     class="text-xs font-bold uppercase transition-colors pb-1 border-b-2 ${l==="all"?"border-[var(--color-primary)] text-on-surface":"text-outline border-transparent hover:text-on-surface"}">All</button>
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
  `,C())}async function D(){try{const[t,e]=await Promise.all([k(),E()]);if(t.error)throw t.error;if(e.error)throw e.error;m=t.data||[],y=e.data||[],I(),f(!0)}catch(t){console.error("Load Error:",t);const e=t.message||"Unable to connect to the database. Please check your connection.",a=document.getElementById("payments-table-body");a&&(a.innerHTML=`
        <tr>
          <td colspan="6" class="p-10 text-center text-xs text-red-500 italic border-2 border-dashed border-red-50 rounded-xl">
            <i class="fa-solid fa-triangle-exclamation mb-2 text-lg"></i><br>
            Error Loading Data: ${e}
          </td>
        </tr>`),window.showToast&&window.showToast("Failed to load recovery data","error")}}function I(){const e=new Date().toISOString().slice(0,7),a=m.filter(r=>r.payment_date.startsWith(e)),s=a.reduce((r,d)=>r+Number(d.amount),0),i=new Set(a.map(r=>r.loan_id)).size,c=y.filter(r=>r.month===e),n=c.reduce((r,d)=>r+(d.profit_collected_month||0),0),o=c.reduce((r,d)=>r+(d.principal_collected_month||0),0),u=c.reduce((r,d)=>r+(d.overpayment_collected_month||0),0);document.getElementById("stat-mtd-recoveries").textContent=p(s),document.getElementById("stat-revenue-yield").textContent=p(n),document.getElementById("stat-active-payers").textContent=i,document.getElementById("stat-mtd-count").innerHTML=`<i class="fa-solid fa-arrow-trend-up"></i> <span>${a.length}</span> transactions`,document.getElementById("label-principal-split").textContent=p(o),document.getElementById("label-interest-split").textContent=p(n),document.getElementById("label-overpayment-split").textContent=p(u);const g=s>0?Math.round(n/s*100):0;document.getElementById("chart-profit-percent").textContent=`${g}%`,document.getElementById("chart-interest-ring").setAttribute("stroke-dasharray",`${g}, 100`),$(a.length>0?a:m.slice(0,10))}function $(t){const e=document.getElementById("top-payments-list");if(!e)return;const a=[...t].sort((s,i)=>Number(i.amount)-Number(s.amount)).slice(0,5);if(a.length===0){e.innerHTML='<div class="text-center py-10 text-xs text-gray-400">No data for period</div>';return}e.innerHTML=a.map(s=>`
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all cursor-pointer" onclick="window.location.href='/admin/application-detail?id=${s.loan_id}'">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-black">${s.profile?.full_name?.charAt(0)||"$"}</div>
                <div>
                    <p class="text-xs font-bold text-gray-900 truncate w-24">${s.profile?.full_name||"Unknown"}</p>
                    <p class="text-[10px] text-gray-400 font-mono">#${s.loan_id}</p>
                </div>
            </div>
            <span class="text-xs font-black text-green-600">+${p(s.amount)}</span>
        </div>
    `).join("")}function B(){let t=m;if(l==="today"){const a=new Date().toISOString().slice(0,10);t=t.filter(s=>s.payment_date?.slice(0,10)===a)}else if(l==="7days"){const a=new Date;a.setDate(a.getDate()-7),t=t.filter(s=>new Date(s.payment_date)>=a)}else if(l==="30days"){const a=new Date;a.setDate(a.getDate()-30),t=t.filter(s=>new Date(s.payment_date)>=a)}else if(l==="custom"){const a=document.getElementById("filter-date-from")?.value,s=document.getElementById("filter-date-to")?.value;a&&(t=t.filter(i=>i.payment_date?.slice(0,10)>=a)),s&&(t=t.filter(i=>i.payment_date?.slice(0,10)<=s))}const e=(document.getElementById("search-input")?.value||"").toLowerCase();return e&&(t=t.filter(a=>(a.profiles?.full_name||"").toLowerCase().includes(e)||(a.reference||"").toLowerCase().includes(e))),t}function f(t=!0){t&&(x=1);let e=m;if(l==="today"){const n=new Date().toISOString().slice(0,10);e=e.filter(o=>o.payment_date?.slice(0,10)===n)}else if(l==="7days"){const n=new Date;n.setDate(n.getDate()-7),e=e.filter(o=>new Date(o.payment_date)>=n)}else if(l==="30days"){const n=new Date;n.setDate(n.getDate()-30),e=e.filter(o=>new Date(o.payment_date)>=n)}else if(l==="custom"){const n=document.getElementById("filter-date-from")?.value,o=document.getElementById("filter-date-to")?.value;n&&(e=e.filter(u=>u.payment_date?.slice(0,10)>=n)),o&&(e=e.filter(u=>u.payment_date?.slice(0,10)<=o))}const a=v.toLowerCase();a&&(e=e.filter(n=>(n.profile?.full_name||"").toLowerCase().includes(a)||String(n.id).includes(a)||String(n.loan_id).includes(a)));const s=(x-1)*b,i=e.slice(s,s+b),c=document.getElementById("payments-table-body");c&&(i.length===0?c.innerHTML='<tr><td colspan="6" class="p-10 text-center text-xs text-gray-400 italic">No transactions found.</td></tr>':c.innerHTML=i.map(n=>{const o=n.loan?.outstanding_balance||0,u=n.loan?.application?.offer_monthly_repayment||0,g=Number(n.amount);let r="",d="";return o<-1?(r=`<span class="text-[10px] font-bold px-2 py-1 rounded bg-purple-50 text-purple-700 uppercase">Credit: ${p(Math.abs(o))}</span>`,d='<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Overpaid</span>'):o<=1?(r='<span class="text-[10px] font-bold px-2 py-1 rounded bg-green-50 text-green-700 uppercase tracking-tighter">Fully Settled</span>',d='<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">Complete</span>'):(r=`<span class="text-[10px] font-bold px-2 py-1 rounded bg-red-50 text-red-700 uppercase tracking-tighter">Due: ${p(o)}</span>`,d=g<u?'<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">Partial</span>':'<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">On Track</span>'),`
                <tr class="hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0">
                    <td class="px-6 py-4 text-xs text-gray-500 font-medium whitespace-nowrap">${w(n.payment_date)}</td>
                    <td class="px-6 py-4">
                        <div class="flex flex-col">
                            <span class="text-xs font-bold text-gray-900">${n.profile?.full_name||"Unknown"}</span>
                            <span class="text-[10px] text-gray-400 font-mono tracking-tighter">TX ID: #${n.id}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <a href="/admin/application-detail?id=${n.loan_id}" class="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100">
                            #${n.loan_id}
                        </a>
                    </td>
                    <td class="px-6 py-4 text-center">${d}</td>
                    <td class="px-6 py-4 text-right">
                        <span class="text-xs font-black text-gray-900">+ ${p(n.amount)}</span>
                    </td>
                    <td class="px-6 py-4 text-right">${r}</td>
                </tr>`}).join("")),L(e.length)}function L(t){const e=document.getElementById("pagination-controls");if(!e)return;const a=Math.ceil(t/b)||1;e.innerHTML=`
        <div class="flex justify-between items-center">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Page ${x} of ${a}</span>
            <div class="flex gap-2">
                <button onclick="window.changePageRecovery(${x-1})" ${x===1?"disabled":""} class="px-3 py-1 text-[10px] font-bold border rounded-lg bg-white disabled:opacity-30 hover:bg-gray-50 transition-all text-gray-700">Prev</button>
                <button onclick="window.changePageRecovery(${x+1})" ${x===a?"disabled":""} class="px-3 py-1 text-[10px] font-bold border rounded-lg bg-white disabled:opacity-30 hover:bg-gray-50 transition-all text-gray-700">Next</button>
            </div>
        </div>`}function C(){document.getElementById("search-input")?.addEventListener("input",e=>{v=e.target.value.trim(),f(!0)});const t=e=>{l=e,f(!0)};document.getElementById("tab-today")?.addEventListener("click",()=>t("today")),document.getElementById("tab-7days")?.addEventListener("click",()=>t("7days")),document.getElementById("tab-30days")?.addEventListener("click",()=>t("30days")),document.getElementById("tab-all")?.addEventListener("click",()=>t("all")),document.getElementById("filter-date-from")?.addEventListener("change",()=>{l="custom",f(!0)}),document.getElementById("filter-date-to")?.addEventListener("change",()=>{l="custom",f(!0)}),document.getElementById("btn-export-payments")?.addEventListener("click",P)}function P(){const t=B();if(!t.length){alert("No payments to export for this period.");return}const e=["Date","Client","ID Number","Reference","Amount Paid","Status","Payment Method"],a=t.map(o=>[o.payment_date?.slice(0,10)||"",`"${(o.profiles?.full_name||"").replace(/"/g,'""')}"`,o.profiles?.identity_number||"",o.reference||o.id||"",o.amount_paid||o.amount||0,o.status||"",o.payment_method||""].join(",")),s=[e.join(","),...a].join(`
`),i=new Blob([s],{type:"text/csv;charset=utf-8;"}),c=URL.createObjectURL(i),n=document.createElement("a");n.href=c,n.download=`incoming_payments_${l}_${new Date().toISOString().slice(0,10)}.csv`,document.body.appendChild(n),n.click(),document.body.removeChild(n),URL.revokeObjectURL(c)}window.changePageRecovery=t=>{x=t,f(!1)};document.addEventListener("DOMContentLoaded",async()=>{await h()&&(_(),await D())});
