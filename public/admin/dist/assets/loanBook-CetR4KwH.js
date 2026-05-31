import"./supabaseClient-WTCtVqgB.js";/* empty css              *//* empty css               */import{i as v}from"./layout-BuEx1KZr.js";import{p as _,B as w}from"./dataService-P9YE594z.js";import{a as u,S as $}from"./utils-CZwHw4kl.js";import"https://esm.sh/@supabase/supabase-js@2";import"./theme-BmY-8nnP.js";let m=[],n=[],x=[],b="all",y="all",f="",c="created_at",i="desc";document.addEventListener("DOMContentLoaded",async()=>{const a=await v();await S(),a?.role&&a.role!=="super_admin"&&a.profile?.branch_id&&(b=String(a.profile.branch_id)),L(),await g()});async function S(){const{data:a}=await _();x=a||[]}async function g(){const a=document.getElementById("lb-spinner");a&&a.classList.remove("hidden");const{data:s}=await w(b);m=s||[],p(),a&&a.classList.add("hidden")}function p(){n=m.filter(a=>{const s=y==="all"||a.status===y,t=f.toLowerCase(),o=!t||(a.client_name||"").toLowerCase().includes(t)||(a.reference||"").toLowerCase().includes(t)||(a.identity_number||"").includes(t);return s&&o}),n.sort((a,s)=>{let t=a[c],o=s[c];return typeof t=="string"&&(t=t.toLowerCase()),typeof o=="string"&&(o=o.toLowerCase()),t<o?i==="asc"?-1:1:t>o?i==="asc"?1:-1:0}),A(),D()}function L(){const a=document.getElementById("app-shell"),s=a.querySelector("main")||a;let t=s.querySelector("#lb-content");t||(t=document.createElement("div"),t.id="lb-content",t.className="p-6 max-w-[1600px] mx-auto",s.appendChild(t)),t.innerHTML=`
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Loan Book</h1>
          <p class="text-sm text-gray-500 mt-0.5">Full portfolio — tracking days, arrears, maturity dates</p>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <select id="lb-branch" onchange="window.lbSetBranch(this.value)"
            class="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white font-semibold focus:ring-orange-400 focus:outline-none">
            <option value="all">All Branches</option>
            ${x.map(o=>`<option value="${o.id}">${o.name}</option>`).join("")}
          </select>
          <select id="lb-status" onchange="window.lbSetStatus(this.value)"
            class="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white font-semibold focus:ring-orange-400 focus:outline-none">
            <option value="all">All Statuses</option>
            <option value="DISBURSED">Disbursed</option>
            <option value="IN_ARREARS">In Arrears</option>
            <option value="IN_DEFAULT">In Default</option>
            <option value="READY_TO_DISBURSE">Approved</option>
          </select>
          <input type="text" id="lb-search" placeholder="Search client, reference..."
            oninput="window.lbSearch(this.value)"
            class="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:ring-orange-400 focus:outline-none w-56">
          <button onclick="window.lbExport()"
            class="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold px-4 py-2 rounded-xl transition-colors">
            <i class="fas fa-download text-xs"></i> Export
          </button>
        </div>
      </div>

      <!-- Summary cards -->
      <div id="lb-summary" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"></div>

      <!-- Spinner -->
      <div id="lb-spinner" class="text-center py-12 text-gray-400 hidden">
        <i class="fa-solid fa-circle-notch fa-spin text-3xl mb-3"></i>
        <p class="text-sm">Loading loan book...</p>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[1200px]">
            <thead>
              <tr class="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                ${[["reference","Reference"],["client_name","Client"],["amount","Amount"],["monthly_payment","Monthly"],["status","Status"],["days_active","Days Active"],["days_overdue","Days Overdue"],["days_to_maturity","Days to Maturity"],["disbursed_date","Disbursed"],["maturity_date","Maturity"],["band","Band"],["purpose","Purpose"]].map(([o,r])=>`
                  <th class="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onclick="window.lbSort('${o}')">
                    ${r} <span id="sort-${o}" class="ml-1 text-gray-300">↕</span>
                  </th>`).join("")}
                <th class="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody id="lb-table-body" class="divide-y divide-gray-50">
              <tr><td colspan="13" class="p-10 text-center text-sm text-gray-400">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>`,window.lbSetBranch=o=>{b=o,g()},window.lbSetStatus=o=>{y=o,p()},window.lbSearch=o=>{f=o,p()},window.lbSort=B,window.lbExport=E}function D(){const a=document.getElementById("lb-summary");if(!a)return;const s=n.length,t=n.reduce((e,d)=>e+d.amount,0),o=n.filter(e=>e.status==="IN_ARREARS").length,r=n.filter(e=>e.status==="IN_DEFAULT").length,l=n.filter(e=>e.days_active!==null).reduce((e,d,I,h)=>e+d.days_active/h.length,0);a.innerHTML=[{label:"Total Loans",value:s,color:"#E7762E",bg:"#fff3ea",icon:"receipt_long"},{label:"Loan Book Value",value:u(t),color:"#10b981",bg:"#d1fae5",icon:"payments"},{label:"In Arrears",value:o,color:"#f59e0b",bg:"#fef3c7",icon:"warning"},{label:"In Default",value:r,color:"#ef4444",bg:"#fee2e2",icon:"error"},{label:"Avg Days Active",value:Math.round(l)||"—",color:"#6b7280",bg:"#f3f4f6",icon:"schedule"}].map(e=>`
      <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style="background:${e.bg}">
          <span class="material-symbols-outlined text-[18px]" style="color:${e.color}">${e.icon}</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">${e.label}</p>
          <p class="text-lg font-black mt-0.5" style="color:${e.color}">${e.value}</p>
        </div>
      </div>`).join("")}function A(){const a=document.getElementById("lb-table-body");if(!a)return;if(!n.length){a.innerHTML='<tr><td colspan="13" class="p-10 text-center text-sm text-gray-400">No loans match your filters.</td></tr>';return}a.innerHTML=n.map(t=>{const o=$[t.status]||{label:t.status,color:"#6b7280",bg:"#f3f4f6"},r=t.status==="IN_DEFAULT",l=t.status==="IN_ARREARS",e=t.days_overdue>0?`<span class="font-bold ${r?"text-red-600":"text-yellow-600"}">${t.days_overdue}d</span>`:'<span class="text-gray-300">—</span>',d=t.days_to_maturity!==null?t.days_to_maturity<0?`<span class="font-bold text-red-500">${Math.abs(t.days_to_maturity)}d overdue</span>`:`<span class="${t.days_to_maturity<30?"font-bold text-orange-500":"text-gray-600"}">${t.days_to_maturity}d</span>`:'<span class="text-gray-300">—</span>';return`
        <tr class="hover:bg-gray-50 transition-colors ${r?"bg-red-50/30":l?"bg-yellow-50/30":""}">
          <td class="px-4 py-3"><span class="font-mono text-xs font-bold text-orange-600">${t.reference}</span></td>
          <td class="px-4 py-3">
            <div class="font-semibold text-gray-900 text-xs">${t.client_name}</div>
            <div class="text-[10px] text-gray-400 font-mono">${t.identity_number||""}</div>
          </td>
          <td class="px-4 py-3 font-bold text-gray-900">${u(t.amount)}</td>
          <td class="px-4 py-3 text-gray-600">${u(t.monthly_payment)}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" style="background:${o.bg};color:${o.color}">${o.label}</span>
          </td>
          <td class="px-4 py-3 text-gray-600">${t.days_active!==null?t.days_active+"d":"—"}</td>
          <td class="px-4 py-3">${e}</td>
          <td class="px-4 py-3">${d}</td>
          <td class="px-4 py-3 text-xs text-gray-500">${t.disbursed_date}</td>
          <td class="px-4 py-3 text-xs text-gray-500">${t.maturity_date}</td>
          <td class="px-4 py-3">
            ${t.band?`<span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-600">${t.band}</span>`:"—"}
          </td>
          <td class="px-4 py-3 text-xs text-gray-500">${t.purpose}</td>
          <td class="px-4 py-3 text-center">
            <a href="/admin/application-detail?id=${t.id}" class="text-gray-400 hover:text-orange-600 transition-colors p-1.5 rounded-lg hover:bg-orange-50 inline-block">
              <span class="material-symbols-outlined text-[16px]">visibility</span>
            </a>
          </td>
        </tr>`}).join(""),document.querySelectorAll('[id^="sort-"]').forEach(t=>t.textContent="↕");const s=document.getElementById(`sort-${c}`);s&&(s.textContent=i==="asc"?"↑":"↓")}function B(a){c===a?i=i==="asc"?"desc":"asc":(c=a,i=a==="client_name"?"asc":"desc"),p()}function E(){if(!n.length){alert("No data to export.");return}const a=["Reference","Client","ID Number","Amount","Monthly","Total Repayable","Status","Band","Rate (%)","Term","Purpose","Disbursed Date","Maturity Date","Days Active","Days Overdue","Days to Maturity","Bank","Account Number"],s=n.map(e=>[e.reference,`"${e.client_name.replace(/"/g,'""')}"`,e.identity_number,e.amount,e.monthly_payment,e.total_repayable,e.status,e.band||"",e.interest_rate||"",e.term_months||"",`"${e.purpose.replace(/"/g,'""')}"`,e.disbursed_date,e.maturity_date,e.days_active??"",e.days_overdue??"",e.days_to_maturity??"",`"${e.bank.replace(/"/g,'""')}"`,e.account].join(",")),t=[a.join(","),...s].join(`
`),o=new Blob([t],{type:"text/csv;charset=utf-8;"}),r=URL.createObjectURL(o),l=document.createElement("a");l.href=r,l.download=`loan_book_${new Date().toISOString().slice(0,10)}.csv`,document.body.appendChild(l),l.click(),document.body.removeChild(l),URL.revokeObjectURL(r)}
