import{supabase as u}from"./supabaseClient-WTCtVqgB.js";/* empty css              *//* empty css               */import{i as w}from"./layout-BuEx1KZr.js";import{a as c}from"./utils-CZwHw4kl.js";import"https://esm.sh/@supabase/supabase-js@2";import"./theme-BmY-8nnP.js";let d=[],g=[],p="all",i=new Date().toISOString().slice(0,10);document.addEventListener("DOMContentLoaded",async()=>{await w(),await v(),k(),await y()});async function v(){const{data:a}=await u.from("branches").select("id, name").order("name");g=a||[]}async function y(){let a=u.from("cash_journal").select("*").order("entry_date",{ascending:!1}).order("created_at",{ascending:!1});p!=="all"&&(a=a.eq("branch_id",p));const{data:o,error:t}=await a;if(t){console.error("[cash-ledger]",t);return}d=o||[],x(),m()}async function _(a){const{data:{session:o}}=await u.auth.getSession(),{data:t}=await u.from("profiles").select("full_name").eq("id",o.user.id).maybeSingle(),{error:n}=await u.from("cash_journal").insert([{...a,created_by:o.user.id,created_by_name:t?.full_name||o.user.email}]);if(n)throw n;await y()}function k(){const a=document.getElementById("app-shell"),o=a.querySelector("main")||a;let t=o.querySelector("#cl-content");t||(t=document.createElement("div"),t.id="cl-content",t.className="p-6 max-w-6xl mx-auto",o.appendChild(t)),t.innerHTML=`
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Cash Ledger</h1>
          <p class="text-sm text-gray-500 mt-0.5">Daily cash flow journal — read-only. Entries cannot be deleted.</p>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <select id="branch-select" onchange="window.clSwitchBranch(this.value)"
            class="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white font-semibold focus:ring-orange-400 focus:outline-none">
            <option value="all">All Branches</option>
            ${g.map(n=>`<option value="${n.id}" ${n.id===p?"selected":""}>${n.name}</option>`).join("")}
          </select>
          <input type="date" id="date-filter" value="${i}"
            onchange="window.clFilterDate(this.value)"
            class="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white font-semibold focus:ring-orange-400 focus:outline-none">
          <button onclick="window.clOpenJournal()"
            class="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <i class="fas fa-plus text-xs"></i> Add Journal Entry
          </button>
          <button onclick="window.clExport()"
            class="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">
            <i class="fas fa-download text-xs"></i> Export
          </button>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" id="cl-summary"></div>

      <!-- Ledger table -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th class="px-5 py-3 text-left">Date</th>
                <th class="px-5 py-3 text-left">Type</th>
                <th class="px-5 py-3 text-left">Category</th>
                <th class="px-5 py-3 text-left">Description</th>
                <th class="px-5 py-3 text-left">Reference</th>
                <th class="px-5 py-3 text-right">Cash In</th>
                <th class="px-5 py-3 text-right">Cash Out</th>
                <th class="px-5 py-3 text-right">Running Balance</th>
                <th class="px-5 py-3 text-left">By</th>
              </tr>
            </thead>
            <tbody id="cl-table-body" class="divide-y divide-gray-50">
              <tr><td colspan="9" class="p-10 text-center text-sm text-gray-400">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Journal Entry Modal -->
      <div id="cl-modal" class="hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-bold text-gray-900">New Journal Entry</h3>
            <button onclick="window.clCloseJournal()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">
              <i class="fas fa-times text-xs"></i>
            </button>
          </div>
          <form id="cl-form" onsubmit="window.clSaveEntry(event)" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Date</label>
                <input name="entry_date" type="date" value="${i}" required
                  class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Type</label>
                <select name="entry_type" required class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-white">
                  <option value="cash_in">Cash In</option>
                  <option value="cash_out">Cash Out</option>
                  <option value="opening_balance">Opening Balance</option>
                  <option value="closing_balance">Closing Balance</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Category</label>
                <select name="category" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-white">
                  <option value="loan_disbursement">Loan Disbursement</option>
                  <option value="repayment">Repayment Received</option>
                  <option value="petty_cash">Petty Cash</option>
                  <option value="expense">Expense</option>
                  <option value="bank_deposit">Bank Deposit</option>
                  <option value="bank_withdrawal">Bank Withdrawal</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Branch</label>
                <select name="branch_id" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-white">
                  <option value="">— Select —</option>
                  ${g.map(n=>`<option value="${n.id}">${n.name}</option>`).join("")}
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Amount (R) *</label>
              <input name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00"
                class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Description *</label>
              <input name="description" type="text" required placeholder="e.g. Cash received from client John Smith"
                class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Reference</label>
              <input name="reference" type="text" placeholder="e.g. C1234-L0042, receipt #001"
                class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none">
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" onclick="window.clCloseJournal()"
                class="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 text-sm">Cancel</button>
              <button type="submit" id="cl-save-btn"
                class="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Save Entry</button>
            </div>
          </form>
        </div>
      </div>
    `,window.clSwitchBranch=n=>{p=n,y()},window.clFilterDate=n=>{i=n,x(),m()},window.clOpenJournal=()=>document.getElementById("cl-modal").classList.remove("hidden"),window.clCloseJournal=()=>document.getElementById("cl-modal").classList.add("hidden"),window.clSaveEntry=C,window.clExport=E}function m(){const a=document.getElementById("cl-summary");if(!a)return;const o=d.filter(e=>!i||e.entry_date===i),t=o.filter(e=>e.entry_type==="cash_in").reduce((e,s)=>e+Number(s.amount),0),n=o.filter(e=>e.entry_type==="cash_out").reduce((e,s)=>e+Number(s.amount),0),r=t-n,l=o.length;a.innerHTML=[{label:"Cash In Today",value:c(t),color:"#10b981",bg:"#d1fae5",icon:"arrow_downward"},{label:"Cash Out Today",value:c(n),color:"#ef4444",bg:"#fee2e2",icon:"arrow_upward"},{label:"Net Position",value:c(r),color:r>=0?"#10b981":"#ef4444",bg:r>=0?"#d1fae5":"#fee2e2",icon:"balance"},{label:"Entries Today",value:l,color:"#6b7280",bg:"#f3f4f6",icon:"receipt_long"}].map(e=>`
      <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:${e.bg}">
          <span class="material-symbols-outlined text-[20px]" style="color:${e.color}">${e.icon}</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">${e.label}</p>
          <p class="text-xl font-black mt-0.5" style="color:${e.color}">${e.value}</p>
        </div>
      </div>`).join("")}function x(){const a=document.getElementById("cl-table-body");if(!a)return;const o=i?d.filter(e=>e.entry_date===i):d;if(!o.length){a.innerHTML='<tr><td colspan="9" class="p-10 text-center text-sm text-gray-400">No entries for this date. <button onclick="window.clOpenJournal()" class="text-orange-500 font-semibold">Add the first entry.</button></td></tr>';return}let t=0;const r=[...o].reverse().map(e=>(["cash_in","opening_balance"].includes(e.entry_type)&&(t+=Number(e.amount)),["cash_out","closing_balance"].includes(e.entry_type)&&(t-=Number(e.amount)),{...e,runningBalance:t})).reverse(),l={cash_in:{label:"Cash In",color:"#10b981",bg:"#d1fae5"},cash_out:{label:"Cash Out",color:"#ef4444",bg:"#fee2e2"},opening_balance:{label:"Opening Balance",color:"#3b82f6",bg:"#dbeafe"},closing_balance:{label:"Closing Balance",color:"#8b5cf6",bg:"#ede9fe"},adjustment:{label:"Adjustment",color:"#f59e0b",bg:"#fef3c7"}};a.innerHTML=r.map(e=>{const s=l[e.entry_type]||{label:e.entry_type,color:"#6b7280",bg:"#f3f4f6"},b=["cash_in","opening_balance"].includes(e.entry_type),f=["cash_out","closing_balance"].includes(e.entry_type),h=e.runningBalance>=0?"#10b981":"#ef4444";return`
        <tr class="hover:bg-gray-50/50 transition-colors">
          <td class="px-5 py-3 text-xs font-mono text-gray-500">${e.entry_date}</td>
          <td class="px-5 py-3">
            <span class="text-[11px] font-bold px-2 py-1 rounded-lg" style="background:${s.bg};color:${s.color}">${s.label}</span>
          </td>
          <td class="px-5 py-3 text-xs text-gray-500 capitalize">${(e.category||"").replace(/_/g," ")}</td>
          <td class="px-5 py-3 text-sm text-gray-800 font-medium max-w-xs truncate">${e.description}</td>
          <td class="px-5 py-3 text-xs font-mono text-gray-400">${e.reference||"—"}</td>
          <td class="px-5 py-3 text-right text-sm font-bold text-green-600">${b?c(e.amount):"—"}</td>
          <td class="px-5 py-3 text-right text-sm font-bold text-red-500">${f?c(e.amount):"—"}</td>
          <td class="px-5 py-3 text-right text-sm font-black" style="color:${h}">${c(e.runningBalance)}</td>
          <td class="px-5 py-3 text-xs text-gray-400">${e.created_by_name||"—"}</td>
        </tr>`}).join("")}async function C(a){a.preventDefault();const o=document.getElementById("cl-save-btn"),t=a.target,n=Object.fromEntries(new FormData(t));n.amount=parseFloat(n.amount),o.textContent="Saving…",o.disabled=!0;try{await _(n),window.clCloseJournal(),t.reset(),t.elements.entry_date.value=i}catch(r){alert("Error saving entry: "+r.message)}finally{o.textContent="Save Entry",o.disabled=!1}}function E(){if(!d.length){alert("No entries to export.");return}const a=["Date","Type","Category","Description","Reference","Amount","Cash In","Cash Out","Created By","Branch"],o=d.map(e=>{const s=["cash_in","opening_balance"].includes(e.entry_type),b=["cash_out","closing_balance"].includes(e.entry_type);return[e.entry_date,e.entry_type,e.category||"",`"${(e.description||"").replace(/"/g,'""')}"`,e.reference||"",e.amount,s?e.amount:0,b?e.amount:0,e.created_by_name||"",e.branch_id||""].join(",")}),t=[a.join(","),...o].join(`
`),n=new Blob([t],{type:"text/csv;charset=utf-8;"}),r=URL.createObjectURL(n),l=document.createElement("a");l.href=r,l.download=`cash_ledger_${i||new Date().toISOString().slice(0,10)}.csv`,document.body.appendChild(l),l.click(),document.body.removeChild(l),URL.revokeObjectURL(r)}
