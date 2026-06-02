import"./supabaseClient-WTCtVqgB.js";/* empty css              *//* empty css               */import{i as b}from"./layout-DLkpXMPI.js";import"https://esm.sh/@supabase/supabase-js@2";import"./theme-CeTh6-N5.js";let r=[],i=null,u=[],p=[],d=null;document.addEventListener("DOMContentLoaded",async()=>{await b(),await f(),o()});async function f(){r=(await(await fetch("/api/organizations")).json()).data||[],r.length&&(i=r[0].id)}async function y(){if(!i)return;const t=await(await fetch(`/api/credit-rules/${i}`)).json();u=t.bands||[],p=t.rules||[]}async function o(){await y();const a=document.getElementById("app-shell"),t=a.querySelector("main")||a,n=t.querySelector("#cr-content")||(()=>{const e=document.createElement("div");return e.id="cr-content",e.className="p-6 max-w-6xl mx-auto",t.appendChild(e),e})();n.innerHTML=`
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Credit Rules</h1>
          <p class="text-sm text-gray-500 mt-1">Configure per-client score bands and eligibility criteria</p>
        </div>
        ${r.length>1?`
        <select id="orgSelector" onchange="switchOrg(this.value)"
          class="border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium bg-white shadow-sm focus:ring-2 focus:ring-orange-400 focus:outline-none">
          ${r.map(e=>`<option value="${e.id}" ${e.id===i?"selected":""}>${e.name}</option>`).join("")}
        </select>`:`<span class="text-sm font-semibold text-gray-700">${r[0]?.name||""}</span>`}
      </div>

      <!-- Score Bands -->
      <section class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <i class="fas fa-layer-group text-orange-500 text-sm"></i>
            </div>
            <div>
              <h2 class="font-semibold text-gray-900">Credit Score Bands</h2>
              <p class="text-xs text-gray-400">Define risk levels, max loan amounts and interest rates per score range</p>
            </div>
          </div>
          <button onclick="openBandModal()"
            class="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            <i class="fas fa-plus text-xs"></i> Add Band
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                <th class="px-6 py-3 text-left">Band</th>
                <th class="px-6 py-3 text-left">Score Range</th>
                <th class="px-6 py-3 text-left">Risk</th>
                <th class="px-6 py-3 text-right">Max Loan</th>
                <th class="px-6 py-3 text-right">Rate (p.a.)</th>
                <th class="px-6 py-3 text-right">Max Term</th>
                <th class="px-6 py-3 text-center">Decision</th>
                <th class="px-6 py-3 text-center">1st Loan Term</th>
                <th class="px-6 py-3 text-center">Active</th>
                <th class="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              ${u.map(e=>`
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                  <span class="inline-flex items-center gap-2 font-semibold text-gray-800">
                    <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:${e.color}"></span>
                    ${e.label}
                  </span>
                </td>
                <td class="px-6 py-4 text-gray-600 font-mono text-xs">${e.min_score} – ${e.max_score}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide"
                    style="background:${e.color}20;color:${e.color}">
                    ${e.risk_level}
                  </span>
                </td>
                <td class="px-6 py-4 text-right font-semibold text-gray-800">R ${Number(e.max_loan_amount).toLocaleString()}</td>
                <td class="px-6 py-4 text-right text-gray-600">${e.interest_rate_pa}%</td>
                <td class="px-6 py-4 text-right text-gray-600">${e.max_term_months} mo</td>
                <td class="px-6 py-4 text-center">
                  <span class="px-2 py-1 rounded-lg text-xs font-bold uppercase ${e.auto_decision==="approve"?"bg-green-50 text-green-700":e.auto_decision==="decline"?"bg-red-50 text-red-600":"bg-yellow-50 text-yellow-700"}">
                    ${e.auto_decision}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  ${e.first_loan_max_term_months?`<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                        <i class="fas fa-star text-xs"></i> ${e.first_loan_max_term_months} mo
                       </span>`:'<span class="text-gray-300 text-xs">—</span>'}
                </td>
                <td class="px-6 py-4 text-center">
                  <button onclick="toggleBand('${e.id}', ${!e.is_active})"
                    class="relative w-10 h-6 rounded-full transition-colors duration-200 ${e.is_active?"bg-orange-500":"bg-gray-200"}">
                    <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${e.is_active?"translate-x-4":""}"></span>
                  </button>
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button onclick="openBandModal('${e.id}')"
                      class="w-8 h-8 rounded-lg bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-500 transition-colors flex items-center justify-center">
                      <i class="fas fa-pen text-xs"></i>
                    </button>
                    <button onclick="deleteBand('${e.id}')"
                      class="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 transition-colors flex items-center justify-center">
                      <i class="fas fa-trash text-xs"></i>
                    </button>
                  </div>
                </td>
              </tr>`).join("")}
            </tbody>
          </table>
          ${u.length?"":'<div class="text-center py-12 text-gray-400">No bands configured yet. <button onclick="openBandModal()" class="text-orange-500 font-semibold">Add your first band</button>.</div>'}
        </div>
      </section>

      <!-- Eligibility Rules -->
      <section class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div class="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
            <i class="fas fa-shield-check text-purple-500 text-sm"></i>
          </div>
          <div>
            <h2 class="font-semibold text-gray-900">Eligibility Rules</h2>
            <p class="text-xs text-gray-400">Hard pass/fail criteria checked before score bands</p>
          </div>
        </div>

        <div class="divide-y divide-gray-50">
          ${p.map(e=>`
          <div class="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
            <button onclick="toggleRule('${e.id}', ${!e.is_active})"
              class="mt-0.5 relative w-10 h-6 flex-shrink-0 rounded-full transition-colors duration-200 ${e.is_active?"bg-orange-500":"bg-gray-200"}">
              <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${e.is_active?"translate-x-4":""}"></span>
            </button>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 flex-wrap">
                <span class="font-semibold text-gray-900 ${e.is_active?"":"opacity-40"}">${e.rule_label}</span>
                ${e.threshold_value?`
                <span class="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">
                  ${e.operator==="gte"?"≥":e.operator==="lte"?"≤":"="} ${e.threshold_value}${e.rule_key.includes("pct")?"%":(e.rule_key.includes("income")||e.rule_key.includes("amount"),"")}
                </span>`:""}
                <span class="text-xs font-bold px-2 py-0.5 rounded-lg ${e.fail_action==="decline"?"bg-red-50 text-red-600":"bg-yellow-50 text-yellow-700"}">
                  Fail → ${e.fail_action.toUpperCase()}
                </span>
              </div>
              ${e.description?`<p class="text-xs text-gray-400 mt-0.5">${e.description}</p>`:""}
              ${e.decline_reason?`<p class="text-xs text-gray-500 mt-1 italic">"${e.decline_reason}"</p>`:""}
            </div>
            <button onclick="openRuleEditor('${e.id}')"
              class="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-400 transition-all flex items-center justify-center flex-shrink-0">
              <i class="fas fa-pen text-xs"></i>
            </button>
          </div>`).join("")}
        </div>
      </section>

      <!-- Band Modal -->
      <div id="bandModal" class="hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-gray-900" id="bandModalTitle">Add Score Band</h3>
            <button onclick="closeBandModal()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">
              <i class="fas fa-times text-xs"></i>
            </button>
          </div>
          <form id="bandForm" onsubmit="saveBand(event)" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Band Label</label>
                <input name="label" required placeholder="e.g. Excellent"
                  class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Min Score</label>
                <input name="min_score" type="number" min="0" max="999" required placeholder="300"
                  class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Max Score</label>
                <input name="max_score" type="number" min="0" max="999" required placeholder="999"
                  class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Risk Level</label>
                <select name="risk_level" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-white">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Auto Decision</label>
                <select name="auto_decision" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-white">
                  <option value="approve">Approve</option>
                  <option value="review">Manual Review</option>
                  <option value="decline">Decline</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Max Loan Amount (R)</label>
                <input name="max_loan_amount" type="number" min="0" step="500" placeholder="10000"
                  class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Interest Rate p.a. (%)</label>
                <input name="interest_rate_pa" type="number" min="0" max="100" step="0.5" placeholder="22.00"
                  class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Max Term (months)</label>
                <input name="max_term_months" type="number" min="1" max="84" placeholder="12"
                  class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Monthly Service Fee (R)</label>
                <input name="monthly_service_fee" type="number" min="0" step="5" placeholder="69"
                  class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Band Colour</label>
                <div class="flex items-center gap-2">
                  <input name="color" type="color" value="#10b981"
                    class="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5">
                  <span class="text-xs text-gray-400">Shown in UI badges</span>
                </div>
              </div>
              <div class="col-span-2 border-t border-gray-100 pt-4">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-star text-blue-500 text-xs"></i>
                  </div>
                  <span class="text-xs font-semibold text-gray-700 uppercase tracking-wide">First Loan Restrictions</span>
                </div>
                <div class="bg-blue-50 rounded-xl p-4 space-y-3">
                  <div>
                    <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Max Term — First Loan Only (months)
                    </label>
                    <input name="first_loan_max_term_months" type="number" min="1" max="24" placeholder="1"
                      class="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-white">
                    <p class="text-xs text-gray-400 mt-1.5">
                      Leave blank to allow full term from day one. Set to <strong>1</strong> to require first-time borrowers repay within 1 month before longer terms unlock.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" onclick="closeBandModal()"
                class="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                Cancel
              </button>
              <button type="submit" id="bandSaveBtn"
                class="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                Save Band
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Rule Editor Modal -->
      <div id="ruleModal" class="hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-gray-900">Edit Rule</h3>
            <button onclick="closeRuleModal()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">
              <i class="fas fa-times text-xs"></i>
            </button>
          </div>
          <form id="ruleForm" onsubmit="saveRule(event)" class="space-y-4">
            <input type="hidden" name="rule_id">
            <div>
              <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Rule</label>
              <input name="rule_label" readonly class="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-500">
            </div>
            <div id="thresholdGroup">
              <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Threshold Value</label>
              <input name="threshold_value"
                class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">If Fails</label>
              <select name="fail_action" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-white">
                <option value="decline">Decline immediately</option>
                <option value="review">Send to manual review</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Message shown to applicant</label>
              <textarea name="decline_reason" rows="2" placeholder="Reason displayed to the borrower..."
                class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none resize-none"></textarea>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" onclick="closeRuleModal()"
                class="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                Cancel
              </button>
              <button type="submit"
                class="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                Save Rule
              </button>
            </div>
          </form>
        </div>
      </div>
    `,window.switchOrg=h,window.openBandModal=v,window.closeBandModal=g,window.saveBand=w,window.deleteBand=_,window.toggleBand=k,window.toggleRule=$,window.openRuleEditor=B,window.closeRuleModal=m,window.saveRule=M}async function h(a){i=a,await o()}function v(a=null){d=a;const t=document.getElementById("bandModal"),n=document.getElementById("bandForm"),e=document.getElementById("bandModalTitle");if(n.reset(),a){const s=u.find(c=>c.id===a);s&&(e.textContent="Edit Score Band",Object.entries(s).forEach(([c,l])=>{const x=n.elements[c];x&&l!==null&&l!==void 0&&(x.value=l)}))}else e.textContent="Add Score Band";t.classList.remove("hidden")}function g(){document.getElementById("bandModal").classList.add("hidden"),d=null}async function w(a){a.preventDefault();const t=document.getElementById("bandSaveBtn"),n=a.target,e=Object.fromEntries(new FormData(n));e.organization_id=i,e.min_score=parseInt(e.min_score),e.max_score=parseInt(e.max_score),e.max_loan_amount=parseFloat(e.max_loan_amount||0),e.interest_rate_pa=parseFloat(e.interest_rate_pa||0),e.max_term_months=parseInt(e.max_term_months||12),e.monthly_service_fee=parseFloat(e.monthly_service_fee||0),e.first_loan_max_term_months=e.first_loan_max_term_months?parseInt(e.first_loan_max_term_months):null,t.textContent="Saving…",t.disabled=!0;try{const s=d?`/api/credit-bands/${d}`:"/api/credit-bands",l=await fetch(s,{method:d?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!l.ok)throw new Error(await l.text());g(),await o()}catch(s){alert("Error saving band: "+s.message)}finally{t.textContent="Save Band",t.disabled=!1}}async function _(a){confirm("Delete this score band? This cannot be undone.")&&(await fetch(`/api/credit-bands/${a}`,{method:"DELETE"}),await o())}async function k(a,t){await fetch(`/api/credit-bands/${a}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({is_active:t})}),await o()}async function $(a,t){await fetch(`/api/eligibility-rules/${a}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({is_active:t})}),await o()}function B(a){const t=p.find(s=>s.id===a);if(!t)return;const n=document.getElementById("ruleModal"),e=document.getElementById("ruleForm");e.elements.rule_id.value=t.id,e.elements.rule_label.value=t.rule_label,e.elements.threshold_value.value=t.threshold_value||"",e.elements.fail_action.value=t.fail_action,e.elements.decline_reason.value=t.decline_reason||"",document.getElementById("thresholdGroup").style.display=["is_true","is_false"].includes(t.operator)?"none":"block",n.classList.remove("hidden")}function m(){document.getElementById("ruleModal").classList.add("hidden")}async function M(a){a.preventDefault();const t=a.target,n=t.elements.rule_id.value,e={threshold_value:t.elements.threshold_value.value,fail_action:t.elements.fail_action.value,decline_reason:t.elements.decline_reason.value};if(!(await fetch(`/api/eligibility-rules/${n}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)})).ok){alert("Save failed");return}m(),await o()}
