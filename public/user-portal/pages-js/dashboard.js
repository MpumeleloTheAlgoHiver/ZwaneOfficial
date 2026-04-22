// Dashboard page JS - Final Production Hybrid
import '/user-portal/Services/sessionGuard.js'; 

// ==========================================
// 1. DATA STATE & CONSTANTS
// ==========================================
const dashboardData = {
    currentBalance: 0,
    nextPayment: { amount: 0, date: null, hasUpcoming: false },
    creditScore: 0,
    totalBorrowed: 0,
    totalRepaid: 0,
    repaymentSeries: null,
    loans: [],
    transactions: [],
    applications: []
};

// Pagination State
let currentLoansPage = 1;
const LOANS_PER_PAGE = 5;

const CREDIT_SCORE_MAX = 999;
const SCORE_RISK_COLORS = {
    'very low risk': { gradient: 'linear-gradient(90deg, #10b981, #22d3ee)', accent: '#10b981' },
    'low risk': { gradient: 'linear-gradient(90deg, #22c55e, #a3e635)', accent: '#22c55e' },
    'medium risk': { gradient: 'linear-gradient(90deg, var(--color-secondary), var(--color-tertiary))', accent: 'var(--color-secondary)' },
    'high risk': { gradient: 'linear-gradient(90deg, var(--color-secondary), #ef4444)', accent: '#ef4444' },
    'very high risk': { gradient: 'linear-gradient(90deg, #dc2626, #7f1d1d)', accent: '#dc2626' }
};

let repaymentChart, loanBreakdownChart;
const currencyFormatter = new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getThemePalette = () => {
    const styles = getComputedStyle(document.documentElement);
    const read = (name, fallback) => (styles.getPropertyValue(name).trim() || fallback);
    const primaryRgb = read('--color-primary-rgb', '231 118 46');
    return {
        primary: read('--color-primary', '#E7762E'),
        surfaceCard: read('--color-surface-card', '#FFFFFF'),
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
// 3. UI RENDERING: CAROUSEL
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

    let paymentSubtitle = 'No upcoming payment';
    if (dashboardData.nextPayment.hasUpcoming && dashboardData.nextPayment.date) {
        paymentSubtitle = `Due ${formatDueDate(dashboardData.nextPayment.date)}`;
    } else if (!dashboardData.nextPayment.hasUpcoming && dashboardData.nextPayment.date) {
        paymentSubtitle = `Last paid ${formatDueDate(dashboardData.nextPayment.date)}`;
    }

    const slides = [
        { label: 'Next Payment Due', value: formatCurrency(dashboardData.nextPayment.amount), subtitle: paymentSubtitle },
        { label: 'Outstanding Balance', value: formatCurrency(dashboardData.currentBalance), subtitle: 'Total principal remaining' },
        { label: 'Credit Score', value: dashboardData.creditScore || '---', subtitle: 'Excellent Financial Standing' },
        { label: 'Total Repaid', value: formatCurrency(dashboardData.totalRepaid), subtitle: 'Successfully settled' },
        { label: 'Total Borrowed', value: formatCurrency(dashboardData.totalBorrowed), subtitle: 'Lifetime capacity' }
    ];

    container.innerHTML = slides.map(slide => `
        <div class="snap-card">
            <button class="hide-eye-btn" onclick="toggleFigureVisibility(this)">
                <i class="fas fa-eye"></i>
            </button>
            <div class="card-content">
                <p class="card-label">${slide.label}</p>
                <h2 class="card-value">${slide.value}</h2>
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
// 4. UI RENDERING: DESKTOP SCORE & PAGINATION
// ==========================================
function applyCreditScoreToDashboard(creditData) {
    const scoreElement = document.getElementById('creditScore');
    const scoreFill = document.querySelector('.credit-score-card .score-fill');
    if (!scoreElement || !scoreFill) return;

    if (!creditData) {
        scoreElement.textContent = '---';
        scoreFill.style.width = '0%';
        return;
    }

    const rawScore = Number(creditData.credit_score ?? creditData.score ?? 0);
    const clampedScore = Math.max(0, Math.min(rawScore, CREDIT_SCORE_MAX));
    const percentage = Math.round((clampedScore / CREDIT_SCORE_MAX) * 100);
    
    scoreElement.textContent = clampedScore.toString();
    const riskLabel = (creditData.score_band || 'Medium Risk').toLowerCase();
    const colorMeta = SCORE_RISK_COLORS[riskLabel] || SCORE_RISK_COLORS['medium risk'];
    
    scoreFill.style.width = `${percentage}%`;
    scoreFill.style.background = colorMeta.gradient;
    dashboardData.creditScore = clampedScore;
}

window.changeLoanPage = function(direction) {
    const active = dashboardData.loans.filter(l => l.status === 'Active' || l.status === 'Offered');
    const maxPage = Math.ceil(active.length / LOANS_PER_PAGE) || 1;
    currentLoansPage += direction;
    if (currentLoansPage < 1) currentLoansPage = 1;
    if (currentLoansPage > maxPage) currentLoansPage = maxPage;
    populateActiveLoans();
};

function getPaginationHtml(totalItems) {
    const maxPage = Math.ceil(totalItems / LOANS_PER_PAGE) || 1;
    if (maxPage <= 1) return '';
    return `
        <div class="pagination-controls">
            <button class="page-btn" onclick="changeLoanPage(-1)" ${currentLoansPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
            <span class="page-indicator">Page ${currentLoansPage} of ${maxPage}</span>
            <button class="page-btn" onclick="changeLoanPage(1)" ${currentLoansPage === maxPage ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
        </div>
    `;
}

// ==========================================
// 5. UI RENDERING: LISTS (DESKTOP & MOBILE)
// ==========================================
function populateActiveLoans() {
    const allActive = dashboardData.loans.filter(l => l.status === 'Active' || l.status === 'Offered');
    
    const startIdx = (currentLoansPage - 1) * LOANS_PER_PAGE;
    const activePaginated = allActive.slice(startIdx, startIdx + LOANS_PER_PAGE);
    const paginationHtml = getPaginationHtml(allActive.length);

    // Desktop Updates
    const desktopGrid = document.getElementById('activeLoansGrid');
    if (desktopGrid) {
        if (allActive.length === 0) {
            desktopGrid.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 40px; grid-column: 1/-1;">No active loans found.</div>';
        } else {
            desktopGrid.innerHTML = activePaginated.map(loan => {
                const progress = loan.rawTotal > 0 ? Math.max(0, Math.min(100, Math.round(((loan.rawTotal - loan.rawRemaining) / loan.rawTotal) * 100))) : 0;
                return `
                    <div class="loan-card">
                        <div class="loan-header"><span class="loan-id">${loan.id}</span><span class="loan-status">${loan.status}</span></div>
                        <div class="loan-amount">${loan.amount}</div>
                        <div class="loan-details-grid">
                            <div class="loan-detail"><div class="loan-detail-label">Remaining</div><div class="loan-detail-value">${loan.remaining}</div></div>
                            <div class="loan-detail"><div class="loan-detail-label">Next Payment</div><div class="loan-detail-value">${loan.nextPayment}</div></div>
                            <div class="loan-detail"><div class="loan-detail-label">Due Date</div><div class="loan-detail-value">${loan.dueDate}</div></div>
                            <div class="loan-detail"><div class="loan-detail-label">Interest Rate</div><div class="loan-detail-value">${loan.interestRate}</div></div>
                        </div>
                        <div class="progress-section">
                            <div class="progress-header"><span class="progress-label">Repayment Progress</span><span class="progress-percentage">${progress}%</span></div>
                            <div class="progress-bar"><div class="progress-fill" style="width: ${progress}%"></div></div>
                        </div>
                    </div>`;
            }).join('');
            
            const wrapper = document.getElementById('activeLoansGridWrapper');
            if(wrapper) {
                const oldPg = wrapper.querySelector('.pagination-controls');
                if(oldPg) oldPg.remove();
                wrapper.insertAdjacentHTML('beforeend', paginationHtml);
            }
        }
    }

    // Mobile Updates
    const mobileGrid = document.getElementById('activeLoansGridMobile');
    if (mobileGrid) {
        if (allActive.length === 0) {
            mobileGrid.innerHTML = '<div class="empty-loans-state">You have no active loans right now.</div>';
        } else {
            mobileGrid.innerHTML = activePaginated.map(loan => {
                const progress = loan.rawTotal > 0 ? Math.max(0, Math.min(100, Math.round(((loan.rawTotal - loan.rawRemaining) / loan.rawTotal) * 100))) : 0;
                return `
                    <div class="loan-card-hifi">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center;">
                            <span style="font-size: 13px; font-weight: 600; color: var(--text-muted);">${loan.id}</span>
                            <span style="background: rgba(231,118,46,0.1); color: var(--color-primary); padding: 6px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${loan.status}</span>
                        </div>
                        <div style="font-size: 32px; font-weight: 700; color: var(--text-main); margin-bottom: 20px; letter-spacing: -1px;">${loan.amount}</div>
                        
                        <div class="loan-hifi-details">
                            <div class="detail-item"><span class="label">Remaining</span><span class="val">${loan.remaining}</span></div>
                            <div class="detail-item"><span class="label">Next Due</span><span class="val">${loan.nextPayment}</span></div>
                            <div class="detail-item"><span class="label">Due Date</span><span class="val">${loan.dueDate}</span></div>
                            <div class="detail-item"><span class="label">Interest</span><span class="val">${loan.interestRate}</span></div>
                        </div>

                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; font-weight: 600; color: var(--text-muted);">
                            <span>Repayment Progress</span><span>${progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%;"></div>
                        </div>
                    </div>`;
            }).join('') + paginationHtml; 
        }
    }
}

function populateTransactions() {
    const transactionList = document.getElementById('transactionList');
    if (!transactionList) return;
    const recentTransactions = dashboardData.transactions.slice(0, 5);
    if (recentTransactions.length === 0) {
        transactionList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No transactions yet</p>'; return;
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
        applicationList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No applications yet</p>'; return;
    }
    applicationList.innerHTML = recentApplications.map(app => {
        const now = new Date();
        const createdAt = new Date(app.createdAt);
        const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
        const withinTimeWindow = hoursSinceCreation < 2;
        
        const canEdit = withinTimeWindow && app.status !== 'AFFORD_OK' && app.status !== 'READY_TO_DISBURSE';
        const canDelete = withinTimeWindow && app.status !== 'READY_TO_DISBURSE';
        
        const editLockReason = app.status === 'AFFORD_OK' ? 'Edit locked' : app.status === 'READY_TO_DISBURSE' ? 'Edit locked' : 'Edit locked after 2 hours';
        const deleteLockReason = app.status === 'READY_TO_DISBURSE' ? 'Delete locked' : 'Delete locked after 2 hours';

        return `
        <div class="application-item">
            <div class="application-icon ${app.status.toLowerCase()}"><i class="fas fa-${app.status === 'Approved' ? 'check' : app.status === 'Pending' ? 'clock' : 'times'}"></i></div>
            <div class="item-details"><div class="item-title">${app.type}</div><div class="item-date">${app.date}</div></div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="status-badge ${app.status.toLowerCase()}">${app.status}</span>
                <button class="app-action-btn ${!canEdit ? 'locked' : ''}" onclick="editApplication('${app.rawId}')" ${!canEdit ? 'disabled' : ''} title="${!canEdit ? editLockReason : 'Edit'}">
                    <i class="fas fa-${!canEdit ? 'lock' : 'edit'}"></i>
                </button>
                <button class="app-action-btn delete ${!canDelete ? 'locked' : ''}" onclick="deleteApplication('${app.rawId}')" ${!canDelete ? 'disabled' : ''} title="${!canDelete ? deleteLockReason : 'Delete'}">
                    <i class="fas fa-${!canDelete ? 'lock' : 'trash'}"></i>
                </button>
            </div>
        </div>`;
    }).join('');
}

// ==========================================
// 6. CHARTS & VISUALIZATIONS
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
// 7. SUPABASE ENGINE
// ==========================================
async function loadDashboardData() {
    try {
        const { supabase } = await import('/Services/supabaseClient.js');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        await hydrateCreditScore(supabase, session.user.id);
        
        // Fetch payments for "Last paid" fallback
        const { data: payments } = await supabase.from('payments').select('loan_id, amount, payment_date').eq('user_id', session.user.id).order('payment_date', { ascending: false });
        
        let latestPaymentDate = null;
        if (payments && payments.length > 0) {
            latestPaymentDate = payments[0].payment_date;
        }

        const paymentsByLoan = (payments || []).reduce((acc, payment) => {
            acc[payment.loan_id] = (acc[payment.loan_id] || 0) + (Number(payment.amount) || 0); return acc;
        }, {});
        const totalRepaidAllLoans = (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        const { data: loans } = await supabase.from('loans').select('*').eq('user_id', session.user.id).eq('status', 'active').order('created_at', { ascending: false });
        
        if (loans && loans.length > 0) {
            const enrichedLoans = loans.map((loan) => {
                const principal = Number(loan.principal_amount) || 0;
                const termMonths = Number(loan.term_months) || 1;
                const rawRate = Number(loan.interest_rate) || 0;
                const normalizedRate = rawRate > 1 ? rawRate / 100 : rawRate;
                const monthlyPayment = Number(loan.monthly_payment) || calculateMonthlyPayment(principal, normalizedRate, termMonths);
                
                // Deep Date Check
                let dueDateObj = null;
                const candidateDateStr = loan.next_payment_date || loan.first_payment_date || loan.repayment_start_date;
                
                if (candidateDateStr) {
                    dueDateObj = new Date(candidateDateStr);
                } else if (loan.start_date) {
                    dueDateObj = new Date(loan.start_date);
                    dueDateObj.setDate(dueDateObj.getDate() + 30); // Assume 30 days from start if totally blank
                }

                if (dueDateObj && !Number.isNaN(dueDateObj.getTime())) { 
                    dueDateObj.setUTCHours(0, 0, 0, 0); 
                } else {
                    dueDateObj = null;
                }

                const totalRepayment = Number(loan.total_repayment) || (monthlyPayment * termMonths) || principal;
                const paidToDate = paymentsByLoan[loan.id] || 0;
                const outstandingBalance = Math.max(totalRepayment - paidToDate, 0);
                const nextDueAmount = monthlyPayment > 0 ? Math.min(monthlyPayment, outstandingBalance) : outstandingBalance;
                
                return { 
                    ...loan, principal, termMonths, normalizedRate, monthlyPayment, 
                    nextDueAmount, dueDateObj, outstandingBalance, totalRepayment, paidToDate 
                };
            });

            const loanTotals = enrichedLoans.reduce((acc, loan) => {
                acc.borrowed += loan.principal; acc.outstanding += loan.outstandingBalance; acc.repaid += loan.paidToDate || 0; return acc;
            }, { borrowed: 0, outstanding: 0, repaid: 0 });

            dashboardData.totalBorrowed = loanTotals.borrowed;
            dashboardData.currentBalance = loanTotals.outstanding;
            dashboardData.totalRepaid = loanTotals.repaid || totalRepaidAllLoans;

            // Find the most immediate upcoming payment that has an outstanding balance
            const upcomingPayment = enrichedLoans.reduce((best, loan) => {
                if (!loan.dueDateObj) return best;
                if (loan.outstandingBalance <= 0) return best; 
                if (!best) return loan;
                if (loan.dueDateObj < best.dueDateObj) return loan;
                return best;
            }, null);

            if (upcomingPayment && upcomingPayment.dueDateObj) {
                dashboardData.nextPayment = { 
                    amount: upcomingPayment.nextDueAmount, 
                    date: upcomingPayment.dueDateObj.toISOString(),
                    hasUpcoming: true 
                };
            } else {
                dashboardData.nextPayment = { 
                    amount: 0, 
                    date: latestPaymentDate, 
                    hasUpcoming: false 
                };
            }

            dashboardData.loans = enrichedLoans.map(loan => {
                const readableStatus = loan.status ? `${loan.status.charAt(0).toUpperCase()}${loan.status.slice(1).toLowerCase()}` : 'Active';
                return {
                    id: `LOAN-${loan.id}`,
                    amount: formatCurrency(loan.totalRepayment || loan.principal),
                    remaining: formatCurrency(loan.outstandingBalance),
                    nextPayment: formatCurrency(loan.nextDueAmount),
                    dueDate: loan.dueDateObj ? loan.dueDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD',
                    interestRate: `${(loan.normalizedRate * 100).toFixed(2)}%`,
                    status: readableStatus,
                    rawTotal: loan.totalRepayment || loan.principal,
                    rawRemaining: loan.outstandingBalance
                };
            });
        } else {
            dashboardData.nextPayment = { amount: 0, date: latestPaymentDate, hasUpcoming: false };
            dashboardData.totalBorrowed = 0; 
            dashboardData.currentBalance = 0; 
            dashboardData.totalRepaid = totalRepaidAllLoans;
        }

        // Sync Desktop DOM IDs manually
        document.getElementById('totalBorrowed').textContent = formatCurrency(dashboardData.totalBorrowed);
        document.getElementById('currentBalance').textContent = formatCurrency(dashboardData.currentBalance);
        document.getElementById('totalRepaid').textContent = formatCurrency(dashboardData.totalRepaid);
        
        const nxtAmt = document.getElementById('nextPaymentAmount');
        const nxtDt = document.getElementById('nextPaymentDate');
        if (nxtAmt) nxtAmt.textContent = formatCurrency(dashboardData.nextPayment.amount);
        if (nxtDt) {
            if (dashboardData.nextPayment.hasUpcoming && dashboardData.nextPayment.date) {
                nxtDt.textContent = `Due ${formatDueDate(dashboardData.nextPayment.date)}`;
            } else if (!dashboardData.nextPayment.hasUpcoming && dashboardData.nextPayment.date) {
                nxtDt.textContent = `Last paid ${formatDueDate(dashboardData.nextPayment.date)}`;
            } else {
                nxtDt.textContent = 'No upcoming payment';
            }
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
        
        populateDashboardMetrics(); // Rebuilds mobile carousel with live real data
        populateActiveLoans();      // Rebuilds both grids

    } catch (error) { console.error('Error loading dashboard data:', error); }
}

async function hydrateCreditScore(supabase, userId) {
    try {
        const { data } = await supabase.from('credit_checks').select('*').eq('user_id', userId).order('checked_at', { ascending: false }).limit(1).maybeSingle();
        applyCreditScoreToDashboard(data);
    } catch (err) { applyCreditScoreToDashboard(null); }
}

// ==========================================
// 8. UNIVERSAL PRODUCTION MODALS
// ==========================================
window.openUniversalModal = function(title, bodyHTML, isFullScreen = false) {
    const modal = document.getElementById('modern-universal-modal');
    const titleEl = document.getElementById('modern-modal-title');
    const bodyEl = document.getElementById('modern-modal-body');
    if (!modal) return;
    
    titleEl.innerText = title;
    bodyEl.innerHTML = bodyHTML;
    
    if (isFullScreen) {
        modal.classList.add('is-full-screen');
    } else {
        modal.classList.remove('is-full-screen');
    }
    
    modal.classList.remove('hidden');
};

window.closeUniversalModal = function() {
    document.getElementById('modern-universal-modal').classList.add('hidden');
};

window.openLoansModule = function() {
    const active = dashboardData.loans.filter(l => l.status === 'Active' || l.status === 'Offered');
    const totalRepayment = active.reduce((sum, l) => sum + l.rawTotal, 0);
    const totalRemaining = active.reduce((sum, l) => sum + l.rawRemaining, 0);

    // Full Screen specific styling wrappers
    const statsHtml = `
        <div class="full-screen-content-wrapper">
            <div class="modal-stat-row" style="margin-top: 10px;">
                <div class="modal-stat-box" style="margin-bottom:20px;">
                    <div class="modal-stat-label">Active Balance</div>
                    <div class="modal-stat-val">${formatCurrency(totalRemaining)}</div>
                </div>
            </div>`;

    const listHtml = active.length === 0 ? '<div style="text-align:center; padding:40px; color:var(--text-muted);">No active loans found.</div></div>' : active.map(loan => `
            <div class="modern-list-item">
                <div class="modern-item-header">
                    <span class="modern-item-id">${loan.id}</span>
                    <span class="status-badge" style="background:rgba(231,118,46,0.1); color:var(--color-primary); padding:6px 12px; border-radius:100px; font-size:11px; font-weight:700;">${loan.status}</span>
                </div>
                <div class="modern-item-grid">
                    <div class="modern-grid-col"><div class="label">Amount</div><div class="val">${loan.amount}</div></div>
                    <div class="modern-grid-col"><div class="label">Remaining</div><div class="val">${loan.remaining}</div></div>
                    <div class="modern-grid-col"><div class="label">Next Due</div><div class="val">${loan.nextPayment}</div></div>
                    <div class="modern-grid-col"><div class="label">Due Date</div><div class="val">${loan.dueDate}</div></div>
                </div>
            </div>`).join('') + '</div>';

    // TRUE forces CSS into Full Screen mode
    openUniversalModal('Active Loans', statsHtml + listHtml, true);
};

window.openApplicationsModule = function() {
    const apps = dashboardData.applications;
    const statsHtml = `<div class="modal-stat-row" style="margin-top: 10px;"><div class="modal-stat-box" style="margin-bottom:20px;"><div class="modal-stat-label">Total Requests</div><div class="modal-stat-val">${apps.length}</div></div></div>`;
    const listHtml = apps.length === 0 ? '<div style="text-align:center; padding:40px; color:var(--text-muted);">No active requests.</div>' : apps.map(app => `
        <div class="modern-list-item">
            <div class="modern-item-header">
                <span class="modern-item-id">${app.id}</span>
                <span class="status-badge" style="background:#f4f4f5; color:#666; padding:4px 10px; border-radius:100px; font-size:11px; font-weight:700;">${app.status}</span>
            </div>
            <div class="modern-item-grid">
                <div class="modern-grid-col"><div class="label">Purpose</div><div class="val">${app.type}</div></div>
                <div class="modern-grid-col"><div class="label">Amount</div><div class="val">${app.amount}</div></div>
                <div class="modern-grid-col"><div class="label">Date</div><div class="val">${app.date}</div></div>
            </div>
        </div>`).join('');

    openUniversalModal('Recent Applications', statsHtml + listHtml, false);
};

window.openTransactionsModule = function() {
    openUniversalModal('Transactions', '<div style="text-align:center; padding:40px; color:var(--text-muted); font-weight:500;">No transactions to display yet.</div>', false);
};

// Mobile Full Screen Modals (Bottom Sheet) Overrides
window.openFullScreenModal = function(type) {
    const modal = document.getElementById('fullScreenModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    if(!modal) return;
    
    modal.classList.remove('hidden');
    if (type === 'transactions') {
        title.innerText = 'History';
        body.innerHTML = '<div style="text-align:center; padding: 40px; color:var(--text-muted); font-weight:500;">No transactions found.</div>';
    } else if (type === 'applications') {
        title.innerText = 'Requests';
        body.innerHTML = dashboardData.applications.length === 0 
            ? '<div style="text-align:center; padding: 40px; color:var(--text-muted); font-weight:500;">No requests found.</div>'
            : dashboardData.applications.map(app => `
                <div class="modern-list-item" style="padding: 20px; margin-bottom: 12px; border: none;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                        <span style="font-weight:700; font-size:16px; color:var(--text-main);">${app.type}</span>
                        <span style="font-weight:700; font-size:16px; color:var(--text-main);">${app.amount}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text-muted); font-weight:600;">
                        <span>${app.date}</span>
                        <span style="color:var(--color-primary); background: rgba(231,118,46,0.1); padding: 4px 10px; border-radius: 10px;">${app.status}</span>
                    </div>
                </div>`).join('');
    }
};

window.closeFullScreenModal = function() { document.getElementById('fullScreenModal').classList.add('hidden'); };

// ==========================================
// 9. ACTIONS & ROUTING
// ==========================================
window.createNewApplication = () => {
    if (typeof loadPage === 'function') {
        loadPage('apply-loan');
    } else {
        window.location.href = '/user-portal/pages/apply-loan.html';
    }
};

window.makePayment = () => {
    const html = `
        <div style="text-align: center; padding: 8px 0 4px;">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: #FFF3E0; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
            </div>
            <p style="color: var(--text-main); font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
                Online payments are <strong>coming soon</strong>.
            </p>
            <p style="color: var(--text-sub); font-size: 13px; line-height: 1.6; margin: 0 0 20px;">
                Please contact your loan officer or visit a branch to make a payment at this time.
            </p>
            <div style="display: flex; justify-content: center; width: 100%;">
                <button onclick="closeUniversalModal()" class="action-btn primary" style="width: 200px !important; max-width: 200px !important; margin: 0 auto !important; padding: 12px 24px;">
                    Got it
                </button>
            </div>
        </div>`;
    if (typeof openUniversalModal === 'function') {
        openUniversalModal('Payment Gateway', html, false);
    } else {
        alert('Payment functionality coming soon.');
    }
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