import{supabase as b}from"./supabaseClient-WTCtVqgB.js";/* empty css              *//* empty css               */import{i as X}from"./layout-DLkpXMPI.js";import{b as g,a as f}from"./utils-CZwHw4kl.js";import{t as $,v as ee,w as te,x as J,y as Y,z as ne}from"./dataService-489HhSyD.js";import"https://esm.sh/@supabase/supabase-js@2";import"./theme-CeTh6-N5.js";const R="/api/docuseal",ae=void 0;function G(){return!!ae}async function se(t,n){try{if(!G())throw new Error("DocuSeal integration is disabled");const e=await fetch(`${R}/send-contract`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({applicationData:t,profileData:n})});if(!e.ok){const r=await e.json().catch(()=>({}));throw console.error("DocuSeal proxy error:",e.status,r),new Error(r.error||r.message||`Failed to send contract: ${e.status}`)}const a=await e.json();if(!a||!Array.isArray(a)||a.length===0)throw new Error("Invalid response from DocuSeal API");const s=a[0];return await de(s,t.id),{submission_id:s.submission_id,submitter_id:s.id,slug:s.slug,status:s.status,embed_src:s.embed_src,email:s.email}}catch(e){throw console.error("DocuSeal send contract error:",e),e}}async function re(t){try{const n=await fetch(`${R}/submissions/${t}`);if(!n.ok){const e=await n.json().catch(()=>({}));throw new Error(e.error||e.message||`Failed to fetch submission status: ${n.status}`)}return await n.json()}catch(n){throw console.error("DocuSeal get status error:",n),n}}async function oe(t){try{const n=await fetch(`${R}/submitters/${t}`);if(!n.ok){const e=await n.json().catch(()=>({}));throw new Error(e.error||e.message||`Failed to fetch submitter details: ${n.status}`)}return await n.json()}catch(n){throw console.error("DocuSeal get submitter error:",n),n}}async function ie(t){try{const{data:n,error:e}=await b.from("docuseal_submissions").select("*").eq("application_id",t).order("created_at",{ascending:!1});if(e)throw e;return n||[]}catch(n){return console.error("Error fetching submissions:",n),[]}}async function de(t,n){try{const{error:e}=await b.from("docuseal_submissions").insert({application_id:n,submission_id:t.submission_id,submitter_id:t.id,slug:t.slug,status:t.status||"pending",email:t.email,name:t.name,role:t.role,embed_src:t.embed_src,sent_at:t.sent_at,opened_at:t.opened_at,completed_at:t.completed_at,metadata:t.metadata||{},created_at:new Date().toISOString()});if(e)throw e}catch(e){throw console.error("Error saving submission to database:",e),e}}async function le(t,n,e={}){try{const{error:a}=await b.from("docuseal_submissions").update({status:n,...e,updated_at:new Date().toISOString()}).eq("submission_id",t);if(a)throw a}catch(a){throw console.error("Error updating submission status:",a),a}}async function ce(t,n,e={}){try{const{error:a}=await b.from("docuseal_submissions").update({status:n,...e,updated_at:new Date().toISOString()}).eq("submitter_id",t);if(a)throw a}catch(a){throw console.error("Error updating submitter status:",a),a}}function H(t){return`https://docuseal.co/s/${t}`}async function ue(t,n={}){try{const e=await fetch(`${R}/submitters/${t}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({send_email:!0,...n})});if(!e.ok){const s=await e.json().catch(()=>({}));throw new Error(s.error||s.message||`Failed to resend contract: ${e.status}`)}const a=await e.json();return await ce(t,a.status,{sent_at:a.sent_at}),a}catch(e){throw console.error("DocuSeal resend error:",e),e}}async function pe(t){try{const n=await fetch(`${R}/submissions/${t}`,{method:"DELETE"});if(!n.ok){const a=await n.json().catch(()=>({}));throw new Error(a.error||a.message||`Failed to archive submission: ${n.status}`)}const e=await n.json();return await le(t,"archived",{archived_at:e.archived_at}),e}catch(n){throw console.error("DocuSeal archive error:",n),n}}async function me(t,n=null){try{const e=await re(t);if(!e.submitters||e.submitters.length===0)throw new Error("No submitters found for this submission");if(n){const a=e.submitters.find(s=>s.email===n);if(!a)throw new Error(`No submitter found with email: ${n}`);return a.id}return e.submitters[0].id}catch(e){throw console.error("Error getting submitter ID:",e),e}}let d=null,F=null,V=!1,I=null,A=null,B=!1,M=!1;const be=5e3,fe=[{value:"STARTED",label:"Step 1: New Application"},{value:"BANK_LINKING",label:"Bank Analysis"},{value:"AFFORD_OK",label:"Step 3: Affordability OK"},{value:"AFFORD_REFER",label:"Affordability Refer"},{value:"OFFERED",label:"Step 4: Contract Sent"},{value:"OFFER_ACCEPTED",label:"Contract Signed"},{value:"READY_TO_DISBURSE",label:"Step 6: Approved — Queue Disburse"},{value:"DECLINED",label:"Declined"}],xe=`
<div id="application-detail-content" class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div id="loading-state" class="text-center p-20">
    <span class="material-symbols-outlined text-4xl animate-spin" style="color:var(--color-primary)">progress_activity</span>
    <p class="mt-4 text-outline font-medium animate-pulse">Loading Complete Application Data...</p>
  </div>

  <div id="page-header" class="mb-8 hidden animate-fade-in">
    <nav class="flex items-center gap-2 text-sm text-outline mb-4">
       <a href="/admin/applications" class="hover:text-on-surface transition-colors">Applications</a>
       <span class="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
       <span id="breadcrumb-name" class="font-medium text-on-surface">Applicant</span>
    </nav>
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
       <div>
         <h1 id="applicant-name-header" class="text-3xl font-headline font-bold text-on-surface tracking-tight">Loading...</h1>
         <div class="flex items-center gap-3 mt-2">
            <p class="text-sm text-outline bg-surface-container px-2 py-1 rounded-xl font-mono">ID: <span id="header-id-val">...</span></p>
            <span id="header-date" class="text-sm text-outline"></span>
         </div>
       </div>
       <span id="header-status-badge" class="px-5 py-2 text-sm font-bold rounded-full bg-gray-200 text-gray-700 shadow-sm uppercase tracking-wide">Status</span>
    </div>
  </div>

  <div id="content-grid" class="grid grid-cols-1 lg:grid-cols-12 gap-8 hidden animate-slide-up">
    
    <div class="lg:col-span-8 flex flex-col gap-6">
      
       <div class="glass-card rounded-2xl overflow-hidden">
         <div class="flex overflow-x-auto scrollbar-hide border-b border-outline-variant/10">
            <button class="tab-btn active flex-1 py-4 px-4 text-sm font-bold text-center border-b-2 transition-all whitespace-nowrap" style="border-color:var(--color-primary);color:var(--color-primary)" data-tab="personal">Personal</button>
            <button class="tab-btn flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 border-transparent text-outline hover:text-on-surface hover:bg-surface-container-low transition-all whitespace-nowrap" data-tab="financial">Financial & Credit</button>
            <button class="tab-btn flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 border-transparent text-outline hover:text-on-surface hover:bg-surface-container-low transition-all whitespace-nowrap" data-tab="documents">Documents</button>
            <button class="tab-btn flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 border-transparent text-outline hover:text-on-surface hover:bg-surface-container-low transition-all whitespace-nowrap" data-tab="loan">Loan & History</button>
            <button class="tab-btn flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 border-transparent text-outline hover:text-on-surface hover:bg-surface-container-low transition-all whitespace-nowrap" data-tab="audit">Audit Trail</button>
         </div>
       </div>

       <div id="tab-contents" class="relative min-h-[400px]">
       
          <div id="personal-tab" class="tab-pane glass-card rounded-2xl p-8">
             <h3 class="text-lg font-headline font-bold text-on-surface mb-6 flex items-center gap-2">
                <span class="material-symbols-outlined text-outline">account_circle</span> Personal Information
             </h3>
             
             <div class="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-outline-variant/10">
                <div class="shrink-0 mx-auto md:mx-0">
                   <div class="w-32 h-32 bg-surface-container rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                      <img id="profile-image" src="" alt="Profile" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=User&background=random'">
                   </div>
                </div>
                <div class="flex-grow grid grid-cols-1 gap-y-5">
                   <div class="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                      <span class="text-sm font-medium text-outline">Full Name</span>
                      <div class="sm:col-span-2">
                         <div id="detail-fullname" class="w-full p-3 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface text-sm font-semibold"></div>
                      </div>
                   </div>
                   <div class="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                      <span class="text-sm font-medium text-outline">Email Address</span>
                      <div class="sm:col-span-2">
                         <div id="detail-email" class="w-full p-3 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface text-sm"></div>
                      </div>
                   </div>
                   <div class="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                      <span class="text-sm font-medium text-outline">Mobile Number</span>
                      <div class="sm:col-span-2">
                         <div id="detail-mobile" class="w-full p-3 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface text-sm"></div>
                      </div>
                   </div>
                   <div class="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                      <span class="text-sm font-medium text-outline">ID Number</span>
                      <div class="sm:col-span-2">
                         <div id="detail-identity-number" class="w-full p-3 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface text-sm font-mono"></div>
                      </div>
                   </div>
                   <div class="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                      <span class="text-sm font-medium text-outline flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px] text-orange-500">people</span>
                        Next of Kin
                      </span>
                      <div class="sm:col-span-2">
                         <div id="detail-nok" class="w-full p-3 bg-orange-50 border border-orange-100 rounded-xl text-on-surface text-sm font-medium"></div>
                      </div>
                   </div>
                </div>
             </div>
             <!-- Employer Verification -->
             <div class="mt-6 p-5 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest">
               <div class="flex items-center justify-between mb-4">
                 <h4 class="text-md font-headline font-bold text-on-surface">Employer Verification</h4>
                 <span id="employer-verified-badge" class="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">Unverified</span>
               </div>
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                 <div>
                   <label class="text-[10px] font-semibold text-outline uppercase tracking-wide">Employer Name</label>
                   <input id="employer-name-input" type="text" placeholder="Company name..."
                     class="w-full mt-1 border border-outline-variant/30 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:outline-none bg-white"
                     style="--tw-ring-color:var(--color-primary)">
                 </div>
                 <div>
                   <label class="text-[10px] font-semibold text-outline uppercase tracking-wide">Employer Phone</label>
                   <input id="employer-phone-input" type="tel" placeholder="010 000 0000"
                     class="w-full mt-1 border border-outline-variant/30 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:outline-none bg-white"
                     style="--tw-ring-color:var(--color-primary)">
                 </div>
                 <div class="sm:col-span-2">
                   <label class="text-[10px] font-semibold text-outline uppercase tracking-wide">Employer Address</label>
                   <input id="employer-address-input" type="text" placeholder="Work address..."
                     class="w-full mt-1 border border-outline-variant/30 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:outline-none bg-white"
                     style="--tw-ring-color:var(--color-primary)">
                 </div>
               </div>
               <div class="flex gap-3">
                 <button id="btn-save-employer" onclick="window.saveEmployerDetails()"
                   class="flex-1 py-2 rounded-xl text-white text-sm font-bold transition-colors"
                   style="background:var(--color-primary)">Save Details</button>
                 <button id="btn-verify-employer" onclick="window.toggleEmployerVerified()"
                   class="flex-1 py-2 rounded-xl border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 text-sm font-bold transition-colors">
                   Mark Verified
                 </button>
               </div>
               <p id="employer-verified-note" class="text-[10px] text-outline mt-2 italic hidden"></p>
             </div>

             <!-- Client Credit Cap -->
             <div class="mt-4 p-5 rounded-2xl border border-orange-100 bg-orange-50/30">
               <div class="flex items-center gap-3 mb-3">
                 <span class="material-symbols-outlined text-[18px]" style="color:var(--color-primary)">lock</span>
                 <h4 class="text-md font-headline font-bold text-on-surface">Individual Credit Cap</h4>
               </div>
               <p class="text-xs text-outline mb-3">Override the credit band rules for this specific client. Leave blank to use standard band limits.</p>
               <div class="flex gap-3 items-end">
                 <div class="flex-1">
                   <label class="text-[10px] font-semibold text-outline uppercase tracking-wide">Max Loan Override (R)</label>
                   <input id="credit-cap-input" type="number" min="0" step="100" placeholder="e.g. 5000"
                     class="w-full mt-1 border border-orange-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:outline-none bg-white"
                     style="--tw-ring-color:var(--color-primary)">
                 </div>
                 <div class="flex-1">
                   <label class="text-[10px] font-semibold text-outline uppercase tracking-wide">Reason / Note</label>
                   <input id="credit-cap-note" type="text" placeholder="Reason for cap..."
                     class="w-full mt-1 border border-orange-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:outline-none bg-white">
                 </div>
                 <button onclick="window.saveClientCap()"
                   class="px-4 py-2 rounded-xl text-white text-sm font-bold flex-shrink-0 mb-0.5"
                   style="background:var(--color-primary)">Apply Cap</button>
               </div>
               <div id="credit-cap-current" class="mt-2 text-xs text-outline"></div>
             </div>

             <h4 class="text-md font-headline font-bold text-on-surface mb-4 mt-6">Linked Bank Accounts</h4>
             <div id="bank-accounts-container" class="space-y-3">
                </div>
          </div>

          <div id="financial-tab" class="tab-pane hidden glass-card rounded-2xl p-8">
             <h3 class="text-lg font-headline font-bold text-on-surface mb-6">Financial Snapshot</h3>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="p-5 bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-100 shadow-sm">
                   <div class="flex items-center gap-3 mb-2">
                      <div class="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center"><span class="material-symbols-outlined text-[18px]">trending_up</span></div>
                      <span class="text-xs font-bold text-green-700 uppercase tracking-wider">Monthly Income</span>
                   </div>
                   <div id="fin-income" class="text-2xl font-bold text-on-surface">R 0.00</div>
                </div>
                <div class="p-5 bg-gradient-to-br from-red-50 to-white rounded-2xl border border-red-100 shadow-sm">
                   <div class="flex items-center gap-3 mb-2">
                      <div class="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center"><span class="material-symbols-outlined text-[18px]">trending_down</span></div>
                      <span class="text-xs font-bold text-red-700 uppercase tracking-wider">Monthly Expenses</span>
                   </div>
                   <div id="fin-expenses" class="text-2xl font-bold text-on-surface">R 0.00</div>
                </div>
             </div>
             <div class="pt-8 border-t border-outline-variant/10">
                <div class="flex justify-between items-center mb-6">
                   <h4 class="text-lg font-headline font-bold text-on-surface">Credit Bureau Report</h4>
                   <div class="flex items-center gap-3">
                      <span id="credit-date" class="text-sm text-outline font-medium"></span>
                      <button id="btn-download-xml" class="hidden text-sm bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium flex items-center gap-2">
                         <span class="material-symbols-outlined text-[16px]">code</span> Download XML
                      </button>
                   </div>
                </div>
                <div id="credit-check-content" class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
                   </div>
             </div>
          </div>

          <div id="documents-tab" class="tab-pane hidden glass-card rounded-2xl p-8">
             <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-headline font-bold text-on-surface">All User Documents</h3>
                <span id="doc-count" class="bg-surface-container text-outline text-xs font-semibold px-3 py-1 rounded-full">0</span>
             </div>
             <div id="documents-list" class="grid grid-cols-1 gap-4">
                </div>
          </div>

          <div id="loan-tab" class="tab-pane hidden glass-card rounded-2xl p-8">
             <h3 class="text-lg font-headline font-bold text-on-surface mb-6">Current Application Data</h3>
             <div class="space-y-6 mb-10">
                <div class="grid grid-cols-1 sm:grid-cols-3 items-center border-b border-outline-variant/10 pb-4">
                   <span class="text-sm font-medium text-outline">Agreement / Reference No.</span>
                   <div class="sm:col-span-2 font-mono text-sm font-bold text-on-surface bg-orange-50 p-2 rounded-xl inline-block border border-orange-100" id="detail-app-id" style="color:var(--color-primary)"></div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 items-center border-b border-outline-variant/10 pb-4">
                   <span class="text-sm font-medium text-outline">Submitted Date</span>
                   <div class="sm:col-span-2 text-sm text-on-surface" id="detail-date"></div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 items-center border-b border-outline-variant/10 pb-4">
                   <span class="text-sm font-medium text-outline">Loan Purpose</span>
                   <div class="sm:col-span-2 text-sm text-on-surface font-medium" id="detail-purpose"></div>
                </div>
                <div class="pt-2">
                   <label class="text-sm font-medium text-gray-700 block mb-2">Admin Notes</label>
                   
                   <textarea id="detail-notes" class="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-on-surface h-32 focus:ring-2 focus:border-transparent transition-all outline-none" style="--tw-ring-color:var(--color-primary)" placeholder="Add internal notes here..."></textarea>
                   <div class="mt-2 text-right">
                       <button id="btn-save-notes" class="px-4 py-2 rounded-xl font-semibold text-xs text-white transition-all shadow-sm" style="background:var(--color-primary)">
                           <span class="material-symbols-outlined text-[14px] align-middle mr-1">save</span> Save Notes
                       </button>
                   </div>

                </div>
             </div>

             <div id="credit-life-contract-panel" class="mb-10 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6">
                <div class="flex items-start justify-between gap-4 mb-5">
                   <div>
                      <h3 class="text-lg font-headline font-bold text-on-surface">Credit Life Contract</h3>
                      <p class="text-sm text-outline mt-1">Optional insurance consent, signed snapshot, and supporting signatures.</p>
                   </div>
                   <span id="credit-life-status-badge" class="px-3 py-1 text-xs font-bold rounded-full bg-gray-200 text-gray-700">Not selected</span>
                </div>
                <div id="credit-life-contract-content" class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                   <div class="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                      <h4 class="text-[10px] font-semibold uppercase tracking-widest text-outline mb-3">Contract Snapshot</h4>
                      <div class="flex items-center justify-end gap-2 mb-3">
                         <button id="credit-life-view-contract-btn" class="hidden px-3 py-1.5 text-xs font-semibold rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low transition-all flex items-center gap-1">
                           <span class="material-symbols-outlined text-[14px]">open_in_full</span> View full contract
                         </button>
                         <button id="credit-life-download-contract-btn" class="hidden px-3 py-1.5 text-xs font-semibold rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 transition-all flex items-center gap-1">
                           <span class="material-symbols-outlined text-[14px]">download</span> Download file
                         </button>
                      </div>
                      <div id="credit-life-contract-summary" class="space-y-3 text-sm text-outline"></div>
                   </div>
                   <div class="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                      <h4 class="text-[10px] font-semibold uppercase tracking-widest text-outline mb-3">Captured Signatures</h4>
                      <div id="credit-life-signature-gallery" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
                   </div>
                </div>
             </div>
             
             <h3 class="text-lg font-headline font-bold text-on-surface mb-4 border-t border-outline-variant/10 pt-8">Client History</h3>
             <div class="mb-6">
                <h4 class="text-[11px] font-semibold text-outline mb-3 uppercase tracking-widest">Previous Loans</h4>
                <div id="loan-history-list" class="space-y-2">
                   <p class="text-sm text-gray-400 italic">No previous loan history found.</p>
                </div>
             </div>
             <div>
                <h4 class="text-[11px] font-semibold text-outline mb-3 uppercase tracking-widest">Other Applications</h4>
                <div id="app-history-list" class="space-y-2">
                   <p class="text-sm text-gray-400 italic">No other applications on record.</p>
                </div>
             </div>
          </div>
       </div>

           <div id="contract-status-card" class="glass-card rounded-2xl p-6">
            <h3 class="font-headline font-bold text-on-surface mb-4 flex items-center gap-2 text-xs uppercase tracking-widest">
              <span class="material-symbols-outlined text-[16px]" style="color:var(--color-primary)">draw</span> Contract Status
            </h3>
            <div id="contract-status-empty" class="text-sm text-outline bg-surface-container border border-dashed border-outline-variant/30 rounded-xl px-4 py-6 text-center">
              No contracts sent yet.
            </div>
              <div id="contract-repayment-section" class="mt-4 border-t border-outline-variant/10 pt-4">
                <h4 class="text-[10px] font-semibold text-outline uppercase tracking-widest mb-3">Repayment Date</h4>
                <div class="bg-surface-container border border-outline-variant/20 rounded-xl p-3">
                  <div class="mb-2 flex items-center justify-end">
                    <span id="contract-date-status-badge" class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-yellow-100 text-yellow-700">Not set</span>
                  </div>
                  <div id="contract-date-view" class="flex items-center justify-between gap-3">
                    <span class="text-xs text-outline font-medium">First Repayment:</span>
                    <div class="flex items-center gap-2">
                      <span id="contract-date-label" class="text-xs font-bold text-on-surface">Not Scheduled</span>
                      <button id="contract-set-date-btn" onclick="window.toggleContractDateEdit()" class="px-2.5 py-1 text-[11px] font-semibold rounded-xl text-white transition-colors" style="background:var(--color-primary)">
                        Set date
                      </button>
                    </div>
                  </div>
                  <div id="contract-date-edit" class="hidden mt-2">
                    <div class="flex items-center gap-2">
                      <input type="date" id="new-repayment-date"
                             class="flex-1 text-xs p-1.5 rounded-xl border border-outline-variant/30 bg-white focus:ring-2 outline-none">
                      <button id="btn-save-date" onclick="window.saveRepaymentDate()" class="px-3 py-1.5 text-white text-xs font-semibold rounded-xl shadow-sm" style="background:var(--color-primary)">
                        Save
                      </button>
                      <button onclick="window.toggleContractDateEdit()" class="px-2 py-1.5 text-outline hover:text-on-surface">
                        <span class="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            <div id="contract-status-section" class="hidden mt-4 border-t border-outline-variant/10 pt-4">
              <h4 class="text-[10px] font-semibold text-outline uppercase tracking-widest mb-3">History</h4>
              <div id="contract-status-content" class="space-y-2">
                </div>
            </div>
           </div>
    </div>

    <div class="lg:col-span-4">
       <div class="glass-card rounded-2xl sticky top-28 overflow-hidden">
          <div class="p-6 border-b border-outline-variant/10 bg-surface-container-lowest">
             <h3 class="font-headline font-bold text-on-surface">Loan Status</h3>
             <div id="status-alert" class="mt-3 p-3 rounded-xl text-xs font-medium leading-relaxed hidden animate-pulse">
                </div>
          </div>

          <div class="p-6 space-y-6">
             <div>
                <label class="text-[10px] font-semibold uppercase tracking-widest text-outline">Requested Amount</label>
                <div id="sidebar-amount" class="text-3xl font-bold text-on-surface mt-1 tracking-tight">R 0.00</div>
             </div>
             <div>
                <label class="text-[10px] font-semibold uppercase tracking-widest text-outline">Term Length</label>
                <div class="mt-2 flex items-center gap-2">
                   <div class="w-10 h-10 rounded-xl bg-surface-container text-outline flex items-center justify-center"><span class="material-symbols-outlined text-[20px]">calendar_month</span></div>
                   <div id="sidebar-term" class="text-lg font-semibold text-on-surface">0 Months</div>
                </div>
             </div>

             <div>
                <label class="text-xs text-gray-500 uppercase font-bold tracking-wider">Est. Monthly Payment</label>
                <div class="mt-2 p-4 bg-surface-container rounded-xl border border-outline-variant/20">
                   <div id="sidebar-payment" class="text-xl font-bold text-on-surface">R 0.00</div>
                   <div class="text-xs text-outline mt-1">(Principal Only)</div>
                </div>
             </div>

             <div id="financial-breakdown" class="pt-4 border-t border-gray-100 space-y-4">
                </div>

             <div>
                <label class="text-[10px] font-semibold uppercase tracking-widest text-outline">Current Status</label>
                <div id="sidebar-status" class="mt-2 text-lg font-bold" style="color:var(--color-primary)">Pending</div>
             </div>
          </div>

          <div class="p-6 bg-surface-container-lowest border-t border-outline-variant/10 flex flex-col gap-3" id="action-buttons-container">
              </div>

          <div class="p-6 bg-surface-container-lowest border-t border-outline-variant/10">
              <label class="text-[10px] font-semibold uppercase tracking-widest text-outline mb-2 block">Manual Override (Restricted)</label>
              <div class="flex gap-2">
                  <select id="status-override-select" class="flex-1 text-xs border-outline-variant/30 rounded-xl">
                      ${fe.map(t=>`<option value="${t.value}">${t.label}</option>`).join("")}
                  </select>
                  <button id="manual-update-btn" onclick="manualStatusChange()" class="px-3 py-2 text-white text-xs font-semibold rounded-xl transition" style="background:var(--color-primary)">
                      Update
                  </button>
              </div>
              <p id="override-hint" class="text-[10px] text-outline mt-1 italic">Use only for corrections. Bureau statuses locked.</p>
          </div>

       </div>
    </div>

    <!-- Audit Trail Tab -->
    <div id="audit-tab" class="tab-pane hidden glass-card rounded-2xl p-8 col-span-2">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-headline font-bold text-on-surface">Audit Trail</h3>
          <p class="text-sm text-outline mt-0.5">Complete history of all changes to this application</p>
        </div>
        <button onclick="window.exportAuditTrail()" class="flex items-center gap-2 text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 rounded-xl text-gray-600 transition-colors">
          <span class="material-symbols-outlined text-[14px]">download</span> Export
        </button>
      </div>
      <div id="audit-trail-list" class="space-y-3">
        <div class="text-center py-8 text-sm text-gray-400">Loading audit history...</div>
      </div>
    </div>

  </div>


  <div id="feedback-container" class="fixed bottom-6 right-6 z-50 hidden"></div>
  <div id="credit-life-contract-modal" class="fixed inset-0 z-[80] hidden items-center justify-center bg-gray-900/70 p-4">
    <div class="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div class="flex items-center justify-between gap-4 border-b border-outline-variant/10 px-6 py-4">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-widest text-outline">Credit Life Contract</p>
          <h3 class="text-lg font-headline font-bold text-on-surface">Signed Contract Snapshot</h3>
        </div>
        <button id="credit-life-contract-modal-close" class="w-10 h-10 rounded-full text-outline hover:bg-surface-container-low transition-all flex items-center justify-center">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div id="credit-life-contract-modal-body" class="max-h-[calc(90vh-80px)] overflow-y-auto px-6 py-5"></div>
    </div>
  </div>
</div>
`,U=t=>{if(!t)return"bg-gray-100 text-gray-800 border border-gray-200";switch(t){case"APPROVED":case"approved":case"DISBURSED":case"AFFORD_OK":case"BUREAU_OK":return"bg-green-100 text-green-800 border border-green-200";case"declined":case"DECLINED":case"AFFORD_FAIL":return"bg-red-100 text-red-800 border border-red-200";case"OFFERED":case"OFFER_ACCEPTED":return"bg-purple-100 text-purple-800 border border-purple-200";default:return"bg-yellow-100 text-yellow-800 border border-yellow-200"}},P=t=>{const n=document.getElementById("header-status-badge");!n||!t||(n.textContent=t,n.className=`px-4 py-1.5 text-sm font-bold rounded-full shadow-sm ${U(t)}`)},S=(t="")=>`${t}`.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");window.viewBureauReport=t=>{try{const n=atob(t),e=new Array(n.length);for(let o=0;o<n.length;o++)e[o]=n.charCodeAt(o);const a=new Uint8Array(e),s=new Blob([a],{type:"application/pdf"}),r=URL.createObjectURL(s);window.open(r,"_blank")}catch(n){console.error("PDF Render Error:",n),alert("Unable to display the PDF format. Please ensure the bureau data is valid.")}};window.viewTruidReport=()=>{if(!d?.truid_info){u("No TruID data available for this applicant.","error");return}const t=d.truid_info.summary_payload||d.truid_info,n=d.truid_info,e=n.summary_payload||{},a=e.id_document||e.identity||{},s=e.bank_accounts||e.banking||[],r=e.income_summary||e.income||{},o=e.employment||e.employer||{},i=(c,p,m=!1)=>p?`<tr><td style="color:#888;font-size:12px;padding:5px 10px;width:35%">${c}</td><td style="font-weight:${m?"700":"500"};font-size:13px;padding:5px 10px;color:${m?"#E7762E":"#1a1a1a"}">${p}</td></tr>`:"",l=window.open("","_blank");l.document.write(`<!DOCTYPE html>
<html><head><title>TruID Report</title>
<style>
  body{font-family:sans-serif;background:#f4f7f6;padding:24px;color:#333}
  .card{background:#fff;border-radius:14px;padding:20px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.07);border:1px solid #e5e7eb}
  h1{font-size:20px;font-weight:800;margin-bottom:4px;color:#1a1a1a}
  h3{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#888;margin-bottom:10px}
  table{width:100%;border-collapse:collapse}
  .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase}
  .green{background:#d1fae5;color:#065f46} .blue{background:#dbeafe;color:#1e3a8a} .orange{background:#fff3cd;color:#92400e}
  details{margin-top:12px} summary{cursor:pointer;font-size:12px;font-weight:600;color:#3b82f6}
  pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:11px;overflow-x:auto;margin-top:8px}
</style></head><body>
<div style="max-width:780px;margin:0 auto">
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div><h1>TruID Digital Verification</h1><p style="color:#888;font-size:12px">Collection ID: ${n.collection_id||"—"}</p></div>
      <span class="badge ${n.verified?"green":"orange"}">${n.verified?"✓ Verified":"Pending"}</span>
    </div>
  </div>

  ${a.full_name||a.surname?`
  <div class="card">
    <h3>Identity Details</h3>
    <table>
      ${i("Full Name",a.full_name||[a.forenames,a.surname].filter(Boolean).join(" "),!0)}
      ${i("ID Number",a.id_number||a.identity_number)}
      ${i("Date of Birth",a.date_of_birth||a.dob)}
      ${i("Gender",a.gender)}
      ${i("Nationality",a.nationality||"South African")}
      ${i("Verified",a.verified?"✓ Yes":"Pending")}
    </table>
  </div>`:""}

  ${r.gross_income||r.net_income||r.monthly_income?`
  <div class="card">
    <h3>Income Summary (from bank statements)</h3>
    <table>
      ${i("Monthly Gross Income",r.gross_income?"R "+Number(r.gross_income).toLocaleString("en-ZA",{minimumFractionDigits:2}):null,!0)}
      ${i("Monthly Net Income",r.net_income?"R "+Number(r.net_income).toLocaleString("en-ZA",{minimumFractionDigits:2}):null)}
      ${i("Average Monthly Income",r.average_monthly?"R "+Number(r.average_monthly).toLocaleString("en-ZA",{minimumFractionDigits:2}):null)}
      ${i("Income Source",r.source||r.income_type)}
      ${i("Employer",r.employer_name||o.name)}
    </table>
  </div>`:""}

  ${Array.isArray(s)&&s.length?`
  <div class="card">
    <h3>Bank Accounts (${s.length})</h3>
    ${s.map(c=>`
    <div style="background:#f9fafb;border-radius:8px;padding:10px 14px;margin-bottom:8px;">
      <table>
        ${i("Bank",c.bank_name||c.institution)}
        ${i("Account No",c.account_number)}
        ${i("Account Type",c.account_type)}
        ${i("Balance",c.current_balance?"R "+Number(c.current_balance).toLocaleString("en-ZA",{minimumFractionDigits:2}):null)}
      </table>
    </div>`).join("")}
  </div>`:""}

  <div class="card">
    <h3>Raw Payload</h3>
    <details><summary>Show raw JSON</summary>
    <pre>${JSON.stringify(t,null,2)}</pre>
    </details>
  </div>
</div>
</body></html>`),l.document.close()};const u=(t,n="success")=>{const e=document.getElementById("feedback-container");if(!e)return;const a=n==="success";e.innerHTML=`
    <div class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${a?"bg-white border-green-100":"bg-white border-red-100"} transform transition-all duration-300">
        <div class="w-8 h-8 rounded-full ${a?"bg-green-100 text-green-600":"bg-red-100 text-red-600"} flex items-center justify-center">
            <span class="material-symbols-outlined text-[18px]">${a?"check":"error"}</span>
        </div>
        <div>
            <p class="text-sm font-bold text-on-surface">${a?"Success":"Error"}</p>
            <p class="text-xs text-outline">${t}</p>
        </div>
    </div>
  `,e.classList.remove("hidden"),setTimeout(()=>{e.classList.add("hidden")},5e3)},ge=async()=>{const t=document.getElementById("contract-status-empty"),n=document.getElementById("contract-status-section");if(!G()){O(),n&&n.classList.add("hidden"),t&&(t.classList.remove("hidden"),t.innerHTML=`
        <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-yellow-600 text-xl mt-0.5">warning</span>
            <div>
              <h4 class="font-semibold text-yellow-900 mb-1">DocuSeal Not Configured</h4>
              <p class="text-sm text-yellow-700">
                E-signature features are currently disabled. Please configure DocuSeal API credentials to enable contract tracking.
              </p>
            </div>
          </div>
        </div>
      `);return}t&&(t.classList.remove("hidden"),t.textContent="No contracts sent yet."),await N()},ve=async(t=null)=>{if(!d||!d.profiles){alert("Error: Application data not loaded");return}const n=t||document.getElementById("btn-send-contract"),e=n?n.innerHTML:"";n&&(n.disabled=!0,n.innerHTML='<span class="material-symbols-outlined text-[16px] animate-spin align-middle">progress_activity</span> Sending...');try{const a=await se(d,d.profiles);alert(`✅ Contract sent successfully to ${d.profiles.email}`),await $(d.id,"OFFERED"),await N(),await h()}catch(a){console.error("Send contract error:",a),alert(`❌ Failed to send contract: ${a.message}`)}finally{n&&(n.disabled=!1,n.innerHTML=e)}},ye=()=>{d?.id&&window.open(`/api/contracts/${d.id}/preview`,"_blank")},he=()=>{if(!d)return!1;const t=d.status||"";return["OFFERED"].includes(t)},we=()=>{A||!he()||(A=setInterval(()=>{N(!0)},be))},O=()=>{A&&(clearInterval(A),A=null)},_e=async()=>{if(!(M||B||!d)){M=!0,B=!0,O();try{let t=!1;if(d.status!=="OFFER_ACCEPTED"){const{error:n}=await $(d.id,"OFFER_ACCEPTED");if(n){console.error("Auto advance to Contract Signed failed:",n),B=!1;return}d.status="OFFER_ACCEPTED",d.contract_signed_at=new Date().toISOString(),t=!0}if(t)try{const n=await fetch("/api/suresystems/activate-application",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({applicationId:d.id})}),e=await n.json().catch(()=>({}));if(!n.ok||e?.success===!1){const a=new Error(e?.error||e?.message||"SureSystems mandate activation failed");throw a.details=e?.details||null,a}}catch(n){console.error("SureSystems activation failed during contract auto-complete:",{message:n?.message||"Unknown activation error",details:n?.details||null}),u(n?.message||"SureSystems mandate activation failed","error")}j(d),P("OFFER_ACCEPTED"),u("Contract signed! Advanced to approval phase.","success"),await h()}catch(t){console.error("handleContractCompleted error:",t),B=!1}finally{M=!1}}},N=async(t=!1)=>{if(d?.id)try{const n=await ie(d.id),e=document.getElementById("contract-status-section"),a=document.getElementById("contract-status-empty");if(n.length===0){e&&e.classList.add("hidden"),a&&(a.classList.remove("hidden"),a.textContent="No contracts sent yet."),O(),q(!1);return}a&&a.classList.add("hidden"),e&&e.classList.remove("hidden"),Ee(n);const s=n[0]?.status?.toLowerCase?.()||"";q(s==="declined"),s==="completed"&&!B?await _e():s!=="completed"&&!t&&we()}catch(n){console.error("Load contract status error:",n)}},Ee=t=>{const n=document.getElementById("contract-status-content");n&&(n.innerHTML=t.map(e=>{const a=Se(e.status),s=Ce(e.status);return`
      <div class="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl ${a.bg} ${a.text} flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px]">${s}</span>
            </div>
            <div>
              <div class="font-semibold text-on-surface text-sm">Contract #${e.submission_id.slice(-8)}</div>
              <div class="text-xs text-outline">Sent ${g(e.created_at)}</div>
            </div>
          </div>
          <span class="px-3 py-1 text-xs font-semibold rounded-full ${a.badge}">${e.status}</span>
        </div>
        <div class="flex gap-2">
          <button onclick="window.viewSubmission('${e.slug||""}', '${e.submitter_id||""}', '${e.embed_src||""}')" class="flex-1 px-3 py-2 bg-surface-container border border-outline-variant/30 text-on-surface-variant rounded-xl hover:bg-surface-container-low text-xs font-semibold flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-[14px]">visibility</span> View
          </button>
          ${e.status==="pending"?`
            <button onclick="window.resendSubmission('${e.submitter_id}', '${e.submission_id}')" class="flex-1 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-100 text-xs font-semibold flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-[14px]">send</span> Resend
            </button>
          `:""}
          ${e.status!=="completed"&&e.status!=="voided"?`
            <button onclick="window.voidSubmission('${e.submission_id}')" class="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-xl hover:bg-red-100 text-xs font-semibold flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">block</span> Void
            </button>
          `:""}
        </div>
      </div>
    `}).join(""))},q=t=>{if(typeof t!="boolean"||!d||t===V)return;V=t;const n="contract-declined-banner",e=document.getElementById(n),a=document.getElementById("contract-status-card");if(t){if(!I&&d.status!=="DECLINED"&&(I=d.status),d.status="DECLINED",P("DECLINED"),j(d),!e&&a){const s=document.createElement("div");s.id=n,s.className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2",s.innerHTML=`
        <span class="material-symbols-outlined text-red-500 text-[16px]">cancel</span>
        <span>Contract was declined by the applicant.</span>
      `;const r=a.querySelector("h3");r&&r.parentNode?r.parentNode.insertBefore(s,r.nextSibling):a.prepend(s)}}else e&&e.remove(),I&&(d.status=I),I=null,j(d),P(d.status)},Se=t=>{const n=(t||"").toLowerCase(),e={pending:{bg:"bg-yellow-100",text:"text-yellow-600",badge:"bg-yellow-100 text-yellow-700"},completed:{bg:"bg-green-100",text:"text-green-600",badge:"bg-green-100 text-green-700"},expired:{bg:"bg-red-100",text:"text-red-600",badge:"bg-red-100 text-red-700"},voided:{bg:"bg-gray-100",text:"text-gray-600",badge:"bg-gray-100 text-gray-700"},declined:{bg:"bg-red-100",text:"text-red-600",badge:"bg-red-100 text-red-700"}};return e[n]||e.pending},Ce=t=>{const n=(t||"").toLowerCase(),e={pending:"schedule",completed:"check_circle",expired:"error",voided:"block",declined:"cancel"};return e[n]||e.pending};window.viewSubmission=async(t,n,e)=>{const a=r=>r&&r!=="undefined"&&r!=="null"?r:null,s=window.open("","_blank");try{let r=null;if(a(n))try{const o=await oe(n),i=o?.slug||o?.submitter?.slug,l=o?.embed_src||o?.submitter?.embed_src;r=a(l)||(a(i)?H(i):null)}catch(o){console.warn("Live submitter lookup failed, falling back to stored values:",o)}if(r||(r=a(e)),!r&&a(t)&&(r=H(t)),!r){s&&s.close(),alert("Unable to open this contract — the signing link is missing. Try resending the contract.");return}s?s.location.href=r:window.open(r,"_blank")}catch(r){console.error("viewSubmission error:",r),s&&s.close(),alert(`Could not open contract: ${r.message||r}`)}};window.resendSubmission=async(t,n=null)=>{if(confirm("Resend contract email to the applicant?"))try{let e=t;if(!e){if(!n)throw new Error("Unable to determine DocuSeal submitter");e=await me(n)}await ue(e),alert("✅ Contract email resent successfully"),await N()}catch(e){alert(`❌ Failed to resend: ${e.message}`)}};window.voidSubmission=async t=>{if(confirm("Void this contract submission? This cannot be undone."))try{await pe(t),alert("✅ Submission voided successfully"),await N()}catch(n){alert(`❌ Failed to void: ${n.message}`)}};const ke=()=>{const t=document.querySelectorAll(".tab-btn"),n=document.querySelectorAll(".tab-pane");t.forEach(e=>{e.addEventListener("click",()=>{t.forEach(r=>{r.classList.remove("active"),r.style.borderColor="",r.style.color="",r.classList.add("text-outline","border-transparent")}),e.classList.remove("text-outline","border-transparent"),e.classList.add("active"),e.style.borderColor="var(--color-primary)",e.style.color="var(--color-primary)",n.forEach(r=>r.classList.add("hidden"));const a=e.getAttribute("data-tab")+"-tab",s=document.getElementById(a);if(s&&s.classList.remove("hidden"),e.getAttribute("data-tab")==="audit"){const r=new URLSearchParams(window.location.search);Q(r.get("id"))}})})};window.updateStatus=async t=>{if(t==="AFFORD_OK"){if(!(d.bureau_score_band||["BUREAU_OK","BANK_LINKING"].includes(d.status))){u("Cannot confirm affordability — no bureau result on record. Run the credit check first.","error");return}const{data:a}=await b.from("financial_profiles").select("monthly_income").eq("user_id",d.user_id).maybeSingle();if(!a?.monthly_income){u("Cannot confirm affordability — no income on record. Complete open banking first.","error");return}}if(t==="OFFERED"&&(!d.offer_principal||d.offer_principal<=0)){u("Cannot send contract — loan offer not configured yet.","error");return}if(t==="READY_TO_DISBURSE"){if(d.status!=="OFFER_ACCEPTED"&&!d.contract_signed_at){u("Cannot queue for disbursement — contract has not been signed yet.","error");return}if(!d.bank_account_id){u("Cannot queue for disbursement — no bank account linked.","error");return}}const{error:n}=await $(d.id,t);n?u(n.message,"error"):(u(`Status updated to ${t}`,"success"),h()),k()};window.declineApplication=async()=>{const{error:t}=await $(d.id,"DECLINED");t?u(t.message,"error"):(u("Application declined.","success"),h()),k()};window.saveNotes=async()=>{const t=document.getElementById("detail-notes").value,n=document.getElementById("btn-save-notes");if(!t.trim())return;const e=n.innerHTML;n.disabled=!0,n.innerHTML='<span class="material-symbols-outlined text-[14px] align-middle animate-spin mr-1">progress_activity</span> Saving...';try{const{error:a}=await ee(d.id,t);if(a)throw a;u("Notes saved successfully","success"),n.innerHTML='<span class="material-symbols-outlined text-[14px] align-middle mr-1">check</span> Saved!',n.style.background="#16a34a",setTimeout(()=>{n.innerHTML=e,n.disabled=!1,n.style.background="var(--color-primary)"},2e3)}catch(a){u(a.message,"error"),n.disabled=!1,n.innerHTML=e}};window.saveRepaymentDate=async()=>{const t=document.getElementById("new-repayment-date");if(!t||!t.value)return;const n=t.value,e=document.getElementById("btn-save-date"),a=e.innerHTML;e.disabled=!0,e.innerHTML='<span class="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>';try{const r={...d.offer_details||{},first_payment_date:n},{error:o}=await b.from("loan_applications").update({offer_details:r,repayment_start_date:n}).eq("id",d.id);if(o)throw o;u("First repayment date updated successfully","success"),await h()}catch(s){console.error("Date Update Error:",s),u(s.message,"error"),e.disabled=!1,e.innerHTML=a}};const $e=t=>{const n=document.getElementById("contract-date-label"),e=document.getElementById("contract-date-status-badge"),a=document.getElementById("contract-set-date-btn"),s=document.getElementById("new-repayment-date"),r=document.getElementById("contract-date-view"),o=document.getElementById("contract-date-edit");if(!n||!e||!a||!s||!r||!o||!t)return;const i=t.repayment_start_date||t.offer_details?.first_payment_date,l=new Date;l.setHours(0,0,0,0),n.textContent=i?g(i):"Not Scheduled",e.textContent=i?"Date set":"Not set",e.className=i?"px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700":"px-2 py-0.5 text-[10px] font-bold rounded-full bg-yellow-100 text-yellow-700",s.value=i?new Date(i).toISOString().split("T")[0]:"",s.min=l.toISOString().split("T")[0];const c=t.status==="DISBURSED";a.disabled=c,a.classList.toggle("opacity-50",c),a.classList.toggle("cursor-not-allowed",c),r.classList.remove("hidden"),o.classList.add("hidden")};window.toggleContractDateEdit=()=>{const t=document.getElementById("contract-date-view"),n=document.getElementById("contract-date-edit");t&&n&&(t.classList.toggle("hidden"),n.classList.toggle("hidden"))};window.manualStatusChange=async()=>{if(d.status==="DISBURSED"){alert(`⛔ ACTION BLOCKED

This application has already been disbursed. To maintain financial integrity, you cannot change the status of an active loan.`);return}const n=document.getElementById("status-override-select").value;if(n!==d.status){if(n.includes("BUREAU")){alert("Cannot manually override Bureau statuses. These are automated.");return}if(confirm(`Are you sure you want to manually force status to "${n}"?`)){const{error:e}=await $(d.id,n);if(e){u(e.message,"error");return}if(n==="OFFER_ACCEPTED"){u("Status manually updated. Activating SureSystems mandate...","success");try{const a=await fetch("/api/suresystems/activate-application",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({applicationId:d.id})}),s=await a.json().catch(()=>({}));if(!a.ok||s?.success===!1){const r=new Error(s?.error||s?.message||"SureSystems mandate activation failed");throw r.details=s?.details||null,r}alert(`✅ SureSystems mandate activated successfully.

Application ID: ${d.id}${s?.contractReference?`
Contract Reference: ${s.contractReference}`:""}${s?.activatedAt?`
Activated At: ${new Date(s.activatedAt).toLocaleString()}`:""}`)}catch(a){const s=a?.details?`

Details:
${JSON.stringify(a.details,null,2)}`:"";console.error("SureSystems activation failed:",{message:a?.message||"Unknown activation error",details:a?.details||null}),alert(`⚠️ Status changed to OFFER_ACCEPTED, but mandate activation failed.

${a?.message||"Unknown activation error"}`+s),u(a?.message||"SureSystems mandate activation failed","error")}}else u("Status manually updated.","success");await h()}}};const C=document.getElementById("confirmation-modal"),K=document.getElementById("modal-title"),z=document.getElementById("modal-body"),Le=(t,n,e)=>{K&&(K.textContent=t),z&&(z.textContent=n),F=e,C?(C.classList.remove("hidden"),C.classList.add("flex")):confirm(n)&&e()},k=()=>{C&&(C.classList.add("hidden"),C.classList.remove("flex")),F=null},De=async()=>{const{data:{user:t}}=await b.auth.getUser(),{data:n}=await J(d.id);if(n&&n.length>0){u("Disbursement already exists for this application.","error"),k();return}const{data:e,error:a}=await $(d.id,"APPROVED");if(a){u(a.message,"error"),k();return}const{data:s}=await Y(),r=d.bank_account?.id||null,o={applicationId:d.id,userId:d.user_id,amount:e.amount,bankAccountId:r,createdBy:t.id},{data:i,error:l}=await ne(o);if(l)u("Status updated but disbursement creation failed: "+l.message,"error");else{let c="Application approved & disbursement created.";i.payout_method==="cashsend"&&i.cashsend_fee&&(c+=` CashSend fee: R${i.cashsend_fee.toFixed(2)}`),u(c,"success"),h()}k()},Ie=(t,n)=>{const e=t?.full_name||"Unknown User",a=t?.avatar_url||`https://ui-avatars.com/api/?name=${e.replace(" ","+")}&background=random`;document.getElementById("profile-image").src=a,document.getElementById("detail-fullname").textContent=e,document.getElementById("detail-email").textContent=t?.email||"N/A",document.getElementById("detail-mobile").textContent=t?.contact_number||t?.cell_tel_no||"N/A",Pe(t),Ue(t);const s=document.getElementById("detail-nok");if(s){const i=[t?.nok_name,t?.nok_relationship,t?.nok_phone].filter(Boolean).join(" · ");s.textContent=i||"— Not provided —",s.style.color=i?"":"#ef4444"}const r=document.getElementById("detail-identity-number");r&&(r.textContent=t?.identity_number||"N/A");const o=document.getElementById("bank-accounts-container");o&&(o.innerHTML="",n&&n.length>0?n.forEach(i=>{const l=document.createElement("div");l.className="p-4 border border-outline-variant/20 rounded-xl bg-surface-container-lowest flex justify-between items-center hover:border-[var(--color-primary)] hover:shadow-sm transition-all",l.innerHTML=`
        <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-outline">
                <span class="material-symbols-outlined text-[20px]">account_balance</span>
            </div>
            <div>
                <p class="text-sm font-bold text-on-surface">${i.bank_name||"Unknown Bank"}</p>
                <p class="text-xs text-outline font-mono">${i.account_number||"----"} • ${i.account_type||"Savings"}</p>
            </div>
        </div>
        ${i.is_primary?'<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold border border-green-200">Primary</span>':""}
      `,o.appendChild(l)}):o.innerHTML='<div class="text-sm text-gray-500 italic p-4 border border-dashed border-gray-300 rounded-xl text-center">No bank accounts linked to this profile.</div>')},Be=async t=>{const n=document.getElementById("personal-tab");if(!n||!t)return;const e=n.querySelector(".compliance-section");e&&e.remove();const{data:a}=await b.from("declarations").select("*").eq("user_id",t).maybeSingle();if(!a)return;const s=document.createElement("div");s.className="mt-8 pt-8 border-t border-outline-variant/10 compliance-section",s.innerHTML=`
        <h4 class="text-md font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-outline text-[20px]">shield</span> Compliance & Statutory Data
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-3 bg-surface-container rounded-xl border border-outline-variant/10">
                <p class="text-[10px] text-outline uppercase font-semibold tracking-widest">Marital Status</p>
                <p class="text-sm font-semibold text-on-surface capitalize">${a.marital_status||"Not Set"}</p>
            </div>
            <div class="p-3 bg-surface-container rounded-xl border border-outline-variant/10">
                <p class="text-[10px] text-outline uppercase font-semibold tracking-widest">Residential Status</p>
                <p class="text-sm font-semibold text-on-surface capitalize">${a.home_ownership||"Not Set"}</p>
            </div>
        </div>

        ${a.referral_provided?`
        <div class="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p class="text-[10px] text-blue-400 uppercase font-bold mb-2">Referral Information</p>
            <div class="flex flex-col sm:flex-row gap-4">
                <div><span class="text-xs text-blue-600">Name:</span> <span class="text-sm font-bold text-blue-900">${a.referral_name}</span></div>
                <div><span class="text-xs text-blue-600">Phone:</span> <span class="text-sm font-bold text-blue-900">${a.referral_phone}</span></div>
            </div>
        </div>`:""}
    `,n.appendChild(s)},Ae=(t,n)=>{const e=t&&t[0]?t[0]:{},a=e.parsed_data||{income:{},expenses:{}};document.getElementById("fin-income").textContent=f(e.monthly_income||0),document.getElementById("fin-expenses").textContent=f(e.monthly_expenses||0);const s=document.getElementById("credit-check-content"),r=document.getElementById("credit-date"),o=document.getElementById("btn-download-xml");if(!s)return;let i=document.getElementById("affordability-breakdown-list");if(!i){const c=document.querySelector("#financial-tab .grid"),p=document.createElement("div");p.id="affordability-breakdown-list",p.className="mt-6 p-6 bg-surface-container rounded-2xl border border-outline-variant/10",c.after(p),i=p}i.innerHTML=`
    <h4 class="text-[10px] font-semibold text-outline uppercase tracking-widest mb-4 flex items-center gap-2">
        <span class="material-symbols-outlined text-[16px]">checklist</span> Monthly Budget Breakdown
    </h4>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        <div class="flex justify-between border-b border-outline-variant/10 pb-1">
            <span class="text-sm text-outline">Basic Salary (Net)</span>
            <span class="text-sm font-bold text-on-surface">${f(a.income.salary||0)}</span>
        </div>
        <div class="flex justify-between border-b border-outline-variant/10 pb-1">
            <span class="text-sm text-outline">Housing / Rent</span>
            <span class="text-sm font-bold text-on-surface">${f(a.expenses.housing_rent||0)}</span>
        </div>
        <div class="flex justify-between border-b border-outline-variant/10 pb-1">
            <span class="text-sm text-outline">Other Earnings</span>
            <span class="text-sm font-bold text-on-surface">${f(a.income.other_monthly_earnings||0)}</span>
        </div>
        <div class="flex justify-between border-b border-outline-variant/10 pb-1">
            <span class="text-sm text-outline">School Fees</span>
            <span class="text-sm font-bold text-on-surface">${f(a.expenses.school||0)}</span>
        </div>
        <div class="flex justify-between border-b border-outline-variant/10 pb-1">
            <span class="text-sm text-outline">Disposable Surplus</span>
            <span class="text-sm font-bold" style="color:var(--color-primary)">${f(e.affordability_ratio||0)}</span>
        </div>
        <div class="flex justify-between border-b border-outline-variant/10 pb-1">
            <span class="text-sm text-outline">Transport / Fuel</span>
            <span class="text-sm font-bold text-on-surface">${f(a.expenses.petrol||0)}</span>
        </div>
    </div>
  `;const l=n&&n.length>0?n[0]:null;if(l){const c=l.credit_score||0,p=c>600?"text-green-600":c>500?"text-yellow-600":"text-red-600";if(r&&(r.textContent=`Checked on ${g(l.checked_at||l.created_at||new Date)}`),o){const m=l.raw_xml_data;m?(o.classList.remove("hidden"),o.innerHTML='<span class="material-symbols-outlined text-[16px] mr-1">picture_as_pdf</span> View Bureau Report',o.className="text-sm text-white px-4 py-2 rounded-xl transition-colors shadow-sm font-semibold flex items-center gap-1",o.style.background="var(--color-primary)",o.onclick=()=>window.viewBureauReport(m)):o.classList.add("hidden")}s.innerHTML=`
        <div class="p-6 border-b border-outline-variant/10 text-center bg-surface-container-lowest">
            <div class="text-6xl font-extrabold ${p} mb-2 tracking-tighter">${c}</div>
            <p class="font-bold text-outline uppercase tracking-widest text-[10px]">Bureau Score</p>
            <span class="inline-block mt-2 px-3 py-1 rounded-full bg-surface-container text-outline text-xs font-semibold border border-outline-variant/20">${l.score_band||"Standard"}</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-surface-container">
            <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 text-center">
                <span class="block text-2xl font-bold text-on-surface">${l.total_accounts||0}</span>
                <span class="text-[10px] text-outline font-semibold uppercase tracking-widest mt-1">Total Acc</span>
            </div>
            <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 text-center">
                <span class="block text-2xl font-bold text-red-600">${l.accounts_with_arrears||0}</span>
                <span class="text-[10px] text-outline font-semibold uppercase tracking-widest mt-1">Arrears</span>
            </div>
            <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 text-center">
                <span class="block text-2xl font-bold" style="color:var(--color-primary)">${l.total_enquiries||0}</span>
                <span class="text-[10px] text-outline font-semibold uppercase tracking-widest mt-1">Enquiries</span>
            </div>
            <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 text-center">
                <span class="block text-2xl font-bold text-on-surface">${l.total_judgments||0}</span>
                <span class="text-[10px] text-outline font-semibold uppercase tracking-widest mt-1">Judgments</span>
            </div>
        </div>
        <div class="p-6 bg-surface-container-lowest border-t border-outline-variant/10 space-y-3">
            <div class="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                <span class="text-sm text-outline">Total Balance</span>
                <span class="font-bold text-on-surface">${f(l.total_balance||0)}</span>
            </div>
            <div class="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                <span class="text-sm text-outline">Judgment Value</span>
                <span class="font-bold text-red-600">${f(l.total_judgment_amount||0)}</span>
            </div>
            ${l.ncr_reference?`
            <div class="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                <span class="text-sm text-outline flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[14px] text-green-600">verified</span>
                    NCR Reporting Reference
                </span>
                <span class="font-mono text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-lg">${l.ncr_reference}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-outline">Reported to NCR</span>
                <span class="font-bold ${l.reported_to_ncr?"text-green-600":"text-gray-400"}">
                    ${l.reported_to_ncr?"✓ Yes — "+(l.reported_at?g(l.reported_at):"Confirmed"):"Pending"}
                </span>
            </div>`:`
            <div class="flex justify-between items-center">
                <span class="text-sm text-outline flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[14px] text-yellow-500">warning</span>
                    NCR Reference
                </span>
                <span class="text-xs text-yellow-600 font-semibold">Not yet generated — run credit check</span>
            </div>`}
        </div>
      `}else r&&(r.textContent=""),o&&o.classList.add("hidden"),s.innerHTML='<div class="py-12 text-center text-gray-400"><p>No bureau data available.</p></div>'},Te=(t,n,e)=>{const a=document.getElementById("documents-list"),s=document.getElementById("doc-count");if(!a||!s)return;const r=[{key:"idcard",label:"ID Document"},{key:"till_slip",label:"Latest Payslip"},{key:"bank_statement",label:"Bank Statement"},{key:"credit_life_contract",label:"Credit Life Contract"}];let o=0;if(e&&(e.id_front_image_url&&o++,e.id_back_image_url&&o++,e.selfie_image_url&&o++),s.textContent=(t?.length||0)+(n?1:0)+o,a.innerHTML="",r.forEach(i=>{const l=t.find(v=>v.file_type===i.key),c=i.key==="idcard"&&(e?.id_front_image_url||e?.id_back_image_url),p=l||c,m=p?"text-green-600 bg-green-100":"text-gray-400 bg-gray-100",x=p?"fa-check-circle":"fa-upload",L=c?"Verified via KYC Session":l?"File Verified":"Missing Document",w=document.createElement("div");w.className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-300 transition-all group",w.innerHTML=`
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl ${m} flex items-center justify-center">
                <i class="fa-solid ${x} text-xl"></i>
            </div>
            <div class="flex-grow min-w-0">
                <p class="text-sm font-bold text-gray-900">${i.label}</p>
                <p class="text-xs text-gray-500">${L}</p>
            </div>
        </div>
        <div class="flex items-center gap-2">
            ${l?`
            <button onclick="handleSmartDownload('${l.file_path}')" class="w-10 h-10 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all">
                <i class="fa-solid fa-eye"></i>
            </button>`:""}
            
            <label class="cursor-pointer bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition-all">
                ${p?"Replace":"Upload"}
                <input type="file" class="hidden admin-doc-upload" data-type="${i.key}" accept=".pdf,.jpg,.png,.jpeg">
            </label>
        </div>
      `,a.appendChild(w)}),n){const i=n.verified===!0,l=n.normalized_status||n.status||"Linked",c=document.createElement("div");c.className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-200 rounded-xl hover:border-blue-400 transition-all mt-4",c.innerHTML=`
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl ${i?"bg-blue-600 text-white":"bg-blue-100 text-blue-600"} flex items-center justify-center shadow-sm">
                <i class="fa-solid fa-shield-halved text-xl"></i>
            </div>
            <div class="flex-grow min-w-0">
                <p class="text-sm font-bold text-gray-900">TruID Digital Verification</p>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700">${l}</span>
                    <p class="text-[10px] text-gray-400 font-medium">Ref: ${(n.collection_id||"").slice(0,8)}</p>
                </div>
            </div>
        </div>
        <button onclick="window.viewTruidReport()" class="px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all">
            Inspect Data
        </button>
    `,a.appendChild(c)}e&&[{key:"id_front",label:"KYC ID Front",url:e.id_front_image_url},{key:"id_back",label:"KYC ID Back",url:e.id_back_image_url},{key:"selfie",label:"KYC Selfie",url:e.selfie_image_url}].filter(l=>l.url).forEach(l=>{const c=document.createElement("div");c.className="flex items-center justify-between p-4 bg-purple-50/50 border border-purple-200 rounded-xl hover:border-purple-400 transition-all mt-4",c.innerHTML=`
          <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm">
                  <i class="fa-solid fa-id-card text-xl"></i>
              </div>
              <div class="flex-grow min-w-0">
                  <p class="text-sm font-bold text-gray-900">${l.label}</p>
                  <div class="flex items-center gap-2">
                      <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-700">Digital KYC</span>
                      <p class="text-[10px] text-gray-400 font-medium">Session ID: ${(e.session_id||"").slice(0,8)}</p>
                  </div>
              </div>
          </div>
          <button onclick="window.open('${l.url}', '_blank')" class="px-4 py-2 bg-white border border-purple-600 text-blue-600 rounded-lg text-xs font-bold hover:bg-purple-50 transition-all">
              <i class="fa-solid fa-external-link-alt mr-1"></i> View
          </button>
      `,a.appendChild(c)}),Re()},Re=()=>{document.querySelectorAll(".admin-doc-upload").forEach(t=>{t.addEventListener("change",async n=>{const e=n.target.files[0];if(!e||!d)return;const a=n.target.dataset.type,s=n.target.parentElement,r=s.childNodes[0].textContent;s.childNodes[0].textContent="Processing...";try{const{data:{session:o}}=await b.auth.getSession(),i=o.user.id,l=e.name.split(".").pop(),c=`${a}_${Date.now()}.${l}`,p=`${i}/${d.user_id}_${c}`,{error:m}=await b.storage.from("client_docs").upload(p,e,{upsert:!0});if(m)throw m;const{error:x}=await b.rpc("register_admin_upload",{p_user_id:d.user_id,p_app_id:d.id,p_file_name:c,p_original_name:e.name,p_file_path:p,p_file_type:a,p_mime_type:e.type,p_file_size:e.size});if(x)throw x;u("Document Updated Successfully","success"),h()}catch(o){console.error(o),u(o.message,"error")}finally{s.childNodes[0].textContent=r}})})};window.handleSmartDownload=async t=>{try{let n=t;t.includes("/storage/v1/object/")&&(n=t.split("/").slice(8).join("/"));let{data:e,error:a}=await b.storage.from("client_docs").createSignedUrl(n,60);if((a||!e)&&({data:e,error:a}=await b.storage.from("documents").createSignedUrl(n,60)),a)throw a;window.open(e.signedUrl,"_blank")}catch(n){console.error("Smart Download Error:",n),u("File not found in any bucket. Please check storage manually.","error")}};const Ne=async(t,n,e)=>{const a=document.getElementById("loan-history-list"),s=document.getElementById("app-history-list");let r=document.getElementById("admin-metadata-container");if(e){const o=document.getElementById("loan-tab");if(!r){r=document.createElement("div"),r.id="admin-metadata-container",r.className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-8";const i=Array.from(o.querySelectorAll("h3")).find(l=>l.textContent.includes("Client History"));i?o.insertBefore(r,i):o.appendChild(r)}try{const i=[e.created_by_admin,e.reviewed_by_admin].filter(Boolean),{data:l}=await b.from("profiles").select("id, full_name").in("id",i),c=l?.find(m=>m.id===e.created_by_admin)?.full_name||"System / User",p=l?.find(m=>m.id===e.reviewed_by_admin)?.full_name||"Pending Review";r.innerHTML=`
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p class="text-[10px] text-gray-400 uppercase font-black mb-2 tracking-widest">Created By</p>
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-bold">
                        ${c.charAt(0)}
                    </div>
                    <span class="text-sm font-bold text-gray-800">${c}</span>
                </div>
            </div>
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p class="text-[10px] text-gray-400 uppercase font-black mb-2 tracking-widest">Reviewed By</p>
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600 font-bold">
                        ${p.charAt(0)}
                    </div>
                    <span class="text-sm font-bold text-gray-800">${p}</span>
                </div>
            </div>
          `}catch(i){console.error("Admin UUID Lookup Error:",i)}}a&&(a.innerHTML="",t&&t.length>0?t.forEach(o=>{const i=document.createElement("div");i.className="p-3 border-b border-gray-100 last:border-0",i.innerHTML=`
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block font-bold text-gray-800 text-sm">Loan #${o.id}</span>
                        <span class="text-xs text-gray-500">${g(o.start_date||o.created_at)}</span>
                    </div>
                    <div class="text-right">
                        <span class="block font-bold text-gray-900 text-sm">${f(o.principal_amount||0)}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded bg-green-50 text-green-700 font-bold uppercase">${o.status||"Active"}</span>
                    </div>
                </div>
            `,a.appendChild(i)}):a.innerHTML='<p class="text-sm text-gray-400 italic p-2">No previous loan history found.</p>'),s&&(s.innerHTML="",n&&n.length>0?n.forEach(o=>{const i=document.createElement("div");i.className="p-3 border-b border-gray-100 last:border-0",i.innerHTML=`
                <div class="flex justify-between items-center">
                    <div>
                        <span class="font-bold block text-gray-800 text-sm">App #${o.id}</span>
                        <span class="text-xs text-gray-500">${g(o.created_at)}</span>
                    </div>
                    <div class="text-right">
                        <span class="block text-gray-600 font-medium text-sm">${f(o.amount||0)}</span>
                        <span class="text-[10px] uppercase font-bold text-orange-500">${o.status}</span>
                    </div>
                </div>
            `,s.appendChild(i)}):s.innerHTML='<p class="text-sm text-gray-400 italic p-2">No other applications on record.</p>')},Fe=t=>{const n=document.getElementById("credit-life-status-badge"),e=document.getElementById("credit-life-contract-summary"),a=document.getElementById("credit-life-signature-gallery"),s=document.getElementById("credit-life-view-contract-btn"),r=document.getElementById("credit-life-download-contract-btn");if(!n||!e||!a)return;const o=t?.offer_details||{},i=!!(t?.has_credit_life_insurance||o.credit_life_enabled),l=!!(o.credit_life_contract_signed&&o.credit_life_signature_data),c=o.credit_life_signed_at?g(o.credit_life_signed_at):"Not signed",p=o.credit_life_contract_version||"v1",m=o.credit_life_contract_text||"No signed contract snapshot stored.",x=o.credit_life_contract_file_path||null,L=Number(o.credit_life_total??t?.offer_credit_life_total??0);n.textContent=i?l?"Selected and signed":"Selected, signature missing":"Not selected",n.className=`px-3 py-1 text-xs font-bold rounded-full ${i?l?"bg-green-100 text-green-700":"bg-yellow-100 text-yellow-700":"bg-gray-200 text-gray-700"}`,e.innerHTML=`
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div class="rounded-xl bg-gray-50 border border-gray-200 p-3">
        <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Insurance Status</p>
        <p class="font-semibold text-gray-900">${i?"Opted in":"Not added"}</p>
      </div>
      <div class="rounded-xl bg-gray-50 border border-gray-200 p-3">
        <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Signed At</p>
        <p class="font-semibold text-gray-900">${S(c)}</p>
      </div>
      <div class="rounded-xl bg-gray-50 border border-gray-200 p-3">
        <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Contract Version</p>
        <p class="font-semibold text-gray-900">${S(p)}</p>
      </div>
      <div class="rounded-xl bg-gray-50 border border-gray-200 p-3">
        <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Credit Life Premium</p>
        <p class="font-semibold text-gray-900">${f(L)}</p>
      </div>
    </div>
    <div class="rounded-xl bg-gray-50 border border-gray-200 p-4">
      <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2">Signed Contract Text</p>
      <div class="text-sm leading-6 text-gray-700 whitespace-pre-wrap">${S(m)}</div>
    </div>
  `;const w=o.signature_data,v=o.credit_life_signature_data,_=(y,D,E)=>`
    <div class="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2">${y}</p>
      <p class="text-xs text-gray-500 mb-3">${E}</p>
      ${D?`<img src="${D}" alt="${y}" class="w-full h-40 object-contain rounded-lg border border-gray-200 bg-white">`:'<div class="h-40 rounded-lg border border-dashed border-gray-300 bg-white flex items-center justify-center text-sm text-gray-400">No signature captured</div>'}
    </div>
  `;a.innerHTML=[_("Main Loan Signature",w,"Captured from the standard loan acknowledgement step."),_("Credit Life Signature",v,"Captured only when the Credit Life contract is signed.")].join(""),s&&(s.classList.toggle("hidden",!i),s.onclick=()=>je(t)),r&&(r.classList.toggle("hidden",!x),r.onclick=()=>{x&&(/^https?:\/\//i.test(x)?window.open(x,"_blank"):handleSmartDownload(x))})},je=t=>{const n=document.getElementById("credit-life-contract-modal"),e=document.getElementById("credit-life-contract-modal-body");if(!n||!e)return;const a=t?.offer_details||{},s=a.credit_life_signed_at?g(a.credit_life_signed_at):"Not signed",r=a.credit_life_contract_version||"v1",o=a.credit_life_contract_text||"No signed contract snapshot stored.",i=a.signature_data,l=a.credit_life_signature_data,c=(p,m)=>`
    <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p class="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 mb-2">${p}</p>
      ${m?`<img src="${m}" alt="${p}" class="w-full h-56 object-contain rounded-xl border border-gray-200 bg-white">`:'<div class="w-full h-56 rounded-xl border border-dashed border-gray-300 bg-white flex items-center justify-center text-sm text-gray-400">No signature captured</div>'}
    </div>
  `;e.innerHTML=`
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p class="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 mb-2">Application</p>
        <p class="text-sm font-bold text-gray-900">${S(t?.id||"")}</p>
      </div>
      <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p class="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 mb-2">Signed At</p>
        <p class="text-sm font-bold text-gray-900">${S(s)}</p>
      </div>
      <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p class="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 mb-2">Version</p>
        <p class="text-sm font-bold text-gray-900">${S(r)}</p>
      </div>
    </div>
    <div class="rounded-3xl border border-gray-200 bg-white p-5 mb-6">
      <p class="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 mb-3">Contract Text</p>
      <div class="whitespace-pre-wrap text-sm leading-7 text-gray-700">${S(o)}</div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      ${c("Main Loan Signature",i)}
      ${c("Credit Life Signature",l)}
    </div>
  `,n.classList.remove("hidden"),n.classList.add("flex")},Z=()=>{const t=document.getElementById("credit-life-contract-modal");t&&(t.classList.add("hidden"),t.classList.remove("flex"))},Oe=async t=>{const n=document.getElementById("action-buttons-container");if(n)try{const{data:e}=await J(t.id),{data:a}=await Y();if(!e||e.length===0){n.innerHTML=`
        <div class="p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-center">
          <p class="text-sm font-bold text-yellow-800">Disbursement Not Found</p>
        </div>
      `;return}const s=e[0];let r="";s.payout_method==="cashsend"&&s.cashsend_fee&&(r=`
        <div class="rounded-lg bg-orange-50 border border-orange-200 p-3 mt-3">
          <p class="text-xs font-bold text-orange-700 uppercase mb-2">CashSend Fees</p>
          <p class="text-sm text-orange-800">R${s.cashsend_fee.toFixed(2)}</p>
        </div>
      `),n.innerHTML=`
      <div class="space-y-3">
        <div class="p-4 bg-green-50 border border-green-100 rounded-xl">
          <p class="text-xs font-bold text-green-700 uppercase mb-2">Disbursement Details</p>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-xs text-green-600">Amount</p>
              <p class="font-bold text-green-900">R${s.amount.toFixed(2)}</p>
            </div>
            <div>
              <p class="text-xs text-green-600">Payout Method</p>
              <p class="font-bold text-green-900 capitalize">${s.payout_method}</p>
            </div>
            <div>
              <p class="text-xs text-green-600">Status</p>
              <p class="font-bold text-green-900 capitalize">${s.status}</p>
            </div>
            <div>
              <p class="text-xs text-green-600">Date</p>
              <p class="font-bold text-green-900">${g(s.created_at)}</p>
            </div>
          </div>
        </div>
        ${r}
        <button onclick="handleDisbursementExport(${t.id})" class="w-full py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors">
          <i class="fa-solid fa-file-csv mr-2"></i> Export CSV
        </button>
      </div>
    `}catch(e){console.error("Error rendering disbursement section:",e),n.innerHTML='<div class="p-4 bg-red-50 border border-red-100 rounded-xl text-center"><p class="text-sm font-bold text-red-800">Error loading disbursement</p></div>'}},j=t=>{if(!t)return;const n=t.status||"pending",e=document.getElementById("sidebar-status"),a=document.getElementById("status-alert"),s=document.getElementById("action-buttons-container"),r=parseFloat(t.offer_principal||t.amount||0),o=parseInt(t.term_months||1),i=parseFloat(t.offer_total_interest||0),l=parseFloat(t.offer_total_initiation_fees||0),c=parseFloat(t.offer_total_admin_fees||0),p=parseFloat(t.offer_details?.credit_life_total||t.offer_credit_life_total||0),m=parseFloat(t.offer_total_repayment||0),x=parseFloat(t.offer_monthly_repayment||0),L=parseFloat(t.offer_interest_rate||0),w=t.repayment_start_date||t.offer_details?.first_payment_date;document.getElementById("sidebar-amount").textContent=f(r),document.getElementById("sidebar-term").textContent=`${o} Month${o>1?"s":""}`,document.getElementById("sidebar-payment").textContent=f(x);let v=document.getElementById("financial-breakdown");if(!v){const E=document.getElementById("sidebar-payment").parentElement.parentElement;v=document.createElement("div"),v.id="financial-breakdown",v.className="pt-4 border-t border-gray-100 space-y-4",E.after(v)}v.innerHTML=`
    <div class="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div class="flex justify-between items-center text-xs">
            <span class="text-gray-500">Tiered Interest (${(L*100).toFixed(1)}%)</span>
            <span class="font-bold text-gray-900">${f(i)}</span>
        </div>
        <div class="flex justify-between items-center text-xs">
            <span class="text-gray-500">Initiation Fee</span>
            <span class="font-bold text-gray-900">${f(l)}</span>
        </div>
        <div class="flex justify-between items-center text-xs">
            <span class="text-gray-500">Monthly Service Fee</span>
            <span class="font-bold text-gray-900">${f(c)}</span>
        </div>
        <div class="flex justify-between items-center text-xs">
            <span class="text-gray-500">Credit Life Insurance</span>
            <span class="font-bold text-gray-900">${f(p)}</span>
        </div>
        <div class="pt-2 border-t border-gray-200 flex justify-between items-center">
            <span class="text-xs font-black uppercase text-gray-700">Total Repayable</span>
            <span class="text-sm font-black text-green-600">${f(m)}</span>
        </div>
    </div>
    
    <div class="mt-4">
      <label class="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 block">Scheduled Payout Info</label>
      <div class="p-3 bg-orange-50 border border-orange-100 rounded-xl transition-all">
        <div class="flex items-center justify-between">
          <span class="text-xs text-orange-800 font-medium">First Repayment:</span>
          <span class="text-xs font-bold text-orange-900">
            ${w?g(w):"Not Scheduled"}
          </span>
        </div>
      </div>
    </div>

    <div class="mt-4">
      <label class="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 block">Admin Override: Loan Term</label>
      <div class="flex gap-2 items-end">
        <div class="flex-1">
          <input
            type="number"
            id="admin-loan-term-override"
            min="1"
            max="36"
            value="${o}"
            class="w-full px-3 py-2 border border-blue-300 rounded-lg bg-blue-50 text-sm font-bold"
            placeholder="Months"
          />
          <small class="text-blue-600 mt-1 block">Leave loan term open for admin review</small>
        </div>
        <button
          type="button"
          id="admin-update-loan-term-btn"
          class="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
          onclick="handleAdminLoanTermOverride(${t.id})"
        >
          <i class="fa-solid fa-check"></i> Set
        </button>
      </div>
    </div>
  `,e&&(e.textContent=n.replace("_"," "),e.className=`mt-2 text-lg font-bold uppercase tracking-wide ${U(n).split(" ")[0].replace("bg-","text-").replace("-100","-600")}`);const _=document.getElementById("status-override-select"),y=document.getElementById("manual-update-btn"),D=document.getElementById("override-hint");if(n==="DISBURSED"?(_&&(_.disabled=!0),y&&(y.disabled=!0,y.classList.add("opacity-50","cursor-not-allowed"),y.innerText="Locked"),D&&(D.textContent="🔒 Application is active. Modifications disabled.")):(_&&(_.disabled=!1,_.value=n),y&&(y.disabled=!1,y.innerText="Update")),a&&(a.className="mt-3 p-3 rounded-lg text-xs font-medium leading-relaxed hidden",n==="OFFERED"?(a.textContent="Contract Sent. Waiting for user to sign.",a.classList.add("bg-purple-50","text-purple-700","block")):n==="APPROVED"&&(a.textContent="Application is queued for disbursement.",a.classList.add("bg-green-50","text-green-700","block"))),s){if(s.innerHTML="",["BUREAU_OK","BANK_LINKING","STARTED","AFFORD_REFER","BUREAU_REFER"].includes(n)){const E=n==="AFFORD_REFER"||n==="BUREAU_REFER"?'<div class="p-3 bg-orange-50 border border-orange-100 rounded-lg mb-3 text-xs text-orange-700 font-bold"><i class="fa-solid fa-circle-exclamation mr-1"></i> Currently Under Manual Review</div>':"";s.innerHTML=`
            ${E}
            <h4 class="text-xs font-bold text-gray-400 uppercase mb-2">Assessment</h4>
            <button onclick="updateStatus('AFFORD_OK')" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl mb-2 shadow-lg"><i class="fa-solid fa-check-circle mr-2"></i> Confirm Affordability</button>
            ${n.includes("REFER")?"":`<button onclick="updateStatus('AFFORD_REFER')" class="w-full py-3 bg-white border border-orange-200 text-orange-600 text-sm font-bold rounded-xl mb-2"><i class="fa-solid fa-magnifying-glass mr-2"></i> Refer</button>`}
            
            <button onclick="openModal('Decline', 'Are you sure you want to decline this application?', declineApplication)" class="w-full py-3 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-xl">
                <i class="fa-solid fa-xmark mr-2"></i> Decline
            </button>
          `}else if(n==="AFFORD_OK")s.innerHTML=`
            <div class="p-3 bg-blue-50 border border-blue-100 rounded-lg mb-3 text-xs text-blue-700">Client passed assessment. Ready for Contract.</div>
            <button id="action-send-contract" class="w-full py-3 bg-brand-accent hover:bg-brand-accent-hover text-white text-sm font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"><i class="fa-solid fa-paper-plane"></i> Send Contract</button>
            <button id="action-preview-contract" class="w-full py-3 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"><i class="fa-solid fa-eye"></i> Preview Template</button>
          `,document.getElementById("action-send-contract")?.addEventListener("click",E=>ve(E.currentTarget)),document.getElementById("action-preview-contract")?.addEventListener("click",ye);else if(n==="OFFER_ACCEPTED")s.innerHTML=`
             <div class="p-3 bg-purple-50 border border-purple-100 rounded-lg mb-3 text-xs text-purple-700"><i class="fa-solid fa-signature mr-1"></i> Client Signed.</div>
             <button id="btn-approve-contract" class="w-full py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-lg"><i class="fa-solid fa-file-signature mr-2"></i> Approve & Queue Payout</button>
          `,document.getElementById("btn-approve-contract").onclick=()=>Le("Approve","Mark contract as valid and ready for payout?",De);else if(n==="APPROVED")Oe(d);else if(n==="DISBURSED")s.innerHTML='<div class="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center"><p class="text-sm font-bold text-gray-600">Loan Active / Completed</p></div>';else if(n==="IN_ARREARS")s.innerHTML=`
            <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-xl mb-3 text-xs text-yellow-800 font-bold">
              <i class="fa-solid fa-triangle-exclamation mr-1"></i> Account In Arrears — follow up required
            </div>
            <button onclick="window.open('/api/letters-of-demand/${t.id}', '_blank')"
              class="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2">
              <i class="fa-solid fa-file-lines"></i> Generate Letter of Demand
            </button>`;else if(n==="IN_DEFAULT"){const W=(parseFloat(t.offer_principal||t.amount||0)*.03).toLocaleString("en-ZA",{minimumFractionDigits:2});s.innerHTML=`
            <div class="p-3 bg-red-50 border border-red-200 rounded-xl mb-3 text-xs text-red-800 font-bold">
              <i class="fa-solid fa-circle-exclamation mr-1"></i> IN DEFAULT — 3% interest applies
              <div class="font-normal mt-1 text-red-700">Default interest: R ${W}</div>
            </div>
            <button onclick="window.open('/api/letters-of-demand/${t.id}', '_blank')"
              class="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 mb-2">
              <i class="fa-solid fa-file-lines"></i> Generate Letter of Demand
            </button>
            <button onclick="updateStatus('ACTIVE')"
              class="w-full py-3 bg-white border border-green-200 text-green-700 text-sm font-bold rounded-xl flex items-center justify-center gap-2">
              <i class="fa-solid fa-check"></i> Mark Payment Received
            </button>`}}},Me=t=>{if(!t)return;document.getElementById("applicant-name-header").textContent=t.profiles?.full_name||"Unknown";const n=t.profiles||{},e=n.client_number?String(n.client_number):"",a=t.loan_number?`L${String(t.loan_number).padStart(4,"0")}`:"",s=e&&a?`${e}-${a}`:a||t.id.slice(0,8).toUpperCase(),r=t.agreement_number||s;document.getElementById("header-id-val").textContent=s,document.getElementById("header-date").textContent=g(t.created_at),document.getElementById("detail-app-id").textContent=r,document.getElementById("detail-date").textContent=g(t.created_at),document.getElementById("detail-purpose").textContent=t.loan_purpose||t.purpose||"Personal Loan",document.getElementById("detail-notes").value=t.notes||"";const o=document.getElementById("header-status-badge");o&&(o.textContent=t.status,o.className=`px-4 py-1.5 text-sm font-bold rounded-full shadow-sm ${U(t.status)}`)};window.saveEmployerDetails=async function(){if(!d?.user_id)return;const t=document.getElementById("employer-name-input")?.value.trim(),n=document.getElementById("employer-phone-input")?.value.trim(),e=document.getElementById("employer-address-input")?.value.trim(),a=document.getElementById("btn-save-employer");a.textContent="Saving…",a.disabled=!0;try{const{error:s}=await b.from("profiles").update({employer_name:t||null,employer_phone:n||null,employer_address:e||null}).eq("id",d.user_id);if(s)throw s;u("Employer details saved.","success")}catch(s){u(s.message,"error")}finally{a.textContent="Save Details",a.disabled=!1}};window.toggleEmployerVerified=async function(){if(!d?.user_id)return;const t=document.getElementById("employer-verified-badge"),n=document.getElementById("employer-verified-note"),e=document.getElementById("btn-verify-employer"),s=!(t?.textContent==="Verified"),{data:{session:r}}=await b.auth.getSession(),{data:o}=r?await b.from("profiles").select("full_name").eq("id",r.user.id).maybeSingle():{data:null},{error:i}=await b.from("profiles").update({employer_verified:s,employer_verified_at:s?new Date().toISOString():null,employer_verified_by:s?o?.full_name||r?.user?.email||"Admin":null}).eq("id",d.user_id);if(i){u(i.message,"error");return}t&&(t.textContent=s?"Verified":"Unverified",t.className=`px-2 py-1 rounded-full text-xs font-bold ${s?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`),e&&(e.textContent=s?"Revoke Verification":"Mark Verified"),n&&(n.textContent=s?`Verified by ${o?.full_name||"Admin"} on ${new Date().toLocaleDateString("en-ZA")}`:"",n.classList.toggle("hidden",!s)),u(s?"Employer verified.":"Verification revoked.","success")};function Pe(t){const n=document.getElementById("employer-name-input"),e=document.getElementById("employer-phone-input"),a=document.getElementById("employer-address-input"),s=document.getElementById("employer-verified-badge"),r=document.getElementById("employer-verified-note"),o=document.getElementById("btn-verify-employer");n&&(n.value=t?.employer_name||""),e&&(e.value=t?.employer_phone||""),a&&(a.value=t?.employer_address||"");const i=t?.employer_verified===!0;s&&(s.textContent=i?"Verified":"Unverified",s.className=`px-2 py-1 rounded-full text-xs font-bold ${i?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`),o&&(o.textContent=i?"Revoke Verification":"Mark Verified"),r&&i&&t.employer_verified_at&&(r.textContent=`Verified by ${t.employer_verified_by||"Admin"} on ${new Date(t.employer_verified_at).toLocaleDateString("en-ZA")}`,r.classList.remove("hidden"))}window.saveClientCap=async function(){if(!d?.user_id)return;const t=document.getElementById("credit-cap-input")?.value,n=document.getElementById("credit-cap-note")?.value.trim(),e=t?parseFloat(t):null,{error:a}=await b.from("profiles").update({credit_limit_override:e,credit_limit_note:n||null}).eq("id",d.user_id);if(a){u(a.message,"error");return}const s=document.getElementById("credit-cap-current");s&&(s.textContent=e?`Current cap: R${e.toLocaleString("en-ZA")} — ${n||""}`:"No cap set — using standard band rules."),u(e?`Credit cap set to R${e.toLocaleString("en-ZA")}.`:"Credit cap removed.","success"),await b.from("audit_log").insert([{entity_type:"profile",entity_id:d.user_id,action:"credit_cap_set",new_value:{cap:e,note:n},description:e?`Credit cap set to R${e.toLocaleString("en-ZA")}`:"Credit cap removed"}]).catch(()=>{})};function Ue(t){const n=document.getElementById("credit-cap-input"),e=document.getElementById("credit-cap-note"),a=document.getElementById("credit-cap-current");n&&t?.credit_limit_override&&(n.value=t.credit_limit_override),e&&t?.credit_limit_note&&(e.value=t.credit_limit_note),a&&(a.textContent=t?.credit_limit_override?`Current cap: R${Number(t.credit_limit_override).toLocaleString("en-ZA")}${t.credit_limit_note?" — "+t.credit_limit_note:""}`:"No cap set — using standard band rules.")}let T=[];async function Q(t){try{T=(await(await fetch(`/api/audit-log/loan_application/${t}`)).json()).data||[],He()}catch(n){console.warn("[audit-trail]",n.message)}}function He(){const t=document.getElementById("audit-trail-list");if(!t)return;if(!T.length){t.innerHTML='<div class="text-center py-8 text-sm text-gray-400">No audit entries yet. Changes will appear here.</div>';return}const n={status_change:{icon:"swap_horiz",color:"#3b82f6"},field_update:{icon:"edit",color:"#f59e0b"},created:{icon:"add_circle",color:"#10b981"},viewed:{icon:"visibility",color:"#8b5cf6"},default:{icon:"history",color:"#6b7280"}};t.innerHTML=T.map(e=>{const a=n[e.action]||n.default,s=new Date(e.created_at),r=s.toLocaleDateString("en-ZA",{day:"numeric",month:"short",year:"numeric"}),o=s.toLocaleTimeString("en-ZA",{hour:"2-digit",minute:"2-digit"});let i="";return e.action==="status_change"&&e.old_value?.status&&e.new_value?.status?i=`<span class="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">${e.old_value.status}</span>
                      <span class="text-gray-400 mx-1">→</span>
                      <span class="font-mono text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">${e.new_value.status}</span>`:e.description&&(i=`<span class="text-xs text-gray-500">${e.description}</span>`),`
        <div class="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
          <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
               style="background:${a.color}18">
            <span class="material-symbols-outlined text-[16px]" style="color:${a.color}">${a.icon}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-semibold text-gray-800">${e.performed_by_name||"System"}</span>
              <span class="text-xs text-gray-400">${e.action.replace(/_/g," ")}</span>
              ${i}
            </div>
            <div class="text-xs text-gray-400 mt-1">${r} at ${o}</div>
          </div>
        </div>`}).join("")}window.exportAuditTrail=function(){if(!T.length){alert("No audit entries to export.");return}const t=["Date","Time","Action","Description","Old Value","New Value","Performed By"],n=T.map(o=>{const i=new Date(o.created_at);return[i.toLocaleDateString("en-ZA"),i.toLocaleTimeString("en-ZA"),o.action,`"${(o.description||"").replace(/"/g,'""')}"`,o.old_value?JSON.stringify(o.old_value):"",o.new_value?JSON.stringify(o.new_value):"",o.performed_by_name||"System"].join(",")}),e=[t.join(","),...n].join(`
`),a=new Blob([e],{type:"text/csv;charset=utf-8;"}),s=URL.createObjectURL(a),r=document.createElement("a");r.href=s,r.download=`audit_trail_${new Date().toISOString().slice(0,10)}.csv`,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(s)};const h=async()=>{const n=new URLSearchParams(window.location.search).get("id");if(n)try{const e=await te(n);d=e,O(),document.getElementById("contract-declined-banner")?.remove(),Me(e),Ie(e.profiles||{},e.bank_accounts),await Be(e.user_id),Ae(e.financial_profiles,e.credit_checks),Te(e.documents,e.truid_info,e.kyc_info),await Ne(e.loan_history,e.application_history,e),Fe(e),Q(n),j(e),$e(e),await ge(),document.getElementById("loading-state")?.classList.add("hidden"),document.getElementById("content-grid")?.classList.remove("hidden"),document.getElementById("page-header")?.classList.remove("hidden")}catch(e){console.error("Integration Error:",e),u("Failed to load full application data.","error")}};window.handleAdminLoanTermOverride=async t=>{const n=document.getElementById("admin-loan-term-override"),e=parseInt(n.value);if(!e||e<1||e>36){u("Please enter a valid loan term (1-36 months)","error");return}try{const{data:a,error:s}=await b.from("loan_applications").update({term_months:e}).eq("id",t).select();if(s)throw s;u(`✅ Loan term updated to ${e} month${e>1?"s":""}`,"success"),await h()}catch(a){console.error("Error updating loan term:",a),u(`❌ Error: ${a.message}`,"error")}};window.handleDisbursementExport=async t=>{try{const n=await fetch("/api/disbursements/payout-csv",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({applicationIds:[t],method:"all"})});if(!n.ok){const r=await n.json();u(r.error||"Failed to generate CSV","error");return}const e=await n.blob(),a=URL.createObjectURL(e),s=document.createElement("a");s.href=a,s.download=`disbursement-${t}-${new Date().toISOString().slice(0,10)}.csv`,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(a),u("Disbursement CSV exported successfully","success")}catch(n){console.error("Error exporting CSV:",n),u(n.message||"Failed to export CSV","error")}};document.addEventListener("DOMContentLoaded",async()=>{await X();let t=document.getElementById("main-content");t||(t=document.createElement("main"),t.id="main-content",t.className="flex-1 p-6 pt-24",document.getElementById("app-shell").appendChild(t)),t.innerHTML=xe,ke(),await h(),document.getElementById("btn-save-notes")?.addEventListener("click",saveNotes);const n=document.getElementById("modal-confirm-btn"),e=document.getElementById("modal-cancel-btn");n&&n.addEventListener("click",()=>{typeof F=="function"&&F()}),e&&e.addEventListener("click",k),document.getElementById("credit-life-contract-modal-close")?.addEventListener("click",Z),document.getElementById("credit-life-contract-modal")?.addEventListener("click",a=>{a.target?.id==="credit-life-contract-modal"&&Z()})});
