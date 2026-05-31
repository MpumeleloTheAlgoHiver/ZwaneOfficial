import{supabase as k}from"./supabaseClient-WTCtVqgB.js";/* empty css              *//* empty css               */import{i as W,g as j}from"./layout-BuEx1KZr.js";import{f as y,a as z}from"./utils-CZwHw4kl.js";import{f as B,a as $,b as Y,c as U,d as H,e as K}from"./dataService-P9YE594z.js";import"https://esm.sh/@supabase/supabase-js@2";import"./theme-BmY-8nnP.js";let _=!1;async function q(){if(!_){_=!0;try{const{data:{session:e},error:r}=await k.auth.getSession();if(r||!e){console.log("🔒 Admin session invalid - redirecting to login"),window.location.replace("/auth/login.html");return}const n=["base_admin","admin","super_admin","owner"],a=(e.user?.app_metadata?.role||e.user?.user_metadata?.role||"").toLowerCase();let t=n.includes(a);if(!t){const{data:o,error:s}=await k.rpc("is_role_or_higher",{p_min_role:"base_admin"});!s&&o&&(t=!0)}if(!t){console.log("🔒 Not an admin - access denied. Role:",a),await k.auth.signOut(),window.location.replace("/auth/login.html");return}console.log("✅ Admin session validated")}catch(e){console.error("Admin session guard error:",e),window.location.replace("/auth/login.html")}finally{_=!1}}}q();const G={enabled:!0,easing:"easeinout",speed:900,animateGradually:{enabled:!0,delay:120},dynamicAnimation:{enabled:!0,speed:400}};function h(e){return e.chart||(e.chart={}),e.chart.animations={...G,...e.chart.animations||{}},e}const V=()=>new Promise((e,r)=>{if(window.ApexCharts)return e();const n=document.createElement("script");n.src="https://cdn.jsdelivr.net/npm/apexcharts",n.onload=e,n.onerror=r,document.head.appendChild(n)}),M="admin-dashboard-analytics-style",b=()=>{const e=getComputedStyle(document.documentElement),r=(e.getPropertyValue("--color-primary")||"#0ea5e9").trim()||"#0ea5e9",n=(e.getPropertyValue("--color-secondary")||"#f97316").trim()||"#f97316";return{primary:r,secondary:n}};async function X(){try{const e=await fetch("/api/suresystems/activation-status");if(!e.ok)throw new Error(`SureSystems status fetch failed (${e.status})`);return await e.json()}catch(e){return console.warn("SureSystems activation status unavailable:",e.message||e),null}}document.addEventListener("DOMContentLoaded",async()=>{try{await V()}catch(l){console.error("ApexCharts failed to load:",l);const d=document.getElementById("main-content");d&&(d.innerHTML='<div class="p-8 text-center text-red-600 font-semibold">Charts failed to load. Check your connection and refresh.</div>');return}if(!await W())return;const r=j(),n=document.getElementById("main-content");if(!document.getElementById(M)){const l=document.createElement("style");l.id=M,l.innerHTML=`
      @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
      @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.15); } }
      .analytics-card { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.25s cubic-bezier(0.4,0,0.2,1); position: relative; overflow: hidden; }
      .analytics-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: var(--color-primary); transform: translateY(-2px); }
      .analytics-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--color-primary, #0ea5e9), var(--color-secondary, #f97316)); opacity: 0; transition: opacity 0.25s; }
      .analytics-card:hover::before { opacity: 1; }
      .kpi-card { background: linear-gradient(135deg, var(--color-primary, #0ea5e9) 0%, var(--color-secondary, #f97316) 100%); border-radius: 12px; padding: 1.5rem; color: #fff; position: relative; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.12); transition: transform 0.25s ease, box-shadow 0.25s ease; }
      .kpi-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
      .kpi-card::after { content: ''; position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%); animation: shimmer 3s infinite; }
      .kpi-icon { width: 48px; height: 48px; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 1rem; }
      .kpi-value { font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1; margin-bottom: 0.5rem; }
      .kpi-label { font-size: 0.875rem; font-weight: 600; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.05em; }
      .kpi-trend { position: absolute; top: 1.5rem; right: 1.5rem; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.75rem; background: rgba(255,255,255,0.2); border-radius: 20px; backdrop-filter: blur(8px); }
      .section-header { border-bottom: 2px solid #f1f5f9; padding-bottom: 1rem; margin-bottom: 1.5rem; }
      .section-title { font-size: 1.125rem; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; }
      .section-subtitle { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem; }
      .tab-group { display: inline-flex; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2px; gap: 2px; }
      .tab-button { padding: 0.5rem 1rem; font-size: 0.8125rem; font-weight: 600; color: #64748b; border-radius: 6px; transition: all 0.2s; cursor: pointer; border: none; background: transparent; }
      .tab-button:hover { color: var(--color-primary, #0ea5e9); background: #ffffff; }
      .tab-button.active { background: #ffffff; color: var(--color-primary, #0ea5e9); box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
      .chart-wrapper { min-height: 350px; width: 100%; position: relative; }
      .status-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.8125rem; font-weight: 600; }
      .status-dot { width: 8px; height: 8px; border-radius: 50%; animation: pulse-dot 2s ease-in-out infinite; }
      .fade-in { animation: slideInUp 0.5s cubic-bezier(0.4,0,0.2,1) forwards; opacity: 0; }
      .delay-100 { animation-delay: 0.1s; } .delay-200 { animation-delay: 0.2s; } .delay-300 { animation-delay: 0.3s; } .delay-400 { animation-delay: 0.4s; }
    `,document.head.appendChild(l)}let a={text:"Operational",color:"#10b981"},t,o,s,c,u,i,p=null;try{[t,o,s,c,u,i,p]=await Promise.all([B().catch(()=>({financials:{},portfolioStatus:[]})),$().catch(()=>({data:[]})),Y().catch(()=>({data:[]})),U().catch(()=>({data:{}})),H().catch(()=>({data:null})),K().catch(()=>({data:[]})),X()])}catch(l){console.error("System Fetch Error:",l),a={text:"System Error",color:"#ef4444",dot:"bg-red-500"}}const f=t?.financials||{},m=o?.data||[],I=s?.data||[],P=i?.data||[],L=c?.data||{},g=u?.data||ie(m,I);b();const x=(()=>{if(!p?.configured)return{text:"SureSystems: Not Configured",color:"#f59e0b",dot:"bg-amber-500"};const l=Number(p?.recent?.failed||0),d=Number(p?.recent?.success||0),T=p?.recent?.lastAttemptAt,F=T?(Date.now()-new Date(T).getTime())/(1e3*60*60*24):999;return l>0&&d===0&&F<=7?{text:"SureSystems: Activation Errors",color:"#ef4444",dot:"bg-red-500"}:l>0&&d===0&&F>7?{text:"SureSystems: Connected",color:"#10b981",dot:"bg-emerald-500"}:{text:d>0?`SureSystems: ${d} mandates activated`:"SureSystems: Connected",color:"#10b981",dot:"bg-emerald-500"}})(),A=t?.financials?.pending_apps||0,O=new Date().toLocaleDateString("en-ZA",{weekday:"long",month:"long",day:"numeric",year:"numeric"});n.innerHTML=`
    <div class="max-w-[1600px] mx-auto p-10 space-y-10">

      <!-- Welcome Header -->
      <section class="flex flex-col md:flex-row md:items-end justify-between gap-6 fade-in">
        <div>
          <h2 class="font-headline text-3xl font-bold text-on-surface mb-1">Welcome back, ${r?.full_name?.split(" ")[0]||"Admin"}</h2>
          <p class="text-secondary flex items-center gap-2 text-sm">
            Your portfolio overview for <span class="font-semibold" style="color:var(--color-primary)">${O}</span>
          </p>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <div class="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest rounded-full border border-outline-variant/30 text-xs font-semibold">
            <span class="w-2 h-2 rounded-full animate-pulse" style="background:${a.color}"></span>
            <span style="color:${a.color}">${a.text}</span>
          </div>
          <div class="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest rounded-full border border-outline-variant/30 text-xs font-semibold">
            <span class="w-2 h-2 rounded-full" style="background:${x.color}"></span>
            <span style="color:${x.color}">${x.text}</span>
          </div>
          <button id="btn-export-dashboard" class="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant/30 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors">
            <span class="material-symbols-outlined text-[14px]">download</span> Export Dashboard
          </button>
        </div>
      </section>

      <!-- KPI Cards -->
      <section id="cards-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 fade-in delay-100"></section>

      <!-- Charts Row -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in delay-200">
        <div class="lg:col-span-2 glass-card p-8 rounded-2xl">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h4 class="font-headline font-bold text-on-surface">Cash Flow Velocity</h4>
              <p class="text-[11px] font-semibold uppercase tracking-widest text-outline mt-0.5">Disbursed vs. Collected</p>
            </div>
            <div id="tabs-velocity" class="tab-group"></div>
          </div>
          <div id="velocityChart" class="chart-wrapper"></div>
        </div>

        <div class="glass-card p-8 rounded-2xl">
          <div class="mb-6">
            <h4 class="font-headline font-bold text-on-surface">Portfolio Composition</h4>
            <p class="text-[11px] font-semibold uppercase tracking-widest text-outline mt-0.5">Loan Status Distribution</p>
          </div>
          <div id="donutChart" class="chart-wrapper" style="min-height:320px;"></div>
        </div>
      </section>

      <!-- Analytics Row -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in delay-300">
        <div class="glass-card p-8 rounded-2xl">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h4 class="font-headline font-bold text-on-surface">Vintage Analysis</h4>
              <p class="text-[11px] font-semibold uppercase tracking-widest text-outline mt-0.5">Recovery Rate by Cohort</p>
            </div>
            <div id="tabs-vintage" class="tab-group"></div>
          </div>
          <div id="vintageChart" class="chart-wrapper"></div>
        </div>

        <div class="glass-card p-8 rounded-2xl">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h4 class="font-headline font-bold text-on-surface">Risk vs. Affordability</h4>
              <p class="text-[11px] font-semibold uppercase tracking-widest text-outline mt-0.5">Credit Score vs. DTI Ratio</p>
            </div>
            <div class="flex items-center gap-3 text-[11px] font-semibold">
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-green-500"></span>Paid</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full" style="background:var(--color-primary)"></span>Active</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-500"></span>Default</span>
            </div>
          </div>
          <div id="riskChart" class="chart-wrapper"></div>
        </div>
      </section>

      <!-- Funnel -->
      <section class="glass-card p-8 rounded-2xl fade-in delay-400">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h4 class="font-headline font-bold text-on-surface">Conversion Funnel</h4>
            <p class="text-[11px] font-semibold uppercase tracking-widest text-outline mt-0.5">Application Pipeline · 4 Stages</p>
          </div>
          <div class="text-right">
            <div class="text-3xl font-bold text-on-surface font-headline">${g.funnel?.STARTED||0}</div>
            <div class="text-[11px] uppercase tracking-widest text-outline font-semibold">Total Starts</div>
          </div>
        </div>
        <div id="funnelChart" class="chart-wrapper" style="min-height:300px;"></div>
      </section>

      <!-- Historical Trends -->
      <section class="fade-in delay-400">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="font-headline text-xl font-bold text-on-surface">Historical Trends</h3>
            <p class="text-[11px] font-semibold uppercase tracking-widest text-outline mt-0.5">Long-term Performance Metrics</p>
          </div>
          <div id="tabs-trends" class="tab-group"></div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="lg:col-span-2 glass-card p-8 rounded-2xl">
            <h4 class="font-headline font-bold text-on-surface mb-1">Portfolio Growth</h4>
            <p class="text-[11px] font-semibold uppercase tracking-widest text-outline mb-6">Principal vs Interest Over Time</p>
            <div id="comboChart" class="chart-wrapper"></div>
          </div>
          <div class="glass-card p-8 rounded-2xl">
            <h4 class="font-headline font-bold text-on-surface mb-1">Performance Targets</h4>
            <p class="text-[11px] font-semibold uppercase tracking-widest text-outline mb-6">Key Health Indicators</p>
            <div id="radialChart" class="chart-wrapper" style="min-height:320px;"></div>
          </div>
          <div class="glass-card p-8 rounded-2xl">
            <h4 class="font-headline font-bold text-on-surface mb-1">Revenue Trajectory</h4>
            <p class="text-[11px] font-semibold uppercase tracking-widest text-outline mb-6">Total Exposure Growth</p>
            <div id="growthChart" class="chart-wrapper" style="min-height:320px;"></div>
          </div>
        </div>
      </section>

      <!-- Bottom Banner -->
      ${A>0?`
      <section class="glass-card p-6 rounded-2xl border-l-4 flex items-center justify-between fade-in" style="border-color:var(--color-primary)">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-full" style="background:color-mix(in srgb, var(--color-primary) 10%, transparent)">
            <span class="material-symbols-outlined" style="color:var(--color-primary)">notification_important</span>
          </div>
          <div>
            <h5 class="font-bold text-on-surface">${A} application${A>1?"s":""} pending review</h5>
            <p class="text-secondary text-sm">${x.text}. Complete setup to automate disbursements.</p>
          </div>
        </div>
        <a href="/admin/applications" class="px-6 py-2 border-2 rounded-xl font-bold text-sm transition-all hover:text-white" style="border-color:var(--color-primary);color:var(--color-primary);" onmouseover="this.style.background='var(--color-primary)'" onmouseout="this.style.background='transparent'">
          Review Now
        </a>
      </section>`:""}
    </div>
  `,ne(f),se(t?.portfolioStatus);const N=g.risk_matrix?.length?g.risk_matrix:[];ae(N),Q(m),ee(L,g.vintage),Z(t,L,o,s),E("tabs-velocity",["1M","3M","6M","1Y","YTD"],"1Y",l=>{const d=D(I,"month_year",l);te(d)}),E("tabs-vintage",["3M","6M","1Y","ALL"],"ALL",l=>{const d=D(g.vintage,"cohort",l);oe(d)}),E("tabs-trends",["3M","6M","1Y","ALL"],"1Y",l=>{const d=D(P,"month",l);re(d)})});function D(e,r,n){if(!e||n==="ALL")return e;const a=new Date;let t=new Date;return n==="1M"&&t.setMonth(a.getMonth()-1),n==="3M"&&t.setMonth(a.getMonth()-3),n==="6M"&&t.setMonth(a.getMonth()-6),n==="1Y"&&t.setFullYear(a.getFullYear()-1),n==="YTD"&&(t=new Date(a.getFullYear(),0,1)),e.filter(o=>new Date(o[r])>=t)}let R=null;function Z(e,r,n,a){R={dash:e,fin:r,pipeline:n,perf:a,capturedAt:new Date().toISOString()},setTimeout(()=>{document.getElementById("btn-export-dashboard")?.addEventListener("click",J)},500)}function J(){if(!R){alert("Dashboard data not loaded yet.");return}const{dash:e,fin:r,pipeline:n,capturedAt:a}=R,o=[["DASHBOARD EXPORT",new Date(a).toLocaleDateString("en-ZA"),"",""],["","","",""],["KPI SUMMARY","","",""],["Metric","Value","",""],["Total Disbursed",r?.data?.balanceSheet?.totalLoanBook||0,"",""],["Active Clients",r?.data?.balanceSheet?.activeClients||0,"",""],["Avg Loan Per Client",r?.data?.balanceSheet?.avgLoanPerClient?.toFixed(2)||0,"",""],["Arrears Rate",(r?.data?.balanceSheet?.arrearsPercentage||0).toFixed(1)+"%","",""],["Interest Income",r?.data?.incomeStatement?.interestIncome||0,"",""],["Fee Income",r?.data?.incomeStatement?.feeIncome||0,"",""],["Total Revenue",r?.data?.incomeStatement?.totalRevenue||0,"",""],["","","",""],["PIPELINE SUMMARY","","",""],["Status","Count","",""]],s={};(n?.data||[]).forEach(f=>{s[f.status]=(s[f.status]||0)+1}),Object.entries(s).forEach(([f,m])=>o.push([f,m,"",""]));const c=o.map(f=>f.map(m=>`"${String(m).replace(/"/g,'""')}"`).join(",")).join(`
`),u=new Blob([c],{type:"text/csv;charset=utf-8;"}),i=URL.createObjectURL(u),p=document.createElement("a");p.href=i,p.download=`dashboard_export_${new Date().toISOString().slice(0,10)}.csv`,document.body.appendChild(p),p.click(),document.body.removeChild(p),URL.revokeObjectURL(i)}function E(e,r,n,a){const t=document.getElementById(e);t&&(t.innerHTML=r.map(o=>`<button class="tab-button ${o===n?"active":""}" data-range="${o}">${o}</button>`).join(""),t.querySelectorAll("button").forEach(o=>{o.addEventListener("click",s=>{t.querySelectorAll("button").forEach(c=>c.classList.remove("active")),s.target.classList.add("active"),a(s.target.dataset.range)})}),a(n))}function Q(e){const{primary:r}=b(),n=e||[],a=["STARTED"],t=["BUREAU_CHECKING","BUREAU_OK","BUREAU_REFER","BANK_LINKING","AFFORD_OK","AFFORD_REFER"],o=["OFFERED","OFFER_ACCEPTED","CONTRACT_SIGN","DEBICHECK_AUTH"],s=["READY_TO_DISBURSE"],u={series:[{name:"Applications",data:[n.filter(i=>a.includes(i.status)).length,n.filter(i=>t.includes(i.status)).length,n.filter(i=>o.includes(i.status)).length,n.filter(i=>s.includes(i.status)).length]}],chart:{type:"bar",height:300,toolbar:{show:!1},fontFamily:"Inter"},plotOptions:{bar:{borderRadius:8,horizontal:!0,barHeight:"60%"}},colors:[r],dataLabels:{enabled:!0,style:{fontSize:"12px",fontWeight:"700",colors:["#fff"]}},xaxis:{categories:["Started","Processing","Finalizing","Ready"],labels:{style:{colors:"#64748b",fontSize:"12px",fontWeight:"600"}}},yaxis:{labels:{style:{colors:"#64748b",fontSize:"12px",fontWeight:"600"}}},grid:{borderColor:"#f1f5f9",strokeDashArray:4},legend:{show:!1}};new ApexCharts(document.querySelector("#funnelChart"),h(u)).render()}function ee(e,r){const{primary:n,secondary:a}=b(),t=e?.ratios?.niiToRevenue||0,o=e?.balanceSheet?.arrearsPercentage||0,s=Math.max(0,100-o);let c=0;if(r&&r.length>0){const i=r.slice(0,3);c=i.reduce((f,m)=>f+parseFloat(m.recovery_rate),0)/i.length}const u={series:[Math.round(t),Math.round(s),Math.round(c)],chart:{type:"radialBar",height:350,fontFamily:"Inter"},plotOptions:{radialBar:{hollow:{size:"45%",background:"transparent"},track:{margin:10,background:"#f1f5f9"},dataLabels:{name:{fontSize:"14px",fontWeight:"700",color:"#64748b"},value:{fontSize:"24px",fontWeight:"800",color:"#0f172a"},total:{show:!0,label:"Avg Health",fontSize:"13px",fontWeight:"700",color:"#64748b",formatter:()=>Math.round(s)+"%"}}}},stroke:{lineCap:"round"},labels:["Profit Margin","Portfolio Health","Recovery Rate"],colors:[n,"#10b981",a]};new ApexCharts(document.querySelector("#radialChart"),h(u)).render()}let v=null;function te(e){const{primary:r,secondary:n}=b(),a=e||[],t={series:[{name:"Disbursed",type:"area",data:a.map(o=>o.disbursed_amount)},{name:"Collected",type:"area",data:a.map(o=>o.repaid_amount)}],chart:{type:"line",height:350,fontFamily:"Inter",zoom:{enabled:!1},toolbar:{show:!1}},stroke:{width:3,curve:"smooth"},fill:{type:"gradient",gradient:{shadeIntensity:1,opacityFrom:.4,opacityTo:.1}},colors:[r,n],dataLabels:{enabled:!1},labels:a.map(o=>o.month_year),xaxis:{labels:{style:{colors:"#64748b",fontSize:"11px",fontWeight:"600"}}},yaxis:{labels:{formatter:o=>y(o),style:{colors:"#64748b",fontSize:"11px",fontWeight:"600"}}},grid:{borderColor:"#f1f5f9",strokeDashArray:4},legend:{position:"top",horizontalAlign:"right",fontSize:"12px",fontWeight:"600"}};v&&v.destroy(),v=new ApexCharts(document.querySelector("#velocityChart"),h(t)),v.render()}function ae(e){const{primary:r}=b(),a={series:[{name:"Loans",data:e?.length?e.map(t=>({x:t.credit_score||0,y:t.dti_ratio,z:t.principal_amount/100,fillColor:t.status==="defaulted"?"#ef4444":r})):[]}],chart:{type:"bubble",height:350,fontFamily:"Inter",zoom:{enabled:!1},toolbar:{show:!1}},dataLabels:{enabled:!1},fill:{opacity:.7},xaxis:{title:{text:"Credit Score",style:{fontSize:"12px",fontWeight:"700",color:"#64748b"}},min:0,max:850,labels:{style:{colors:"#64748b",fontSize:"11px",fontWeight:"600"}}},yaxis:{title:{text:"DTI Ratio (%)",style:{fontSize:"12px",fontWeight:"700",color:"#64748b"}},max:100,labels:{style:{colors:"#64748b",fontSize:"11px",fontWeight:"600"}}},grid:{borderColor:"#f1f5f9",strokeDashArray:4}};new ApexCharts(document.querySelector("#riskChart"),h(a)).render()}let w=null;function oe(e){const{primary:r}=b();if(!e||e.length===0){document.querySelector("#vintageChart").innerHTML='<div class="h-full flex items-center justify-center text-slate-400 font-medium text-sm">No vintage data available</div>';return}const n={series:[{name:"Recovery Rate",data:e.map(a=>({x:a.cohort,y:a.recovery_rate}))}],chart:{type:"bar",height:350,fontFamily:"Inter",toolbar:{show:!1}},plotOptions:{bar:{borderRadius:8,columnWidth:"55%",colors:{ranges:[{from:0,to:60,color:"#ef4444"},{from:61,to:90,color:"#f59e0b"},{from:91,to:150,color:"#10b981"}]}}},dataLabels:{enabled:!0,formatter:a=>a+"%",style:{fontSize:"11px",fontWeight:"700",colors:["#fff"]}},yaxis:{max:120,labels:{style:{colors:"#64748b",fontSize:"11px",fontWeight:"600"}}},xaxis:{labels:{style:{colors:"#64748b",fontSize:"11px",fontWeight:"600"}}},colors:[r],grid:{borderColor:"#f1f5f9",strokeDashArray:4}};w&&w.destroy(),w=new ApexCharts(document.querySelector("#vintageChart"),h(n)),w.render()}let S=null,C=null;function re(e){const{primary:r,secondary:n}=b(),a=[...e||[]].reverse();if(a.length===1){const o=new Date(a[0].month),c=new Date(o.setMonth(o.getMonth()-1)).toISOString().slice(0,7);a.unshift({month:c,total_principal:0,projected_interest:0,active_loans:0})}const t=a.map(o=>o.month);S&&S.destroy(),S=new ApexCharts(document.querySelector("#comboChart"),h({series:[{name:"Principal",data:a.map(o=>o.total_principal||0)},{name:"Projected Interest",data:a.map(o=>o.projected_interest||0)}],chart:{height:350,type:"bar",stacked:!0,toolbar:{show:!1},fontFamily:"Inter"},plotOptions:{bar:{borderRadius:6,columnWidth:"50%"}},colors:[r,n],labels:t,xaxis:{labels:{style:{colors:"#64748b",fontSize:"11px",fontWeight:"600"}}},yaxis:{labels:{formatter:o=>z(o),style:{colors:"#64748b",fontSize:"11px",fontWeight:"600"}}},grid:{borderColor:"#f1f5f9",strokeDashArray:4},tooltip:{shared:!0,intersect:!1},legend:{position:"top",horizontalAlign:"right",fontSize:"12px",fontWeight:"600"},dataLabels:{enabled:!1}})),S.render(),C&&C.destroy(),C=new ApexCharts(document.querySelector("#growthChart"),h({series:[{name:"Total Exposure",data:a.map(o=>(o.total_principal||0)+(o.projected_interest||0))}],chart:{height:300,type:"area",toolbar:{show:!1},fontFamily:"Inter",dropShadow:{enabled:!0,color:r,top:8,blur:10,opacity:.2}},colors:[r],stroke:{curve:"smooth",width:3},fill:{type:"gradient",gradient:{shadeIntensity:1,opacityFrom:.5,opacityTo:.1,stops:[0,90,100]}},xaxis:{categories:t,labels:{style:{colors:"#64748b",fontSize:"11px",fontWeight:"600"}}},yaxis:{labels:{formatter:o=>y(o),style:{colors:"#64748b",fontSize:"11px",fontWeight:"600"}}},grid:{borderColor:"#f1f5f9",strokeDashArray:4},dataLabels:{enabled:!1},tooltip:{y:{formatter:o=>z(o)}}})),C.render()}function ne(e){const r=document.getElementById("cards-container"),n=[{title:"Total Revenue",value:y(e.total_collected),sub:"Lifetime Collections",icon:"payments"},{title:"Total Disbursed",value:y(e.total_disbursed),sub:"Principal Lent",icon:"send_money"},{title:"Cash Flow",value:y(e.realized_cash_flow),sub:"Net Collections",icon:"account_balance"},{title:"Active Loans",value:e.active_loans_count??0,sub:"Current Portfolio",icon:"assignment_turned_in"}];r.innerHTML=n.map(a=>`
    <div class="glass-card p-8 rounded-2xl flex flex-col justify-between h-[200px] relative overflow-hidden">
      <div class="absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-8 -mt-8" style="background:color-mix(in srgb, var(--color-primary) 6%, transparent)"></div>
      <div class="flex items-center justify-between">
        <span class="material-symbols-outlined text-[32px]" style="color:var(--color-primary)">${a.icon}</span>
      </div>
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-widest text-outline mb-1">${a.title}</p>
        <h3 class="font-headline text-4xl font-bold text-on-surface leading-none">${a.value}</h3>
        <p class="text-[11px] text-outline mt-1">${a.sub}</p>
      </div>
    </div>`).join("")}function se(e){const r=e&&e.length?e:[{name:"No Data",value:1}],{primary:n,secondary:a}=b(),t={series:r.map(o=>o.value),labels:r.map(o=>o.name),chart:{type:"donut",height:320,fontFamily:"Inter"},colors:[n,a,"#10b981","#f59e0b"],plotOptions:{pie:{donut:{size:"70%",labels:{show:!0,total:{show:!0,label:"Total Loans",fontSize:"14px",fontWeight:"700",color:"#64748b",formatter:o=>o.globals.seriesTotals.reduce((s,c)=>s+c,0)},value:{fontSize:"28px",fontWeight:"800",color:"#0f172a"}}}}},legend:{position:"bottom",fontSize:"12px",fontWeight:"600",labels:{colors:"#64748b"}},dataLabels:{enabled:!1},stroke:{show:!1}};new ApexCharts(document.querySelector("#donutChart"),h(t)).render()}function ie(e,r){const n={STARTED:e.filter(t=>t.status==="STARTED").length,BANK_LINKING:e.filter(t=>["BANK_LINKING","AFFORD_OK"].includes(t.status)).length,OFFERED:e.filter(t=>t.status==="OFFERED").length,CONTRACT_SIGN:e.filter(t=>["CONTRACT_SIGN","OFFER_ACCEPTED"].includes(t.status)).length,READY_TO_DISBURSE:e.filter(t=>t.status==="READY_TO_DISBURSE").length},a=(r||[]).map(t=>({cohort:t.month_year,recovery_rate:t.disbursed_amount>0?Math.round(t.repaid_amount/t.disbursed_amount*100):0})).filter(t=>t.cohort>="2024-01");return{funnel:n,vintage:a,risk_matrix:[]}}
