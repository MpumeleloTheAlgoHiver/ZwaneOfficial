// Dashboard page JS - Combined Hybrid Version
import '/user-portal/Services/sessionGuard.js'; 

// ==========================================
// 1. DATA STATE & CONSTANTS
// ==========================================
const dashboardData = {
    currentBalance: 0,
    nextPayment: { amount: 0, date: null },
    creditScore: 0,
    totalBorrowed: 0,
    totalRepaid: 0,
    repaymentSeries: null,
    loans: [],
    transactions: [],
    applications: []
};

const CREDIT_SCORE_MAX = 999;
const SCORE_RISK_COLORS = {
    'very low risk': { gradient: 'linear-gradient(90deg, #10b981, #22d3ee)', accent: '#10b981' },
    'low risk': { gradient: 'linear-gradient(90deg, #22c55e, #a3e635)', accent: '#22c55e' },
    'medium risk': { gradient: 'linear-gradient(90deg, var(--color-secondary), var(--color-tertiary))', accent: 'var(--color-secondary)' },
    'high risk': { gradient: 'linear-gradient(90deg, var(--color-secondary), #ef4444)', accent: '#ef4444' },
    'very high risk': { gradient: 'linear-gradient(90deg, #dc2626, #7f1d1d)', accent: '#dc2626' }
};

let repaymentChart, loanBreakdownChart;

const currencyFormatter = new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const getThemePalette = () => {
    const styles = getComputedStyle(document.documentElement);
    const read = (name, fallback) => (styles.getPropertyValue(name).trim() || fallback);
    const primaryRgb = read('--color-primary-rgb', '231 118 46');
    return {
        primary: read('--color-primary', '#E7762E'),
        primarySoft: read('--color-primary-soft', '#ff9f5a'),
        secondarySoft: read('--color-secondary-soft', '#ffb26b'),
        surfaceCard: read('--color-surface-card', '#ffffff'),
        text: read('--color-text', '#0f172a'),
        textMuted: read('--color-text-muted', '#475569'),
        primaryAlpha: (alpha) => `rgb(${primaryRgb} / ${alpha})`
    };
};

// ==========================================
// 2. UTILITY FUNCTIONS
// ==========================================
function formatCurrency(value = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 'R 0.00';
    return `R ${currencyFormatter.format(numeric)}`;
}

function formatDueDate(date) {
    if (!date) return null;
    const dateObj = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(dateObj.getTime())) return null;
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function calculateMonthlyPayment(principal = 0, annualRate = 0, termMonths = 0) {
    const amount = Number(principal);
    const months = Number(termMonths);
    if (!amount || !months || months <= 0) return 0;

    const monthlyRate = Number(annualRate) / 12;
    if (!monthlyRate) return amount / months;

    const factor = Math.pow(1 + monthlyRate, months);
    return (amount * monthlyRate * factor) / (factor - 1);
}

function parseRandToNumber(val) {
    if (!val) return 0;
    return Number(String(val).replace(/[^0-9.-]/g, '')) || 0;
}

// ==========================================
// 3. UI RENDERING: MOBILE CAROUSEL & EYE TOGGLE
// ==========================================
window.toggleFigureVisibility = function(btn) {
    const card = btn.closest('.snap-card');
    const valueEl = card.querySelector('.card-value');
    const icon = btn.querySelector('i');
    
    valueEl.classList.toggle('hidden-value');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
};

function populateDashboardMetrics() {
    const container = document.getElementById('metricsCarousel');
    const dotContainer = document.getElementById('carouselDots');
    if (!container || !dotContainer) return;

    // REORDERED CAROUSEL: Next Due -> Outstanding -> Credit Score -> Repaid -> Borrowed
    const slides = [
        { label: 'Next Payment Due', value: formatCurrency(dashboardData.nextPayment.amount), subtitle: dashboardData.nextPayment.date ? `Due ${formatDueDate(dashboardData.nextPayment.date)}` : 'No upcoming payment' },
        { label: 'Outstanding Balance', value: formatCurrency(dashboardData.currentBalance), subtitle: 'Total principal remaining' },
        { label: 'Credit Score', value: dashboardData.creditScore || '---', subtitle: 'Experian Financial Standing', isScore: true },
        { label: 'Total Repaid', value: formatCurrency(dashboardData.totalRepaid), subtitle: 'Successfully settled' },
        { label: 'Total Borrowed', value: formatCurrency(dashboardData.totalBorrowed), subtitle: 'Lifetime borrowing capacity' }
    ];

    container.innerHTML = slides.map(slide => `
        <div class="snap-card">
            <button class="hide-eye-btn" onclick="toggleFigureVisibility(this)">
                <i class="fas fa-eye"></i>
            </button>
            <div class="card-content">
                <p class="card-label">${slide.label}</p>
                <h2 class="card-value ${slide.isScore ? '' : ''}">${slide.value}</h2>
                <p class="card-detail">${slide.subtitle}</p>
            </div>
        </div>
    `).join('');

    dotContainer.innerHTML = slides.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}"></span>`).join('');

    container.addEventListener('scroll', () => {
        const index = Math.round(container.scrollLeft / container.offsetWidth);
        document.querySelectorAll('.dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    });
}

// ==========================================
// 4. UI RENDERING: DESKTOP & SHARED
// ==========================================
function updateNextPaymentDisplay(amount, dueDate) {
    const amountEl = document.getElementById('nextPaymentAmount');
    const dateEl = document.getElementById('nextPaymentDate');
    if (!amountEl || !dateEl) return;

    if (!amount || amount <= 0) {
        amountEl.textContent = 'R 0.00';
        dateEl.textContent = 'No upcoming payment';
        return;
    }

    amountEl.textContent = formatCurrency(amount);
    const formattedDate = formatDueDate(dueDate);
    dateEl.textContent = formattedDate ? `Due ${formattedDate}` : 'Next payment date pending';
}

function applyCreditScoreToDashboard(creditData) {
    const scoreElement = document.getElementById('creditScore');
    const subtitleElement = document.querySelector('.credit-score-card .card-subtitle');
    const scoreFill = document.querySelector('.credit-score-card .score-fill');

    if (!scoreElement || !subtitleElement || !scoreFill) return;

    if (!creditData) {
        scoreElement.textContent = '---';
        subtitleElement.textContent = 'Run a credit check to sync Experian data';
        scoreFill.style.width = '0%';
        scoreFill.style.background = 'linear-gradient(90deg, #4b5563, #9ca3af)';
        return;
    }

    const rawScore = Number(creditData.credit_score ?? creditData.score ?? 0);
    const clampedScore = Math.max(0, Math.min(rawScore, CREDIT_SCORE_MAX));
    const percentage = Math.round((clampedScore / CREDIT_SCORE_MAX) * 100);
    const riskLabel = (creditData.score_band || creditData.risk_category || 'Risk level unavailable').toString();
    const checkedAt = creditData.checked_at ? new Date(creditData.checked_at) : null;
    const checkedAtCopy = checkedAt ? ` • Checked ${checkedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '';

    scoreElement.textContent = clampedScore.toString();
    subtitleElement.textContent = `${riskLabel}${checkedAtCopy}`;

    const lookupKey = riskLabel.trim().toLowerCase();
    const colorMeta = SCORE_RISK_COLORS[lookupKey] || { gradient: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary-soft))', accent: 'var(--color-primary)' };
    
    scoreFill.style.width = `${percentage}%`;
    scoreFill.style.background = colorMeta.gradient;
    scoreFill.style.boxShadow = `0 0 12px ${colorMeta.accent}66`;

    dashboardData.creditScore = clampedScore;
}

function populateActiveLoans() {
    const active = dashboardData.loans.filter(l => l.status === 'Active' || l.status === 'Offered').slice(0, 3);
    
    // Desktop View Update
    const desktopGrid = document.getElementById('activeLoansGrid');
    if (desktopGrid) {
        if (active.length === 0) {
            desktopGrid.innerHTML = '<div style="color: #666; text-align: center; padding: 20px; grid-column: 1/-1;">No active loans</div>';
        } else {
            desktopGrid.innerHTML = active.map(loan => {
                const total = loan.totalAmount || parseRandToNumber(loan.amount);
                const remaining = parseRandToNumber(loan.remaining);
                const progress = loan.status === 'Offered' ? 0 : ((total - remaining) / total * 100).toFixed(0);
                return `
                    <div class="loan-card">
                        <div class="loan-header"><span class="loan-id">${loan.id}</span><span class="loan-status">${loan.status}</span></div>
                        <div class="loan-amount">${loan.amount}</div>
                        <div class="loan-details-grid">
                            <div class="loan-detail"><div class="loan-detail-label">Remaining</div><div class="loan-detail-value">${loan.remaining || loan.amount}</div></div>
                            <div class="loan-detail"><div class="loan-detail-label">Next Payment</div><div class="loan-detail-value">${loan.nextPayment || 'TBD'}</div></div>
                            <div class="loan-detail"><div class="loan-detail-label">Due Date</div><div class="loan-detail-value">${loan.dueDate || 'TBD'}</div></div>
                            <div class="loan-detail"><div class="loan-detail-label">Interest Rate</div><div class="loan-detail-value">${loan.interestRate || 'TBD'}</div></div>
                        </div>
                        <div class="progress-section">
                            <div class="progress-header"><span class="progress-label">Repayment Progress</span><span class="progress-percentage">${progress}%</span></div>
                            <div class="progress-bar"><div class="progress-fill" style="width: ${progress}%"></div></div>
                        </div>
                    </div>`;
            }).join('');
        }
    }

    // Mobile View Update
    const mobileGrid = document.getElementById('activeLoansGridMobile');
    if (mobileGrid) {
        if (active.length === 0) {
            mobileGrid.innerHTML = '<div class="empty-loans-state"><p>No active loans available</p></div>';
        } else {
            mobileGrid.innerHTML = active.map(loan => {
                const total = loan.totalAmount || parseRandToNumber(loan.amount);
                const remaining = parseRandToNumber(loan.remaining);
                const progress = total > 0 ? ((total - remaining) / total * 100).toFixed(0) : 0;
                return `
                    <div class="loan-card-hifi">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                            <span style="font-size: 11px; font-weight: 500; color: var(--text-muted);">${loan.id}</span>
                            <span style="background: var(--color-peach); color: var(--color-primary); padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 600;">${loan.status}</span>
                        </div>
                        <div style="font-size: 24px; font-weight: 600; color: var(--text-main); margin-bottom: 15px;">${loan.amount}</div>
                        <div style="height: 6px; background: var(--apple-gray); border-radius: 10px; overflow: hidden;">
                            <div style="width: ${progress}%; height: 100%; background: var(--color-primary);"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px;">
                            <span style="color: var(--text-muted);">Repayment Progress</span>
                            <span style="color: var(--color-primary); font-weight: 600;">${progress}%</span>
                        </div>
                    </div>`;
            }).join('');
        }
    }
}

function populateTransactions() {
    const transactionList = document.getElementById('transactionList');
    if (!transactionList) return;

    const recentTransactions = dashboardData.transactions.slice(0, 5);
    if (recentTransactions.length === 0) {
        transactionList.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No transactions yet</p>';
        return;
    }

    transactionList.innerHTML = recentTransactions.map(tx => `
        <div class="transaction-item">
            <div class="transaction-icon ${tx.type}"><i class="fas fa-${tx.type === 'inbound' ? 'arrow-down' : 'arrow-up'}"></i></div>
            <div class="item-details"><div class="item-title">${tx.description}</div><div class="item-date">${tx.date}</div></div>
            <div class="item-amount ${tx.type}">${tx.amount}</div>
        </div>
    `).join('');
}

function populateApplications() {
    const applicationList = document.getElementById('applicationList');
    if (!applicationList) return;

    const recentApplications = dashboardData.applications.slice(0, 5);
    if (recentApplications.length === 0) {
        applicationList.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No applications yet</p>';
        return;
    }

    applicationList.innerHTML = recentApplications.map(app => {
        const now = new Date();
        const createdAt = new Date(app.createdAt);
        const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
        const withinTimeWindow = hoursSinceCreation < 2;
        
        const canEdit = withinTimeWindow && app.status !== 'AFFORD_OK' && app.status !== 'READY_TO_DISBURSE';
        const canDelete = withinTimeWindow && app.status !== 'READY_TO_DISBURSE';
        
        return `
        <div class="application-item">
            <div class="application-icon ${app.status.toLowerCase()}">
                <i class="fas fa-${app.status === 'Approved' ? 'check' : app.status === 'Pending' ? 'clock' : 'times'}"></i>
            </div>
            <div class="item-details">
                <div class="item-title">${app.type}</div>
                <div class="item-date">${app.date}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="status-badge ${app.status.toLowerCase()}">${app.status}</span>
                <button class="app-action-btn ${!canEdit ? 'locked' : ''}" onclick="editApplication('${app.rawId}')" ${!canEdit ? 'disabled' : ''}>
                    <i class="fas fa-${!canEdit ? 'lock' : 'edit'}"></i>
                </button>
                <button class="app-action-btn delete ${!canDelete ? 'locked' : ''}" onclick="deleteApplication('${app.rawId}')" ${!canDelete ? 'disabled' : ''}>
                    <i class="fas fa-${!canDelete ? 'lock' : 'trash'}"></i>
                </button>
            </div>
        </div>`;
    }).join('');
}

// ==========================================
// 5. CHARTS & VISUALIZATIONS
// ==========================================
function computeRepaymentSuggestedMax(data = []) {
    const numericData = Array.isArray(data) ? data.map(v => Number(v) || 0) : [];
    const maxVal = Math.max(...numericData, 0);
    const minFloor = 10000;
    const padded = maxVal * 1.25 + 500;
    const bigFloor = maxVal > 200000 ? 300000 : 0;
    return Math.max(padded, minFloor, bigFloor);
}

function buildMonthlySeries(monthCount, payments = []) {
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
    const now = new Date();
    const months = Array.from({ length: monthCount }, (_, i) => {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthCount - 1 - i), 1));
        return { key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`, label: monthFormatter.format(d) };
    });

    const buckets = months.reduce((acc, m) => ({ ...acc, [m.key]: 0 }), {});
    (payments || []).forEach((p) => {
        if (!p.payment_date) return;
        const dt = new Date(p.payment_date);
        if (Number.isNaN(dt.getTime())) return;
        const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
        if (key in buckets) buckets[key] += Number(p.amount) || 0;
    });

    return { labels: months.map(m => m.label), data: months.map(m => buckets[m.key]) };
}

function applyRepaymentChart(labels = [], data = []) {
    if (!repaymentChart) {
        dashboardData.repaymentSeries = { labels, data };
        return;
    }
    repaymentChart.data.labels = labels;
    repaymentChart.data.datasets[0].data = data;
    repaymentChart.options.scales.y.suggestedMax = computeRepaymentSuggestedMax(data);
    repaymentChart.update();
}

function initializeCharts() {
    const palette = getThemePalette();
    const repaymentCtx = document.getElementById('repaymentChart');
    
    if (repaymentCtx) {
        const lineCtx = repaymentCtx.getContext('2d');
        const lineGradient = lineCtx.createLinearGradient(0, 0, 0, repaymentCtx.height);
        lineGradient.addColorStop(0, palette.primaryAlpha(0.35));
        lineGradient.addColorStop(1, palette.primaryAlpha(0.05));

        repaymentChart = new Chart(repaymentCtx, {
            type: 'line',
            data: {
                labels: dashboardData.repaymentSeries?.labels || ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
                datasets: [{
                    label: 'Payments Made',
                    data: dashboardData.repaymentSeries?.data || [0, 0, 0, 0, 0, 0],
                    borderColor: palette.primary,
                    backgroundColor: lineGradient,
                    borderWidth: 3, fill: true, tension: 0.45,
                    pointRadius: 5, pointHoverRadius: 7, pointBackgroundColor: palette.surfaceCard,
                    pointBorderColor: palette.primary, pointBorderWidth: 3, pointHoverBorderWidth: 3,
                    segment: { borderColor: ctx => ctx.p0.skip || ctx.p1.skip ? 'rgba(255,255,255,0.15)' : palette.primary }
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1a1a', titleColor: '#fff', bodyColor: '#ffead6', borderColor: '#2a2a2a', borderWidth: 1, padding: 12, displayColors: false, callbacks: { label: function(context) { return 'R ' + context.parsed.y.toLocaleString(); } } } },
                scales: { y: { beginAtZero: true, suggestedMax: computeRepaymentSuggestedMax(dashboardData.repaymentSeries?.data || [0, 0, 0, 0, 0, 0]), grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false }, ticks: { color: '#8c8c8c', font: { size: 10 }, callback: function(value) { return 'R' + (value/1000) + 'k'; } } }, x: { grid: { color: 'rgba(255, 255, 255, 0.02)' }, ticks: { color: '#9a9a9a', font: { size: 10 } } } }
            }
        });
        if (dashboardData.repaymentSeries) applyRepaymentChart(dashboardData.repaymentSeries.labels, dashboardData.repaymentSeries.data);
    }

    const breakdownCtx = document.getElementById('loanBreakdownChart');
    if (breakdownCtx) {
        const donutCtx = breakdownCtx.getContext('2d');
        const brightOrange = donutCtx.createLinearGradient(0, 0, breakdownCtx.width, breakdownCtx.height);
        brightOrange.addColorStop(0, palette.primaryAlpha(0.95));
        brightOrange.addColorStop(1, palette.primaryAlpha(0.9));

        loanBreakdownChart = new Chart(breakdownCtx, {
            type: 'doughnut',
            data: {
                labels: ['Repaid', 'Outstanding'],
                datasets: [{
                    data: [1, 1], // Placeholder
                    backgroundColor: [brightOrange, palette.primaryAlpha(0.2)],
                    borderColor: [palette.primary, palette.primaryAlpha(0.3)],
                    hoverBorderColor: [palette.primary, palette.primary],
                    borderWidth: 2, hoverOffset: 8, offset: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#e2e8f0', padding: 15, font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' } }, tooltip: { backgroundColor: '#1a1a1a', titleColor: '#fff', bodyColor: '#e2e8f0', borderColor: '#2a2a2a', borderWidth: 1, padding: 10, callbacks: { label: function(context) { const value = context.parsed; const total = context.dataset.data.reduce((a, b) => a + b, 0); const percentage = ((value / total) * 100).toFixed(1); return context.label + ': R ' + value.toLocaleString() + ' (' + percentage + '%)'; } } } },
                cutout: '68%', rotation: -90
            }
        });
        updateLoanBreakdownChart(dashboardData.totalRepaid, dashboardData.currentBalance);
    }
}

function updateLoanBreakdownChart(totalRepaid = 0, outstanding = 0) {
    dashboardData.totalRepaid = totalRepaid; dashboardData.currentBalance = outstanding;
    if (!loanBreakdownChart) return;
    const dataset = loanBreakdownChart.data?.datasets?.[0];
    if (!dataset) return;
    
    const repaidVal = Math.max(totalRepaid, 0);
    const outstandingVal = Math.max(outstanding, 0);
    dataset.data = (repaidVal > 0 || outstandingVal > 0) ? [repaidVal, outstandingVal] : [1, 1];
    loanBreakdownChart.update();
}

function getRepaymentSeriesForPeriod(period = '6m') {
    const fallback6m = buildMonthlySeries(6, []);
    const base6m = dashboardData.repaymentSeries6 || dashboardData.repaymentSeries || fallback6m;
    if (period === '1y') return dashboardData.repaymentSeries12 || base6m || buildMonthlySeries(12, []);
    if (period === 'all') return dashboardData.repaymentSeries12 || base6m;
    return base6m;
}

window.updateChartPeriod = function(period) {
    document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
    if (typeof event !== 'undefined' && event?.target) event.target.classList.add('active');

    const series = getRepaymentSeriesForPeriod(period);
    if (repaymentChart && series) {
        repaymentChart.data.labels = series.labels || [];
        repaymentChart.data.datasets[0].data = series.data || [];
        repaymentChart.options.scales.y.suggestedMax = computeRepaymentSuggestedMax(series.data || []);
        repaymentChart.update();
    }
};

async function ensureChartJs() {
    if (typeof Chart !== 'undefined') return true;
    const existingScript = document.querySelector('script[src*="chart.js"]');
    if (existingScript) {
        return new Promise((resolve) => {
            if (typeof Chart !== 'undefined') return resolve(true);
            existingScript.onload = () => resolve(true);
            existingScript.onerror = () => resolve(false);
            setTimeout(() => resolve(typeof Chart !== 'undefined'), 4000);
        });
    }

    const cdnCandidates = ['https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js', 'https://unpkg.com/chart.js@3.9.1/dist/chart.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js'];
    for (const url of cdnCandidates) {
        const loaded = await new Promise((resolve) => {
            const script = document.createElement('script'); script.src = url;
            script.onload = () => resolve(true); script.onerror = () => resolve(false);
            const timeout = setTimeout(() => resolve(typeof Chart !== 'undefined'), 5000);
            script.onload = () => { clearTimeout(timeout); resolve(true); };
            script.onerror = () => { clearTimeout(timeout); resolve(false); };
            document.head.appendChild(script);
        });
        if (loaded && typeof Chart !== 'undefined') return true;
    }
    return false;
}

function renderFallbackLineChart(canvas, labels, values) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.clientWidth || 320;
    const height = canvas.height = canvas.clientHeight || 200;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a'; ctx.font = '12px sans-serif'; ctx.fillText('Repayment Trend', 10, 16);
}

function renderFallbackDoughnut(canvas, paid, balance) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.clientWidth || 200;
    const height = canvas.height = canvas.clientHeight || 200;
    ctx.clearRect(0, 0, width, height);
}

async function tryInitCharts() {
    const repaymentCanvas = document.getElementById('repaymentChart');
    const breakdownCanvas = document.getElementById('loanBreakdownChart');
    if (!repaymentCanvas || !breakdownCanvas) { setTimeout(tryInitCharts, 300); return; }
    
    const chartJsLoaded = await ensureChartJs();
    if (!chartJsLoaded) {
        renderFallbackLineChart(repaymentCanvas, dashboardData.repaymentSeries?.labels || ['Jan','Feb','Mar','Apr'], dashboardData.repaymentSeries?.data || [0,0,0,0]);
        renderFallbackDoughnut(breakdownCanvas, dashboardData.totalRepaid || 0, dashboardData.currentBalance || 0);
        return;
    }
    initializeCharts();
}
tryInitCharts();

// ==========================================
// 6. SUPABASE HYDRATION (THE ENGINE)
// ==========================================
async function loadDashboardData() {
    try {
        const { supabase } = await import('/Services/supabaseClient.js');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        // Fetch Credit Score
        await hydrateCreditScore(supabase, session.user.id);
        
        const { data: payments } = await supabase.from('payments').select('loan_id, amount, payment_date').eq('user_id', session.user.id);
        const paymentsByLoan = (payments || []).reduce((acc, payment) => {
            acc[payment.loan_id] = (acc[payment.loan_id] || 0) + (Number(payment.amount) || 0);
            return acc;
        }, {});
        const totalRepaidAllLoans = (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        dashboardData.repaymentSeries6 = buildMonthlySeries(6, payments);
        dashboardData.repaymentSeries12 = buildMonthlySeries(12, payments);
        dashboardData.repaymentSeries = dashboardData.repaymentSeries6;

        const { data: loans } = await supabase.from('loans').select('*').eq('user_id', session.user.id).eq('status', 'active').order('created_at', { ascending: false });
        
        if (loans && loans.length > 0) {
            const enrichedLoans = loans.map((loan) => {
                const principal = Number(loan.principal_amount) || 0;
                const termMonths = Number(loan.term_months) || 0;
                const rawRate = Number(loan.interest_rate) || 0;
                const normalizedRate = rawRate > 1 ? rawRate / 100 : rawRate;
                const monthlyPayment = Number(loan.monthly_payment) || calculateMonthlyPayment(principal, normalizedRate, termMonths);
                const rawNextPayment = loan.next_payment_date || loan.first_payment_date;
                let dueDateObj = null;
                if (rawNextPayment) {
                    const candidate = new Date(rawNextPayment);
                    if (!Number.isNaN(candidate.getTime())) { candidate.setUTCHours(0, 0, 0, 0); dueDateObj = candidate; }
                }
                const totalRepayment = Number(loan.total_repayment) || (monthlyPayment * (termMonths || 1)) || 0;
                const paidToDate = paymentsByLoan[loan.id] || 0;
                const outstandingBalance = Math.max(totalRepayment - paidToDate, 0);
                const nextDueAmount = Math.min(monthlyPayment, outstandingBalance || monthlyPayment);
                return { ...loan, principal, termMonths, normalizedRate, monthlyPayment, nextDueAmount, dueDateObj, outstandingBalance, totalRepayment, paidToDate };
            });

            const loanTotals = enrichedLoans.reduce((acc, loan) => {
                acc.borrowed += loan.principal;
                acc.outstanding += loan.outstandingBalance;
                acc.repaid += loan.paidToDate || 0;
                return acc;
            }, { borrowed: 0, outstanding: 0, repaid: 0 });

            dashboardData.totalBorrowed = loanTotals.borrowed;
            dashboardData.currentBalance = loanTotals.outstanding;
            dashboardData.totalRepaid = loanTotals.repaid || totalRepaidAllLoans;

            document.getElementById('totalBorrowed').textContent = formatCurrency(loanTotals.borrowed);
            document.getElementById('currentBalance').textContent = formatCurrency(loanTotals.outstanding);
            document.getElementById('totalRepaid').textContent = formatCurrency(loanTotals.repaid || totalRepaidAllLoans);
            updateLoanBreakdownChart(loanTotals.repaid || totalRepaidAllLoans, loanTotals.outstanding);

            const upcomingPayment = enrichedLoans.reduce((best, loan) => {
                if (!loan.monthlyPayment) return best;
                if (!loan.dueDateObj && !best) return loan;
                if (loan.dueDateObj && (!best || !best.dueDateObj || loan.dueDateObj < best.dueDateObj)) return loan;
                return best;
            }, null);

            if (upcomingPayment) {
                dashboardData.nextPayment = { amount: upcomingPayment.nextDueAmount, date: upcomingPayment.dueDateObj ? upcomingPayment.dueDateObj.toISOString() : null };
                updateNextPaymentDisplay(upcomingPayment.nextDueAmount, upcomingPayment.dueDateObj);
            }

            if (dashboardData.repaymentSeries) applyRepaymentChart(dashboardData.repaymentSeries.labels, dashboardData.repaymentSeries.data);

            dashboardData.loans = enrichedLoans.map(loan => {
                const readableStatus = loan.status ? `${loan.status.charAt(0).toUpperCase()}${loan.status.slice(1).toLowerCase()}` : 'Active';
                return {
                    id: `LOAN-${loan.id}`,
                    amount: formatCurrency(loan.totalRepayment || loan.principal),
                    remaining: formatCurrency((loan.outstandingBalance ?? (loan.totalRepayment || loan.principal))),
                    nextPayment: formatCurrency(loan.nextDueAmount),
                    dueDate: loan.dueDateObj ? loan.dueDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD',
                    interestRate: `${(loan.normalizedRate * 100).toFixed(2)}%`,
                    status: readableStatus,
                    totalAmount: loan.totalRepayment || loan.principal
                };
            });
            
            populateActiveLoans();
        } else {
            dashboardData.totalBorrowed = 0; dashboardData.currentBalance = 0; dashboardData.totalRepaid = totalRepaidAllLoans;
            document.getElementById('totalBorrowed').textContent = formatCurrency(0); document.getElementById('currentBalance').textContent = formatCurrency(0); document.getElementById('totalRepaid').textContent = formatCurrency(totalRepaidAllLoans);
            updateLoanBreakdownChart(totalRepaidAllLoans, 0); updateNextPaymentDisplay(0, null);
            if (dashboardData.repaymentSeries) applyRepaymentChart(dashboardData.repaymentSeries.labels, dashboardData.repaymentSeries.data);
        }
        
        const { data: applications } = await supabase.from('loan_applications').select('*').eq('user_id', session.user.id).neq('status', 'OFFERED').neq('status', 'DISBURSED').order('created_at', { ascending: false }).limit(5);
        if (applications && applications.length > 0) {
            dashboardData.applications = applications.map(app => ({
                id: `APP-${app.id}`, rawId: app.id, type: app.purpose || 'Personal Loan',
                amount: `R ${parseFloat(app.amount).toLocaleString('en-ZA', {minimumFractionDigits: 2})}`,
                date: new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                createdAt: app.created_at, status: app.status
            }));
            populateApplications();
        }
        
        populateDashboardMetrics(); // Render Mobile Carousel after all data is loaded

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function hydrateCreditScore(supabase, userId) {
    try {
        const { data } = await supabase.from('credit_checks').select('id, credit_score, score_band, risk_category, checked_at').eq('user_id', userId).order('checked_at', { ascending: false }).limit(1).maybeSingle();
        if (!data) { applyCreditScoreToDashboard(null); return; }
        applyCreditScoreToDashboard(data);
    } catch (err) {
        applyCreditScoreToDashboard(null);
    }
}

// ==========================================
// 7. MODALS & MODULES (DESKTOP)
// ==========================================
const LOANS_MODAL_ID = 'active-loans-modal';
function ensureLoansModalStyles() {
    if (document.getElementById('loans-modal-style')) return;
    const style = document.createElement('style'); style.id = 'loans-modal-style';
    style.textContent = `
        #${LOANS_MODAL_ID} { position: fixed; inset: 0; background: rgba(15,23,42,0.35); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; z-index: 2000; padding: 24px; }
        #${LOANS_MODAL_ID}.open { display: flex; }
        #${LOANS_MODAL_ID} .modal-panel { width: min(1100px, 95vw); max-height: min(85vh, 900px); background: #ffffff; color: #0f172a; border-radius: 18px; overflow: hidden; box-shadow: 0 30px 70px rgba(15,23,42,0.25); border: 1px solid #e2e8f0; display: flex; flex-direction: column; }
        #${LOANS_MODAL_ID} .modal-header { padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: linear-gradient(135deg, var(--color-primary, #0ea5e9), #f8fafc); border-bottom: 1px solid #e2e8f0; }
        #${LOANS_MODAL_ID} .modal-title { font-size: 18px; font-weight: 800; letter-spacing: 0.2px; color: #0f172a; }
        #${LOANS_MODAL_ID} .modal-actions { display: flex; align-items: center; gap: 10px; }
        #${LOANS_MODAL_ID} .pill { padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #eef2ff; color: #312e81; border: 1px solid #c7d2fe; }
        #${LOANS_MODAL_ID} .close-btn { background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; font-weight: 900; cursor: pointer; transition: all 0.2s ease; }
        #${LOANS_MODAL_ID} .modal-body { padding: 20px 24px 24px; overflow: hidden; display: flex; flex-direction: column; gap: 16px; }
        #${LOANS_MODAL_ID} .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
        #${LOANS_MODAL_ID} .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; }
        #${LOANS_MODAL_ID} .stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; font-weight: 700; }
        #${LOANS_MODAL_ID} .stat-value { margin-top: 6px; font-size: 22px; font-weight: 800; color: #0f172a; }
        #${LOANS_MODAL_ID} .loans-scroll { max-height: 520px; overflow-y: auto; padding-right: 6px; }
        #${LOANS_MODAL_ID} .loan-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(15,23,42,0.05); }
        #${LOANS_MODAL_ID} .loan-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 8px; }
        #${LOANS_MODAL_ID} .loan-id { font-weight: 800; letter-spacing: 0.2px; color: #0f172a; }
        #${LOANS_MODAL_ID} .loan-status { padding: 6px 10px; border-radius: 10px; font-size: 12px; font-weight: 700; border: 1px solid #cbd5e1; background: #f8fafc; color: #0f172a; }
        #${LOANS_MODAL_ID} .loan-main { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
        #${LOANS_MODAL_ID} .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; color: #475569; font-weight: 700; }
        #${LOANS_MODAL_ID} .value { font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 4px; }
        #${LOANS_MODAL_ID} .progress { margin-top: 12px; }
        #${LOANS_MODAL_ID} .progress-top { display: flex; justify-content: space-between; font-size: 12px; color: #475569; font-weight: 700; margin-bottom: 6px; }
        #${LOANS_MODAL_ID} .progress-bar { width: 100%; height: 8px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
        #${LOANS_MODAL_ID} .progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--color-primary, #0ea5e9), #0284c7); transition: width 0.3s ease; }
        #${LOANS_MODAL_ID} .empty-state { text-align: center; padding: 40px 10px; color: #475569; font-weight: 700; }
    `;
    document.head.appendChild(style);
}

function ensureLoansModalRoot() {
    ensureLoansModalStyles();
    let root = document.getElementById(LOANS_MODAL_ID);
    if (!root) {
        root = document.createElement('div');
        root.id = LOANS_MODAL_ID;
        root.innerHTML = `<div class="modal-panel" role="dialog" aria-modal="true"><div class="modal-header"><div class="modal-title">Active Loans</div><div class="modal-actions"><span class="pill" id="loans-count-pill">0 Loans</span><button class="close-btn" id="close-loans-modal" aria-label="Close">×</button></div></div><div class="modal-body"><div class="stats-grid" id="loans-stats"></div><div class="loans-scroll" id="loans-scroll"></div></div></div>`;
        document.body.appendChild(root);
        root.addEventListener('click', (e) => { if (e.target === root) document.getElementById(LOANS_MODAL_ID).classList.remove('open'); });
        root.querySelector('#close-loans-modal').addEventListener('click', () => document.getElementById(LOANS_MODAL_ID).classList.remove('open'));
    }
    return root;
}

window.openLoansModule = function() {
    const root = ensureLoansModalRoot();
    const activeLoans = dashboardData.loans.filter(l => l.status === 'Active' || l.status === 'Offered');
    const count = activeLoans.length;
    const totalRepayment = activeLoans.reduce((sum, l) => sum + parseRandToNumber(l.amount), 0);
    const totalRemaining = activeLoans.reduce((sum, l) => sum + (parseRandToNumber(l.remaining || l.amount)), 0);

    const statsHtml = `<div class="stat-card"><div class="stat-label">Active / Offered</div><div class="stat-value">${count}</div></div><div class="stat-card"><div class="stat-label">Total Repayment</div><div class="stat-value">${formatCurrency(totalRepayment)}</div></div><div class="stat-card"><div class="stat-label">Total Outstanding</div><div class="stat-value">${formatCurrency(totalRemaining)}</div></div>`;

    const listHtml = count === 0 ? '<div class="empty-state">No active loans right now.</div>' : activeLoans.map(loan => {
        const principal = parseRandToNumber(loan.amount);
        const remaining = parseRandToNumber(loan.remaining || loan.amount);
        const progress = Math.max(0, Math.min(100, Math.round(principal ? ((principal - remaining) / principal) * 100 : 0)));
        return `<div class="loan-card"><div class="loan-head"><span class="loan-id">${loan.id}</span><span class="loan-status">${loan.status}</span></div><div class="loan-main"><div><div class="label">Amount</div><div class="value">${loan.amount}</div></div><div><div class="label">Remaining</div><div class="value">${loan.remaining || loan.amount}</div></div><div><div class="label">Next Payment</div><div class="value">${loan.nextPayment || 'TBD'}</div></div><div><div class="label">Due Date</div><div class="value">${loan.dueDate || 'TBD'}</div></div><div><div class="label">Interest Rate</div><div class="value">${loan.interestRate || 'TBD'}</div></div></div><div class="progress"><div class="progress-top"><span>Repayment Progress</span><span>${progress}%</span></div><div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div></div></div>`;
    }).join('');

    root.querySelector('#loans-count-pill').textContent = `${count} Loan${count === 1 ? '' : 's'}`;
    root.querySelector('#loans-stats').innerHTML = statsHtml;
    root.querySelector('#loans-scroll').innerHTML = listHtml;
    root.classList.add('open');
};

const APPLICATIONS_MODAL_ID = 'recent-applications-modal';
function ensureApplicationsModalRoot() {
    let root = document.getElementById(APPLICATIONS_MODAL_ID);
    if (!root) {
        root = document.createElement('div');
        root.id = APPLICATIONS_MODAL_ID;
        root.innerHTML = `<div class="modal-panel" role="dialog" aria-modal="true"><div class="modal-header"><div class="modal-title" id="applications-modal-title">All Loan Requests</div><div class="modal-actions"><span class="pill" id="applications-count-pill">0 Requests</span><button class="close-btn" id="close-applications-modal" aria-label="Close">×</button></div></div><div class="modal-body"><div class="stats-grid" id="applications-stats"></div><div class="applications-scroll" id="applications-scroll"></div></div></div>`;
        document.body.appendChild(root);
        root.addEventListener('click', (e) => { if (e.target === root) document.getElementById(APPLICATIONS_MODAL_ID).classList.remove('open'); });
        root.querySelector('#close-applications-modal').addEventListener('click', () => document.getElementById(APPLICATIONS_MODAL_ID).classList.remove('open'));
    }
    return root;
}

window.openApplicationsModule = async function() {
    const root = ensureApplicationsModalRoot();
    const sortedApplications = [...dashboardData.applications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const totalRequests = sortedApplications.length;
    const totalAmount = sortedApplications.reduce((sum, app) => sum + parseRandToNumber(app.amount), 0);
    const pendingCount = sortedApplications.filter(app => String(app.status).toUpperCase().includes('PENDING')).length;

    const statsHtml = `<div class="stat-card"><div class="stat-label">Total Requests</div><div class="stat-value">${totalRequests}</div></div><div class="stat-card"><div class="stat-label">Requested Amount</div><div class="stat-value">${formatCurrency(totalAmount)}</div></div><div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value">${pendingCount}</div></div><div class="stat-card"><div class="stat-label">Latest Request</div><div class="stat-value">${sortedApplications[0]?.date || '—'}</div></div>`;

    const listHtml = totalRequests === 0 ? '<div class="empty-state">No loan requests found.</div>' : sortedApplications.map(app => {
        return `<div class="application-card"><div class="application-head"><span class="application-id">${app.id}</span><span class="application-status">${app.status}</span></div><div class="application-main"><div><div class="label">Purpose</div><div class="value">${app.type}</div></div><div><div class="label">Amount</div><div class="value">${app.amount}</div></div><div><div class="label">Date Submitted</div><div class="value">${app.date}</div></div></div></div>`;
    }).join('');

    root.querySelector('#applications-count-pill').textContent = `${totalRequests} Request${totalRequests === 1 ? '' : 's'}`;
    root.querySelector('#applications-stats').innerHTML = statsHtml;
    root.querySelector('#applications-scroll').innerHTML = listHtml;
    root.classList.add('open');
};

// ==========================================
// 8. MODALS & MODULES (MOBILE)
// ==========================================
window.openFullScreenModal = function(type) {
    const modal = document.getElementById('fullScreenModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    if(!modal) return;
    
    modal.classList.remove('hidden');
    
    if (type === 'transactions') {
        title.innerText = 'Recent Transactions';
        const recentTransactions = dashboardData.transactions.slice(0, 10);
        body.innerHTML = recentTransactions.length === 0 
            ? '<div style="text-align:center; padding: 40px; color:#8E8E93;">No transactions found.</div>'
            : recentTransactions.map(tx => `<div style="display:flex; justify-content:space-between; padding: 16px 0; border-bottom: 1px solid #E5E5EA;"><div><div style="font-weight:600; font-size:15px; color:#1C1C1E;">${tx.description}</div><div style="font-size:13px; color:#8E8E93; margin-top:4px;">${tx.date}</div></div><div style="font-weight:600; font-size:15px; color:${tx.type === 'inbound' ? 'var(--color-primary)' : '#1C1C1E'}">${tx.amount}</div></div>`).join('');
    } else if (type === 'applications') {
        title.innerText = 'Recent Applications';
        const recentApplications = dashboardData.applications;
        body.innerHTML = recentApplications.length === 0 
            ? '<div style="text-align:center; padding: 40px; color:#8E8E93;">No active applications found.</div>'
            : recentApplications.map(app => `<div style="padding: 16px 0; border-bottom: 1px solid #E5E5EA;"><div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span style="font-weight:600; font-size:15px; color:#1C1C1E;">${app.type}</span><span style="font-weight:600; font-size:15px;">${app.amount}</span></div><div style="display:flex; justify-content:space-between; font-size:13px; color:#8E8E93;"><span>${app.date}</span><span style="color:var(--color-primary); font-weight:500;">${app.status}</span></div></div>`).join('');
    }
};

window.closeFullScreenModal = function() {
    document.getElementById('fullScreenModal').classList.add('hidden');
};

// ==========================================
// 9. ACTIONS & EDIT APPLICATION LOGIC
// ==========================================
window.createNewApplication = function() {
    if (typeof loadPage === 'function') {
        loadPage('apply-loan');
    } else {
        window.location.href = '/user-portal/pages/apply-loan.html';
    }
};

window.makePayment = function() {
    alert('Payment functionality - Connect to payment gateway');
};

window.editApplication = async function(applicationId) {
    try {
        const { supabase } = await import('/Services/supabaseClient.js');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { alert('Please sign in to edit applications'); return; }
        
        const { data: app, error: fetchError } = await supabase.from('loan_applications').select('*').eq('id', applicationId).eq('user_id', session.user.id).single();
            
        if (fetchError || !app) { alert('Application not found'); return; }
        if (app.status === 'AFFORD_OK') { alert('This application cannot be edited. Affordability check has been completed.'); return; }
        if (app.status === 'READY_TO_DISBURSE') { alert('This application cannot be edited. Application is ready to disburse.'); return; }
        
        const hoursSinceCreation = (new Date() - new Date(app.created_at)) / (1000 * 60 * 60);
        if (hoursSinceCreation >= 2) { alert('This application can no longer be edited. Edit window expired after 2 hours.'); return; }
        
        const moduleContainer = document.getElementById('edit-module-container');
        const moduleContent = document.getElementById('edit-module-content');
        const response = await fetch('/user-portal/modules/edit-application.html');
        moduleContent.innerHTML = await response.text();
        moduleContainer.classList.remove('hidden');
        window.currentEditApplicationId = app.id;
        
        setTimeout(() => {
            document.getElementById('editAmount').value = app.amount || '';
            document.getElementById('editPurpose').value = app.purpose || '';
            document.getElementById('editPeriod').value = app.term_months || '';
            document.getElementById('editNotes').value = app.notes || '';
        }, 100);
    } catch (error) {
        console.error('Error editing application:', error);
        alert('Failed to load edit form');
    }
};

window.closeEditModal = function() {
    document.getElementById('edit-module-container').classList.add('hidden');
    window.currentEditApplicationId = null;
};

window.saveApplicationEdit = async function() {
    const saveBtn = document.getElementById('saveEditBtn');
    const statusMsg = document.getElementById('editStatusMessage');
    try {
        saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        const amount = parseFloat(document.getElementById('editAmount').value);
        const purpose = document.getElementById('editPurpose').value;
        const period = parseInt(document.getElementById('editPeriod').value);
        const notes = document.getElementById('editNotes').value;
        
        if (!amount || amount < 100 || amount > 10000) throw new Error('Please enter a valid amount between R100 and R10,000');
        if (!purpose) throw new Error('Please select a loan purpose');
        if (!period || period < 1 || period > 24) throw new Error('Please enter a valid period between 1 and 24 months');
        
        const { supabase } = await import('/Services/supabaseClient.js');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Session expired. Please sign in again');
        
        const { error: updateError } = await supabase.from('loan_applications').update({ amount, purpose, term_months: period, notes, updated_at: new Date().toISOString() }).eq('id', window.currentEditApplicationId).eq('user_id', session.user.id);
        if (updateError) throw updateError;
        
        statusMsg.textContent = 'Application updated successfully!'; statusMsg.className = 'status-message success show';
        setTimeout(() => { closeEditModal(); loadDashboardData(); }, 1500);
    } catch (error) {
        statusMsg.textContent = error.message || 'Failed to update application'; statusMsg.className = 'status-message error show';
        saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
};

window.deleteApplication = async function(applicationId) {
    try {
        const { supabase } = await import('/Services/supabaseClient.js');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { alert('Please sign in to delete applications'); return; }
        
        const { data: app, error: fetchError } = await supabase.from('loan_applications').select('created_at, status').eq('id', applicationId).eq('user_id', session.user.id).single();
        if (fetchError || !app) { alert('Application not found'); return; }
        if (app.status === 'READY_TO_DISBURSE') { alert('This application cannot be deleted. Application is ready to disburse.'); return; }
        
        const hoursSinceCreation = (new Date() - new Date(app.created_at)) / (1000 * 60 * 60);
        if (hoursSinceCreation >= 2) { alert('This application can no longer be deleted. Delete window expired after 2 hours.'); return; }
        if (!confirm(`Are you sure you want to delete application #${applicationId}? This action cannot be undone.`)) return;
        
        const { error: deleteError } = await supabase.from('loan_applications').delete().eq('id', applicationId).eq('user_id', session.user.id);
        if (deleteError) { alert('Failed to delete application'); return; }
        
        alert('Application deleted successfully');
        loadDashboardData();
    } catch (error) {
        alert('Failed to delete application');
    }
};

// ==========================================
// 10. INITIALIZATION ON LOAD
// ==========================================
const dateOpts = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
const todayDateString = new Date().toLocaleDateString('en-US', dateOpts);
if(document.getElementById('currentDate')) document.getElementById('currentDate').textContent = todayDateString;
if(document.getElementById('currentDateMobile')) document.getElementById('currentDateMobile').textContent = todayDateString;

populateActiveLoans();
populateTransactions();
populateApplications();
loadDashboardData();