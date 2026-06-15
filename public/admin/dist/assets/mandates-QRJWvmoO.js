import"./supabaseClient-WTCtVqgB.js";/* empty css              *//* empty css               */import{i as U}from"./layout-DN9eRATl.js";import"https://esm.sh/@supabase/supabase-js@2";import"./theme-CeTh6-N5.js";const s={mandates:[],currentMandate:null,currentFilter:"all",config:null,logs:[]},k={success:{bg:"bg-green-100",text:"text-green-800",border:"border-green-200",icon:"fa-check-circle"},failed:{bg:"bg-red-100",text:"text-red-800",border:"border-red-200",icon:"fa-circle-xmark"},pending:{bg:"bg-yellow-100",text:"text-yellow-800",border:"border-yellow-200",icon:"fa-clock"},unknown:{bg:"bg-gray-100",text:"text-gray-800",border:"border-gray-200",icon:"fa-circle-question"}},T=e=>k[(e||"unknown").toLowerCase()]||k.unknown,I=e=>{if(!e)return"N/A";const t=new Date(e);return Number.isNaN(t.getTime())?"N/A":t.toLocaleString("en-ZA",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})},O=e=>{const t=Number(e);return Number.isFinite(t)?`R ${t.toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2})}`:"R 0.00"},o=(e="")=>`${e}`.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),y=e=>{if(!e)return"No payload recorded.";try{return JSON.stringify(e,null,2)}catch{return String(e)}};function g(e,t=null,a="info"){const n={at:new Date().toISOString(),label:e,payload:t,level:a};s.logs.unshift(n),s.logs.length>120&&(s.logs=s.logs.slice(0,120)),w()}function w(){const e=document.getElementById("dev-log-output"),t=document.getElementById("dev-log-count");if(t&&(t.textContent=`${s.logs.length} entr${s.logs.length===1?"y":"ies"}`),!!e){if(!s.logs.length){e.textContent="No logs yet. Run a connectivity probe or a SureSystems action.";return}e.textContent=s.logs.map(a=>{const n=new Date(a.at).toLocaleTimeString("en-ZA",{hour:"2-digit",minute:"2-digit",second:"2-digit"}),r=a.payload?y(a.payload):"";return`[${n}] [${a.level.toUpperCase()}] ${a.label}${r?`
${r}`:""}`}).join(`

`)}}async function c(e,t={}){g(`HTTP ${t.method||"GET"} ${e} - request`,t.body?JSON.parse(t.body):null,"info");const a=await fetch(e,t),n=await a.json().catch(()=>({}));if(!a.ok||n.success===!1){g(`HTTP ${t.method||"GET"} ${e} - failed`,{status:a.status,payload:n},"error");const r=new Error(n.error||n.message||`Request failed (${a.status})`);throw r.status=a.status,r.details=n.details||null,r.payload=n,r}return g(`HTTP ${t.method||"GET"} ${e} - success`,{status:a.status,payload:n},"success"),n}function u(e,t){if(!e)return()=>{};const a=e.innerHTML;return e.disabled=!0,e.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>${t}`,()=>{e.disabled=!1,e.innerHTML=a}}function j(){return`
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div class="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6 mb-8">
        <div>
          <a href="/admin/dashboard" class="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition mb-3 group">
            <i class="fa-solid fa-arrow-left text-[10px] group-hover:-translate-x-0.5 transition-transform"></i>
            Back to Dashboard
          </a>
          <p class="text-[11px] font-black uppercase tracking-[0.2em] text-orange-500 mb-2">SureSystems / DebiCheck</p>
          <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <i class="fa-solid fa-file-invoice text-orange-600"></i> Mandate Control Room
          </h1>
          <p class="mt-3 text-sm text-gray-500 max-w-3xl">
            Operate SureSystems DebiCheck mandates, inspect raw payloads, run safe dry-runs, and diagnose provider failures without leaving the admin desk.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button id="refresh-mandates-btn" class="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition shadow-sm font-semibold flex items-center gap-2">
            <i class="fa-solid fa-rotate-right"></i> Refresh data
          </button>
          <button id="refresh-config-btn" class="bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-black transition shadow-sm font-semibold flex items-center gap-2">
            <i class="fa-solid fa-shield-heart"></i> Refresh health
          </button>
        </div>
      </div>

      <div id="mandates-health-banner" class="mb-6"></div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8" id="mandates-summary-cards"></div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <section class="xl:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-100 bg-gray-50/70">
            <h2 class="text-lg font-bold text-gray-900">Mandate Test Lab</h2>
            <p class="text-sm text-gray-500 mt-1">Use dry-run mode to preview the exact payload without hitting SureSystems. Use live mode only when configuration is healthy.</p>
          </div>
          <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="block">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Application ID</span>
              <input id="test-application-id" type="number" min="1" placeholder="e.g. 1234" class="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none">
            </label>
            <label class="block">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Front End User</span>
              <input id="test-front-end-user" type="text" placeholder="ops@company.co.za" class="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none">
            </label>
            <label class="block">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Collection Date</span>
              <input id="test-collection-date" type="date" class="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none">
            </label>
            <label class="block">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Contract Reference</span>
              <input id="test-contract-reference" type="text" placeholder="Optional override" class="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none">
            </label>
            <div class="md:col-span-2 flex flex-wrap gap-3 pt-2">
              <button id="btn-preview-mandate" class="px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-sm">
                <i class="fa-solid fa-flask-vial mr-2"></i> Dry-run payload
              </button>
              <button id="btn-direct-provider-load" class="px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-sm">
                <i class="fa-solid fa-plug-circle-bolt mr-2"></i> Hit DebiCheck endpoint
              </button>
              <button id="btn-live-activate" class="px-4 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-all shadow-sm">
                <i class="fa-solid fa-bolt mr-2"></i> Load live mandate
              </button>
            </div>
            <div class="md:col-span-2 rounded-2xl border border-gray-200 bg-gray-950 p-4">
              <div class="flex items-center justify-between gap-3 mb-3">
                <h3 class="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Preview / Diagnostics</h3>
                <span id="test-lab-badge" class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-800 text-gray-200">Idle</span>
              </div>
              <pre id="test-lab-output" class="text-xs text-green-400 font-mono whitespace-pre-wrap break-words min-h-[240px]"></pre>
              <div id="signature-display" class="hidden mt-4 border-t border-gray-800 pt-4">
                <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">TT3 Cardholder Signature</p>
                <img id="signature-img" src="" alt="Signature" class="max-w-full bg-white rounded-lg border border-gray-700 p-2" style="image-rendering:pixelated;" />
              </div>
            </div>
          </div>
        </section>

        <section class="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-100 bg-gray-50/70">
            <h2 class="text-lg font-bold text-gray-900">Provider Actions</h2>
            <p class="text-sm text-gray-500 mt-1">Use the contract reference from a selected record or type one manually.</p>
          </div>
          <div class="p-6 space-y-4">
            <label class="block">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Application ID</span>
              <input id="action-application-id" type="number" min="1" placeholder="Used for DB write-back" class="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none">
            </label>
            <label class="block">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Contract Reference</span>
              <input id="action-contract-reference" type="text" placeholder="Paste contract reference" class="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none">
            </label>
            <label class="block">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Front End User</span>
              <input id="action-front-end-user" type="text" placeholder="webuser" class="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none">
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button id="btn-final-fate" class="px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-sm">
                <i class="fa-solid fa-satellite-dish mr-2"></i> Final fate
              </button>
              <button id="btn-enquiry" class="px-4 py-3 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700 transition-all shadow-sm">
                <i class="fa-solid fa-magnifying-glass mr-2"></i> Mandate enquiry
              </button>
              <button id="btn-cancel-mandate" class="px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-sm">
                <i class="fa-solid fa-ban mr-2"></i> Cancel mandate
              </button>
              <a id="btn-open-application" href="#" class="px-4 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-all shadow-sm text-center">
                <i class="fa-solid fa-arrow-up-right-from-square mr-2"></i> Open application
              </a>
            </div>
            <div class="rounded-2xl border border-dashed border-orange-200 bg-orange-50 p-4">
              <h3 class="text-sm font-bold text-orange-900 mb-2">Operational Notes</h3>
              <ul class="space-y-2 text-sm text-orange-800">
                <li>DebiCheck requires the payer’s bank to authenticate the mandate; it is not the same as a plain EFT debit order.</li>
                <li>SureSystems advertises TT1 real-time, TT1 delayed, TT2 delayed batch, and TT3 POS flows.</li>
                <li>If you see HTTP 503 here, it usually means the provider config is missing or unavailable before any bank action begins.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <section class="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div class="px-6 py-5 border-b border-gray-100 bg-gray-50/70 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 class="text-lg font-bold text-gray-900">Dev Console</h2>
            <p class="text-sm text-gray-500 mt-1">Run host connectivity checks and inspect raw logs from this page without opening browser dev tools.</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button id="btn-connectivity-probe" class="px-4 py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-all shadow-sm">
              <i class="fa-solid fa-network-wired mr-2"></i> Test connectivity
            </button>
            <button id="btn-clear-dev-logs" class="px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm">
              <i class="fa-solid fa-broom mr-2"></i> Clear logs
            </button>
          </div>
        </div>
        <div class="grid grid-cols-1 xl:grid-cols-[320px,1fr] gap-0">
          <div class="border-r border-gray-100 p-6 bg-gray-50/40">
            <div id="connectivity-summary" class="space-y-3 text-sm text-gray-600">
              <div class="rounded-2xl border border-dashed border-gray-200 bg-white p-4">
                Connectivity checks have not run yet.
              </div>
            </div>
          </div>
          <div class="p-6 bg-gray-950">
            <div class="flex items-center justify-between gap-3 mb-3">
              <h3 class="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Live Logs</h3>
              <span id="dev-log-count" class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-800 text-gray-200">0 entries</span>
            </div>
            <pre id="dev-log-output" class="text-xs text-emerald-300 font-mono whitespace-pre-wrap break-words min-h-[240px] max-h-[420px] overflow-y-auto"></pre>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 2xl:grid-cols-[1.8fr,1fr] gap-6">
        <section class="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div>
              <h2 class="text-lg font-bold text-gray-900">Mandate Audit Trail</h2>
              <p class="text-sm text-gray-500 mt-1">Recent SureSystems mandate activity stored in your audit table.</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-3">
              <div class="relative w-full sm:w-80">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fa-solid fa-search text-gray-400"></i>
                </div>
                <input id="mandate-search" type="text" placeholder="Search by name, contract ref, or app ID..." class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-gray-50">
              </div>
              <div class="flex gap-2 overflow-x-auto">
                <button class="filter-btn active px-4 py-2 rounded-full text-xs font-bold bg-gray-900 text-white" data-filter="all">All</button>
                <button class="filter-btn px-4 py-2 rounded-full text-xs font-bold bg-gray-100 text-gray-600" data-filter="pending">Pending</button>
                <button class="filter-btn px-4 py-2 rounded-full text-xs font-bold bg-gray-100 text-gray-600" data-filter="success">Success</button>
                <button class="filter-btn px-4 py-2 rounded-full text-xs font-bold bg-gray-100 text-gray-600" data-filter="failed">Failed</button>
              </div>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Applicant / App</th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Lifecycle</th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contract / Amount</th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Update</th>
                  <th class="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
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
        </section>

        <section class="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-100 bg-gray-50/70">
            <h2 class="text-lg font-bold text-gray-900">Standards Cheat Sheet</h2>
            <p class="text-sm text-gray-500 mt-1">Practical reminders for operators handling DebiCheck mandates.</p>
          </div>
          <div class="p-6 space-y-5 text-sm text-gray-700">
            <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h3 class="font-bold text-gray-900 mb-2">Mandate Flow</h3>
              <p>Customer agrees to debit terms, their bank authenticates the DebiCheck mandate, and collections should then stay within the agreed parameters.</p>
            </div>
            <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h3 class="font-bold text-gray-900 mb-2">SureSystems Modes</h3>
              <p>TT1 real-time and delayed, TT2 delayed batch, and TT3 POS are the provider-side transaction patterns publicly described by SureSystems.</p>
            </div>
            <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h3 class="font-bold text-gray-900 mb-2">What 503 Usually Means</h3>
              <p>A 503 here generally points to missing provider configuration, certificate setup, or an upstream SureSystems outage rather than a debtor-bank rejection.</p>
            </div>
            <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h3 class="font-bold text-gray-900 mb-2">Good Operational Practice</h3>
              <p>Dry-run the payload before go-live, keep contract references visible, and use final fate or enquiry before retrying duplicate loads.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  `}function H(){const e={total:s.mandates.length,success:0,failed:0,pending:0};return s.mandates.forEach(t=>{const a=(t.status||"unknown").toLowerCase();a==="success"?e.success+=1:a==="failed"?e.failed+=1:e.pending+=1}),e}function _(){const e=document.getElementById("mandates-health-banner");if(!e)return;const t=s.config;if(!t){e.innerHTML=`
      <div class="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500">
        Configuration status has not loaded yet.
      </div>
    `;return}const a=Array.isArray(t.missing)?t.missing:[],n=!!t.configured;e.innerHTML=`
    <div class="rounded-2xl border ${n?"border-green-200 bg-green-50":"border-red-200 bg-red-50"} px-5 py-4">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] ${n?"text-green-700":"text-red-700"}">Provider Health</p>
          <h2 class="text-lg font-bold ${n?"text-green-900":"text-red-900"} mt-1">
            ${n?"SureSystems configuration looks ready":"SureSystems is not fully configured"}
          </h2>
          <p class="text-sm ${n?"text-green-800":"text-red-800"} mt-2">
            ${n?`Merchant GID ${o(t.merchantGid)} / Remote GID ${o(t.remoteGid)} ${t.useMtls?"with mTLS enabled":"without mTLS"}.`:`Missing setup: ${o(a.join(", ")||"unknown configuration values")}. Live actions will likely return 503 until this is fixed.`}
          </p>
        </div>
        <div class="flex flex-wrap gap-2 text-xs">
          <span class="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 font-bold">Header Prefix: ${o(t.headerPrefix||"N/A")}</span>
          <span class="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 font-bold">mTLS: ${t.useMtls?"On":"Off"}</span>
          <span class="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 font-bold">Configured: ${n?"Yes":"No"}</span>
        </div>
      </div>
    </div>
  `}function R(){const e=document.getElementById("mandates-summary-cards");if(!e)return;const t=H(),a=[{label:"Tracked Mandates",value:t.total,icon:"fa-database",tone:"bg-white border-gray-200 text-gray-900"},{label:"Successful Loads",value:t.success,icon:"fa-check-double",tone:"bg-green-50 border-green-200 text-green-900"},{label:"Pending / Unknown",value:t.pending,icon:"fa-hourglass-half",tone:"bg-yellow-50 border-yellow-200 text-yellow-900"},{label:"Failed Attempts",value:t.failed,icon:"fa-bug",tone:"bg-red-50 border-red-200 text-red-900"}];e.innerHTML=a.map(n=>`
    <div class="rounded-2xl border ${n.tone} p-5 shadow-sm">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] opacity-70">${n.label}</p>
          <div class="text-3xl font-extrabold mt-2">${n.value}</div>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-white/80 border border-white/60 flex items-center justify-center">
          <i class="fa-solid ${n.icon} text-lg"></i>
        </div>
      </div>
    </div>
  `).join("")}function x(e=null){const t=document.getElementById("connectivity-summary");if(!t)return;if(!e){t.innerHTML=`
      <div class="rounded-2xl border border-dashed border-gray-200 bg-white p-4">
        Connectivity checks have not run yet.
      </div>
    `;return}const a=!!e.reachable;t.innerHTML=`
    <div class="rounded-2xl border ${a?"border-green-200 bg-green-50":"border-red-200 bg-red-50"} p-4">
      <p class="text-[10px] font-black uppercase tracking-[0.18em] ${a?"text-green-700":"text-red-700"}">Connectivity</p>
      <h3 class="text-base font-bold ${a?"text-green-900":"text-red-900"} mt-2">
        ${a?"Provider host reachable":"Connectivity problem detected"}
      </h3>
      <p class="text-sm mt-2 ${a?"text-green-800":"text-red-800"}">${o(e.error||e.statusText||"Probe completed.")}</p>
    </div>
    <div class="rounded-2xl border border-gray-200 bg-white p-4">
      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2">Base URL</p>
      <p class="text-sm font-mono text-gray-800 break-all">${o(e.baseUrl||"N/A")}</p>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-2xl border border-gray-200 bg-white p-4">
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2">HTTP Status</p>
        <p class="text-sm font-bold text-gray-900">${o(e.status??"N/A")}</p>
      </div>
      <div class="rounded-2xl border border-gray-200 bg-white p-4">
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2">mTLS</p>
        <p class="text-sm font-bold text-gray-900">${e.useMtls?"Enabled":"Disabled"}</p>
      </div>
    </div>
    <div class="rounded-2xl border border-gray-200 bg-white p-4">
      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2">Missing Config</p>
      <p class="text-sm text-gray-700">${o((e.missing||[]).join(", ")||"None")}</p>
    </div>
  `}function F(){const e=(document.getElementById("mandate-search")?.value||"").trim().toLowerCase();return s.mandates.filter(t=>{const a=(t.status||"unknown").toLowerCase(),n=s.currentFilter==="all"||a===s.currentFilter,r=[t.profiles?.full_name,t.profiles?.email,t.contract_reference,t.application_id,t.message].filter(Boolean).join(" ").toLowerCase(),i=!e||r.includes(e);return n&&i})}function h(){const e=document.getElementById("mandates-table-body"),t=document.getElementById("empty-state");if(!e||!t)return;const a=F();if(!a.length){e.innerHTML="",t.classList.remove("hidden");return}t.classList.add("hidden"),e.innerHTML=a.map(n=>{const r=T(n.status),i=n.profiles?.full_name||n.user_id||"Unknown User",l=n.loan_applications?.amount?O(n.loan_applications.amount):"Unknown Amount",f=n.contract_reference||"No contract reference",m=n.message||"No message recorded";return`
      <tr class="hover:bg-gray-50 transition-colors group">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-bold text-gray-600 shadow-inner">
              ${o(i.charAt(0).toUpperCase())}
            </div>
            <div>
              <div class="font-bold text-gray-900 text-sm">${o(i)}</div>
              <div class="text-xs text-gray-500 font-mono mt-0.5">App ID: ${o(n.application_id)}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${r.bg} ${r.text} border ${r.border}">
            <i class="fa-solid ${r.icon}"></i> ${o((n.status||"unknown").toUpperCase())}
          </span>
          <div class="text-xs text-gray-500 mt-2 max-w-xs truncate" title="${o(m)}">${o(m)}</div>
        </td>
        <td class="px-6 py-4">
          <div class="text-sm font-bold text-gray-900 font-mono">${o(f)}</div>
          <div class="text-xs text-gray-500 mt-0.5">${l}</div>
        </td>
        <td class="px-6 py-4">
          <div class="text-sm text-gray-900 font-medium">${I(n.updated_at)}</div>
          <div class="text-xs text-gray-500 mt-0.5">Created: ${I(n.created_at)}</div>
        </td>
        <td class="px-6 py-4 text-right">
          <button class="view-mandate-btn text-gray-400 hover:text-orange-600 transition-colors bg-white hover:bg-orange-50 w-9 h-9 rounded-xl border border-transparent hover:border-orange-200" data-id="${o(n.id)}">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </td>
      </tr>
    `}).join(""),document.querySelectorAll(".view-mandate-btn").forEach(n=>{n.addEventListener("click",r=>{r.stopPropagation(),L(n.dataset.id)})})}function J(e){const t=document.getElementById("action-application-id"),a=document.getElementById("action-contract-reference"),n=document.getElementById("action-front-end-user"),r=document.getElementById("btn-open-application");!t||!a||!n||!r||(t.value=e?.application_id||"",a.value=e?.contract_reference||"",n.value=e?.profiles?.email||"webuser",e?.application_id?(r.href=`/admin/application-detail?id=${e.application_id}`,r.classList.remove("pointer-events-none","opacity-50")):(r.href="#",r.classList.add("pointer-events-none","opacity-50")))}function L(e){const t=s.mandates.find(A=>String(A.id)===String(e));if(!t)return;s.currentMandate=t,J(t);const a=document.getElementById("payload-modal"),n=a?.firstElementChild;if(!a||!n)return;const r=T(t.status),i=document.getElementById("modal-status-banner"),l=document.getElementById("modal-status-icon"),f=document.getElementById("modal-status-text"),m=document.getElementById("modal-message-text"),M=document.getElementById("modal-request-payload"),E=document.getElementById("modal-response-payload"),P=document.getElementById("btn-retry-mandate"),N=document.getElementById("btn-check-fate"),q=document.getElementById("btn-run-enquiry"),D=document.getElementById("btn-run-cancel");i.className=`p-4 rounded-xl font-semibold flex items-start gap-3 border ${r.bg} ${r.text} ${r.border}`,l.className=`fa-solid ${r.icon} text-xl mt-0.5`,f.textContent=`Status: ${(t.status||"unknown").toUpperCase()}`,m.textContent=t.message||"No additional message provided.",M.textContent=y(t.request_payload),E.textContent=y(t.error_payload||t.response_payload),E.className=`text-xs font-mono whitespace-pre-wrap break-words ${t.status==="failed"?"text-red-400":"text-blue-400"}`,P?.classList.toggle("hidden",t.status==="success"),N?.classList.toggle("hidden",!t.contract_reference),q?.classList.toggle("hidden",!t.contract_reference),D?.classList.toggle("hidden",!t.contract_reference),a.classList.remove("hidden"),a.classList.add("flex"),setTimeout(()=>n.classList.remove("scale-95"),10)}function v(){const e=document.getElementById("payload-modal"),t=e?.firstElementChild;!e||!t||(t.classList.add("scale-95"),setTimeout(()=>{e.classList.add("hidden"),e.classList.remove("flex"),s.currentMandate=null},200))}async function B(){s.config=await c("/api/suresystems/config"),g("SureSystems config loaded",s.config,s.config?.configured?"success":"error"),_()}async function p(){const e=document.getElementById("mandates-table-body");e&&(e.innerHTML='<tr><td colspan="5" class="px-6 py-12 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2 text-orange-500"></i><p>Loading mandates...</p></td></tr>');const t=await c("/api/suresystems/mandates/history");s.mandates=t.data||[],g("Mandate history loaded",{count:s.mandates.length},"info"),R(),h()}async function G(){try{await Promise.all([B(),p()])}catch(e){window.showToast?.(e.message||"Unable to refresh mandates","error")}}async function z(){const e=document.getElementById("btn-connectivity-probe"),t=u(e,"Probing...");try{const a=await c("/api/suresystems/debug/connectivity");x(a),d("Connectivity probe complete",a,a.reachable?"success":"error"),window.showToast?.(a.reachable?"SureSystems host reachable":"SureSystems connectivity issue detected",a.reachable?"success":"error")}catch(a){const n={error:a.message,details:a.details||null};x({reachable:!1,error:a.message,status:a.status||null,baseUrl:s.config?.baseUrl||"",useMtls:s.config?.useMtls||!1,missing:s.config?.missing||[]}),d("Connectivity probe failed",n,"error"),window.showToast?.(a.message||"SureSystems connectivity probe failed","error")}finally{t()}}function C(){const e=document.getElementById("test-front-end-user")?.value?.trim()||"",t=document.getElementById("test-contract-reference")?.value?.trim()||"",a=document.getElementById("test-collection-date")?.value||"",n=a?a.replace(/-/g,""):"";return{...e?{frontEndUserName:e}:{},...t?{contractReference:t}:{},...n?{collectionDate:n}:{}}}function d(e,t,a="idle"){const n=document.getElementById("test-lab-output"),r=document.getElementById("test-lab-badge"),i=document.getElementById("signature-display");if(i&&i.classList.add("hidden"),n&&(n.textContent=typeof t=="string"?t:y(t)),r){const l={idle:"bg-gray-800 text-gray-200",success:"bg-green-900 text-green-100",error:"bg-red-900 text-red-100",info:"bg-blue-900 text-blue-100"};r.className=`px-2.5 py-1 rounded-full text-[10px] font-bold ${l[a]||l.idle}`,r.textContent=e}}function Z(e){const t=e?.providerResponse?.signatureStorage||e?.signatureStorage,a=document.getElementById("signature-display"),n=document.getElementById("signature-img");!t||!a||!n||(n.src=`data:image/bmp;base64,${t}`,a.classList.remove("hidden"))}async function W(){const e=document.getElementById("btn-preview-mandate"),t=u(e,"Preparing...");try{const a=Number(document.getElementById("test-application-id")?.value||0)||null,n=await c("/api/suresystems/mandates/test-payload",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({applicationId:a,overrides:C()})});d(n.warnings?.length?"Preview with warnings":"Preview ready",n,n.warnings?.length?"info":"success"),a&&(document.getElementById("action-application-id").value=a)}catch(a){d("Preview failed",{error:a.message,details:a.details||null},"error"),window.showToast?.(a.message||"Unable to build test payload","error")}finally{t()}}async function $(){const e=document.getElementById("btn-live-activate"),t=u(e,"Loading...");try{const a=Number(document.getElementById("test-application-id")?.value||0);if(!a)throw new Error("Application ID is required for live mandate loading.");const n=await c("/api/suresystems/activate-application",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({applicationId:a})});d("Live load complete",n,"success"),window.showToast?.(n.message||"SureSystems mandate loaded","success"),await p()}catch(a){d(a.status===503?"Provider unavailable":"Live load failed",{error:a.message,details:a.details||null},"error"),window.showToast?.(a.message||"SureSystems mandate load failed","error")}finally{t()}}async function Y(){const e=document.getElementById("btn-direct-provider-load"),t=u(e,"Sending...");try{const a=Number(document.getElementById("test-application-id")?.value||0);if(!a)throw new Error("Application ID is required before hitting the DebiCheck endpoint.");const n=await c("/api/suresystems/mandates/load-direct",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({applicationId:a,overrides:C()})});d("Direct provider load complete",n,"success"),window.showToast?.(n.message||"SureSystems direct load completed","success"),document.getElementById("action-application-id").value=a,n.contractReference&&(document.getElementById("action-contract-reference").value=n.contractReference),n.profile?.email&&(document.getElementById("action-front-end-user").value=n.profile.email),await p()}catch(a){d(a.status===503?"Provider unavailable":"Direct provider load failed",{error:a.message,details:a.details||null},"error"),window.showToast?.(a.message||"SureSystems direct load failed","error")}finally{t()}}async function b(e){const t=e==="enquiry"?document.getElementById("btn-enquiry"):document.getElementById("btn-final-fate"),a=u(t,e==="enquiry"?"Enquiring...":"Checking...");try{const n=Number(document.getElementById("action-application-id")?.value||0)||null,r=document.getElementById("action-contract-reference")?.value?.trim(),i=document.getElementById("action-front-end-user")?.value?.trim()||"webuser";if(!r)throw new Error("Contract reference is required.");const l=await c("/api/suresystems/mandates/check-status",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({applicationId:n,contractReference:r,frontEndUserName:i,mode:e})});d(e==="enquiry"?"Enquiry complete":"Final fate complete",l,"success"),e==="finalfate"&&Z(l),window.showToast?.(l.message||"Status check complete","success"),await p(),s.currentMandate?.id&&L(s.currentMandate.id)}catch(n){d(e==="enquiry"?"Enquiry failed":"Final fate failed",{error:n.message,details:n.details||null},"error"),window.showToast?.(n.message||"SureSystems status check failed","error")}finally{a()}}async function S(){const e=document.getElementById("btn-cancel-mandate"),t=u(e,"Cancelling...");try{const a=Number(document.getElementById("action-application-id")?.value||0)||null,n=document.getElementById("action-contract-reference")?.value?.trim(),r=document.getElementById("action-front-end-user")?.value?.trim()||"webuser";if(!n)throw new Error("Contract reference is required.");const i=await c("/api/suresystems/mandates/cancel-record",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({applicationId:a,contractReference:n,frontEndUserName:r})});d("Cancel complete",i,"success"),window.showToast?.(i.message||"Mandate cancel submitted","success"),await p(),v()}catch(a){d("Cancel failed",{error:a.message,details:a.details||null},"error"),window.showToast?.(a.message||"Cancel mandate failed","error")}finally{t()}}async function K(){if(!s.currentMandate?.application_id){window.showToast?.("No application selected for retry","error");return}document.getElementById("test-application-id").value=s.currentMandate.application_id,await $()}function Q(){document.getElementById("mandate-search")?.addEventListener("input",h),document.querySelectorAll(".filter-btn").forEach(e=>{e.addEventListener("click",()=>{s.currentFilter=e.dataset.filter||"all",document.querySelectorAll(".filter-btn").forEach(t=>{t.classList.remove("bg-gray-900","text-white"),t.classList.add("bg-gray-100","text-gray-600")}),e.classList.add("bg-gray-900","text-white"),e.classList.remove("bg-gray-100","text-gray-600"),h()})})}function V(){const e=document.querySelector("#payload-modal .mt-6.pt-4");!e||document.getElementById("btn-run-enquiry")||e.insertAdjacentHTML("afterbegin",`
    <button id="btn-run-cancel" class="px-5 py-2 bg-red-50 text-red-700 font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-colors hidden">
      <i class="fa-solid fa-ban mr-2"></i> Cancel
    </button>
    <button id="btn-run-enquiry" class="px-5 py-2 bg-sky-50 text-sky-700 font-bold rounded-lg border border-sky-200 hover:bg-sky-100 transition-colors hidden">
      <i class="fa-solid fa-magnifying-glass mr-2"></i> Enquiry
    </button>
  `)}function X(){document.getElementById("refresh-mandates-btn")?.addEventListener("click",p),document.getElementById("refresh-config-btn")?.addEventListener("click",B),document.getElementById("btn-connectivity-probe")?.addEventListener("click",z),document.getElementById("btn-clear-dev-logs")?.addEventListener("click",()=>{s.logs=[],w()}),document.getElementById("btn-preview-mandate")?.addEventListener("click",W),document.getElementById("btn-direct-provider-load")?.addEventListener("click",Y),document.getElementById("btn-live-activate")?.addEventListener("click",$),document.getElementById("btn-final-fate")?.addEventListener("click",()=>b("finalfate")),document.getElementById("btn-enquiry")?.addEventListener("click",()=>b("enquiry")),document.getElementById("btn-cancel-mandate")?.addEventListener("click",S),document.getElementById("btn-retry-mandate")?.addEventListener("click",K),document.getElementById("btn-check-fate")?.addEventListener("click",()=>b("finalfate")),document.getElementById("btn-run-enquiry")?.addEventListener("click",()=>b("enquiry")),document.getElementById("btn-run-cancel")?.addEventListener("click",S),document.getElementById("close-modal-btn")?.addEventListener("click",v),document.getElementById("payload-modal")?.addEventListener("click",e=>{e.target?.id==="payload-modal"&&v()}),Q()}document.addEventListener("DOMContentLoaded",async()=>{const e=document.getElementById("app-shell");e&&(await U(),e.innerHTML=j(),V(),X(),x(),w(),g("Mandate page initialized",{page:"admin/mandates.html"},"info"),d("Idle","Use the test lab to preview mandate payloads or inspect provider responses.","idle"),await G())});
