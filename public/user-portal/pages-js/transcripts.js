// Transcripts page JS - Minimalist Score Card & Modals (Reason Only)
import '/user-portal/Services/sessionGuard.js'; 

let supabaseClient = null;
let activeUserId = null;
let isTranscriptsLoading = false;
let currentUploadDocType = null;

// Global State Caches for Modals
let cachedCreditChecks = [];
let cachedDocMap = {};

// Extracted from Dashboard Logic
const SCORE_RISK_COLORS = {
    'very low risk': '#10b981',
    'low risk': '#22c55e',
    'medium risk': 'var(--color-primary)', 
    'high risk': '#ef4444',
    'very high risk': '#dc2626'
};

const METRICS_CONFIG = [
    { key: 'total_accounts', label: 'Total Accounts' },
    { key: 'open_accounts', label: 'Open Accounts' },
    { key: 'closed_accounts', label: 'Closed Accounts' },
    { key: 'accounts_with_arrears', label: 'Accounts In Arrears' },
    { key: 'total_balance', label: 'Total Balance', formatter: formatCurrency },
    { key: 'total_monthly_payment', label: 'Monthly Instalments', formatter: formatCurrency },
    { key: 'total_arrears_amount', label: 'Total Arrears', formatter: formatCurrency },
    { key: 'total_enquiries', label: 'Enquiries (All Time)' },
    { key: 'total_judgments', label: 'Judgements' },
    { key: 'total_judgment_amount', label: 'Judgement Value', formatter: formatCurrency }
];

async function initTranscriptsPage(isManualRefresh = false) {
    if (isTranscriptsLoading) return;

    isTranscriptsLoading = true;
    toggleRefreshButton(true);
    setTranscriptsAlert('info', isManualRefresh ? 'Refreshing credit data...' : 'Loading your credit data...', true);

    try {
        if (!supabaseClient) {
            ({ supabase: supabaseClient } = await import('/Services/supabaseClient.js'));
        }

        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;

        activeUserId = session?.user?.id || null;
        if (!activeUserId) {
            setTranscriptsAlert('error', 'Please sign in to view your credit transcripts.', true);
            return;
        }

        cachedCreditChecks = await fetchCreditChecks();
        renderCreditSummary(cachedCreditChecks);
        await loadDocumentDownloads();

        setTranscriptsAlert('success', isManualRefresh ? 'Credit data refreshed just now.' : 'Credit data loaded.', false);
    } catch (err) {
        console.error('Failed to load transcripts:', err);
        setTranscriptsAlert('error', err.message || 'Unable to load transcripts.', true);
    } finally {
        isTranscriptsLoading = false;
        toggleRefreshButton(false);
    }
}

function toggleRefreshButton(isDisabled) {
    const btn = document.getElementById('refreshTranscriptsBtn');
    const icon = btn?.querySelector('i');
    if (btn && icon) {
        btn.disabled = isDisabled;
        if (isDisabled) {
            icon.classList.remove('fa-rotate');
            icon.classList.add('fa-circle-notch', 'fa-spin');
        } else {
            icon.classList.add('fa-rotate');
            icon.classList.remove('fa-circle-notch', 'fa-spin');
        }
    }
}

function setTranscriptsAlert(type, message, show = true) {
    const alertEl = document.getElementById('transcriptsAlert');
    const msgSpan = document.getElementById('alertMessage');
    const icon = alertEl?.querySelector('i');
    
    if (!alertEl || !msgSpan || !icon) return;
    
    alertEl.style.display = show ? 'flex' : 'none';
    alertEl.className = `transcripts-alert ${type}`;
    msgSpan.textContent = message;

    icon.className = 'fas'; 
    if (type === 'success') icon.classList.add('fa-check-circle');
    else if (type === 'error') icon.classList.add('fa-exclamation-triangle');
    else icon.classList.add('fa-circle-notch', 'fa-spin');
    
    if (type === 'success' && show) {
        setTimeout(() => { alertEl.style.display = 'none'; }, 3000);
    }
}

async function fetchCreditChecks() {
    const { data, error } = await supabaseClient
        .from('credit_checks')
        .select('*')
        .eq('user_id', activeUserId)
        .order('checked_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

// Minimalist Design Renderer
function renderCreditSummary(rows) {
    const latest = rows?.[0] || null;
    
    setTextContent('creditScoreValue', latest?.credit_score ?? '—');
    
    const riskEl = document.getElementById('creditRiskValue');
    if (riskEl) {
        const riskText = latest?.risk_category || latest?.score_band || 'Pending';
        riskEl.textContent = riskText;
        
        // Apply color mapping
        const riskLabel = riskText.toLowerCase();
        riskEl.style.backgroundColor = SCORE_RISK_COLORS[riskLabel] || 'var(--color-primary)';
    }

    // Only display the Reason now
    const recReason = latest?.recommendation_reason || 'Upload a credit report to see detailed insights.';
    setTextContent('creditReasonValue', recReason);
    
    setTextContent('creditCheckedAt', latest?.checked_at ? `Updated: ${formatDate(latest.checked_at)}` : 'No record');

    renderMetricsGrid(latest);
}

function renderMetricsGrid(latest) {
    const grid = document.getElementById('creditMetricsGrid');
    if (!grid) return;

    if (!latest) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:20px; color:var(--text-muted);">No detailed metrics available yet.</div>';
        return;
    }

    grid.innerHTML = METRICS_CONFIG.map(({ key, label, formatter }) => {
        const rawValue = latest[key];
        const value = rawValue == null ? '—' : formatter ? formatter(rawValue) : formatNumber(rawValue);
        return `
            <div class="metric-tile">
                <h4>${label}</h4>
                <p>${value}</p>
            </div>
        `;
    }).join('');
}

async function loadDocumentDownloads() {
    const docTypes = ['till_slip', 'bank_statement'];
    const { data, error } = await supabaseClient
        .from('document_uploads')
        .select('id, file_name, file_type, file_path, uploaded_at')
        .eq('user_id', activeUserId)
        .in('file_type', docTypes)
        .order('uploaded_at', { ascending: false });

    if (!error) {
        cachedDocMap = {}; 
        (data || []).forEach((doc) => {
            if (!cachedDocMap[doc.file_type]) {
                cachedDocMap[doc.file_type] = doc;
            }
        });
    }
}

// ==========================================
// MODAL & UPLOAD LOGIC
// ==========================================
window.openUniversalModal = function(title, bodyHTML, isFullScreen = false) {
    const modal = document.getElementById('modern-universal-modal');
    const titleEl = document.getElementById('modern-modal-title');
    const bodyEl = document.getElementById('modern-modal-body');
    if (!modal) return;
    
    titleEl.innerText = title;
    bodyEl.innerHTML = bodyHTML;
    
    if (isFullScreen) modal.classList.add('is-full-screen');
    else modal.classList.remove('is-full-screen');
    
    modal.classList.remove('hidden');
};

window.closeUniversalModal = function() {
    document.getElementById('modern-universal-modal').classList.add('hidden');
};

window.openHistoryModal = function() {
    if (!cachedCreditChecks || cachedCreditChecks.length === 0) {
        openUniversalModal('Previous Checks', '<div class="empty-state">No previous bureau checks have been recorded.</div>', true);
        return;
    }

    // Modal updated to show Risk and Reason (taking up the full width below the score)
    const html = `<div class="full-screen-content-wrapper">` + cachedCreditChecks.map((row) => `
        <div class="modern-list-item">
            <div class="modern-item-header">
                <span class="modern-item-id">${row.bureau_name || 'Bureau Check'}</span>
                <span class="status-badge" style="background:rgba(231,118,46,0.1); color:var(--color-primary);">${formatDate(row.checked_at)}</span>
            </div>
            <div class="modern-item-grid">
                <div class="modern-grid-col"><div class="label">Score</div><div class="val">${row.credit_score ?? '—'}</div></div>
                <div class="modern-grid-col"><div class="label">Risk Level</div><div class="val">${row.risk_category || row.score_band || '—'}</div></div>
                <div class="modern-grid-col" style="grid-column: 1 / -1;">
                    <div class="label">Reason</div>
                    <div class="val" style="font-weight: 500; line-height: 1.5;">${row.recommendation_reason || 'No specific reason provided.'}</div>
                </div>
            </div>
        </div>
    `).join('') + `</div>`;

    openUniversalModal('Previous Checks', html, true);
};

window.openDocModal = function(type) {
    let html = '<div class="full-screen-content-wrapper" id="modalDocContainer">';
    let title = '';
    let dbType = '';

    if (type === 'payslip') {
        title = 'Payslip Document';
        dbType = 'till_slip';
    } else if (type === 'bank_statement') {
        title = 'Bank Statement';
        dbType = 'bank_statement';
    }

    // Render Upload Button FIRST
    html += `
        <button id="modalUploadBtn" class="action-btn" onclick="triggerFileUpload('${dbType}')" style="width: 100%; margin-bottom: 8px; border: 2px dashed #E5E5EA; background: var(--color-white); color: var(--text-main); height: 64px;">
            <i class="fas fa-cloud-upload-alt text-primary"></i> Upload New ${title}
        </button>
    `;

    // Then render the Document Card or Empty State below it
    const doc = cachedDocMap[dbType];
    if (!doc) {
        html += `<div class="empty-state"><i class="fas fa-file-upload" style="font-size:48px; color:#E5E5EA; margin-bottom:16px; display:block;"></i>No ${title.toLowerCase()} uploaded yet.</div>`;
    } else {
        html += buildDocCardHTML(doc.file_name, doc.uploaded_at, doc.file_path);
    }

    html += '</div>';
    openUniversalModal(title, html, true);
};

function buildDocCardHTML(name, date, url) {
    return `
        <div class="modern-list-item" style="margin-top: 8px;">
            <div class="modern-item-header" style="border-bottom:none; padding-bottom:0;">
                <div>
                    <div class="modern-item-id">${name}</div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:4px; font-weight:500;">Uploaded: ${formatDate(date)}</div>
                </div>
                <button class="action-btn primary" onclick="window.open('${url}', '_blank', 'noopener')" style="height: 40px; padding: 0 20px; font-size: 13px;">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        </div>
    `;
}

// --- SECURE FILE UPLOAD LOGIC ---
window.triggerFileUpload = function(dbType) {
    currentUploadDocType = dbType;
    document.getElementById('hiddenDocUpload').click();
};

document.getElementById('hiddenDocUpload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const btn = document.getElementById('modalUploadBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin text-primary"></i> Uploading...';
    }

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${activeUserId}/${currentUploadDocType}_${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('documents')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseClient.storage
            .from('documents')
            .getPublicUrl(fileName);

        const { error: dbError } = await supabaseClient
            .from('document_uploads')
            .insert([{
                user_id: activeUserId,
                file_name: file.name,
                file_type: currentUploadDocType,
                file_path: publicUrl
            }]);

        if (dbError) throw dbError;

        await loadDocumentDownloads();
        
        const originalUiType = currentUploadDocType === 'till_slip' ? 'payslip' : 'bank_statement';
        openDocModal(originalUiType);
        
        setTranscriptsAlert('success', 'Document uploaded successfully!', true);

    } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload document. Please try again.');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-cloud-upload-alt text-primary"></i> Try Again';
        }
    } finally {
        e.target.value = ''; 
    }
});


// ==========================================
// UTILS
// ==========================================

function formatCurrency(value) {
    if (typeof value !== 'number') return '—';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value) {
    if (value == null) return '—';
    return new Intl.NumberFormat('en-ZA').format(value);
}

function formatDate(value) {
    if (!value) return '—';
    return new Intl.DateTimeFormat('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

function setTextContent(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = value;
}

function bootTranscriptsPage() {
    const refreshBtn = document.getElementById('refreshTranscriptsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => initTranscriptsPage(true));
    }
    initTranscriptsPage();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootTranscriptsPage, { once: true });
} else {
    bootTranscriptsPage();
}

window.addEventListener('pageLoaded', (event) => {
    if (event?.detail?.pageName === 'transcripts') {
        bootTranscriptsPage();
    }
});