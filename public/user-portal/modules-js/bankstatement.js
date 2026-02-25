import { supabase } from '/Services/supabaseClient.js';
import { getDocumentInfoByUser } from '/user-portal/Services/documentService.js';

async function initBankStatementModule() {
  const status = document.getElementById('truidStatusMessage');
  const connectBtn = document.getElementById('truidConnectBtn');
  const manualUploadBtn = document.getElementById('manualBankUploadBtn');
  const manualFileInput = document.getElementById('manualBankFile');
  const manualSelectedFile = document.getElementById('manualBankSelectedFile');
  const checkmark = document.getElementById('bankstatementCheckmark');
  const existingInfo = document.getElementById('existingFileInfo');
  const statusChip = document.getElementById('bankstatementStatusChip');
  let statusPollInterval = null;

  if (!status || !connectBtn) {
    console.warn('⚠️ Bank statement module DOM not ready');
    return;
  }

  if (connectBtn.dataset.bound === 'true') {
    return;
  }
  connectBtn.dataset.bound = 'true';

  const applicationId = sessionStorage.getItem('currentApplicationId') || sessionStorage.getItem('lastApplicationId');
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  if (!userId) {
    console.warn('⚠️ User not logged in');
    status.textContent = '⚠️ Please log in first';
    status.style.color = '#ff9800';
    connectBtn.disabled = true;
    connectBtn.textContent = 'Please Log In';
    if (manualUploadBtn) {
      manualUploadBtn.disabled = true;
      manualUploadBtn.textContent = 'Please Log In';
    }
    return;
  }

  console.log('✅ Ready for TruID bank statement connection', { applicationId: applicationId || 'none', userId });

  const applyVerifiedState = (details = {}) => {
    const normalizedStatus = (details.status || '').toString().toLowerCase();
    const isCaptured = Boolean(
      details.capturedAt
      || details.captured_at
      || details.source === 'truid_collections'
      || ['captured', 'data_ready', 'ready', 'completed'].includes(normalizedStatus)
    );

    if (checkmark) checkmark.classList.add('visible');
    if (connectBtn) {
      connectBtn.disabled = true;
      connectBtn.style.opacity = '0.5';
      connectBtn.style.cursor = 'not-allowed';
      connectBtn.textContent = isCaptured ? 'Statement Captured ✓' : 'Bank Connected ✓';
    }

    if (manualUploadBtn) {
      manualUploadBtn.disabled = true;
      manualUploadBtn.style.opacity = '0.5';
      manualUploadBtn.style.cursor = 'not-allowed';
      manualUploadBtn.textContent = 'Uploaded/Connected ✓';
    }

    if (manualFileInput) {
      manualFileInput.disabled = true;
    }

    if (statusChip) {
      statusChip.textContent = isCaptured ? 'Captured' : 'Connected';
      statusChip.classList.add('success');
    }

    if (existingInfo) {
      const connectedDate = new Date(details.capturedAt || details.captured_at || details.last_updated || details.updatedAt || Date.now()).toLocaleDateString();
      existingInfo.style.color = '#1f8c5c';
      existingInfo.innerHTML = isCaptured
        ? `✓ TruID data captured on ${connectedDate}`
        : `✓ Bank connected via TruID on ${connectedDate}`;
    }

    if (statusPollInterval) {
      clearInterval(statusPollInterval);
      statusPollInterval = null;
    }
  };

  const setManualUploadedState = (filename, uploadedAt) => {
    applyVerifiedState({
      capturedAt: uploadedAt || new Date().toISOString(),
      status: 'captured',
      source: 'manual_upload'
    });

    status.textContent = 'Bank statement uploaded successfully.';
    status.style.color = '#28a745';

    if (existingInfo) {
      const uploadDate = new Date(uploadedAt || Date.now()).toLocaleDateString();
      existingInfo.innerHTML = `✓ Manual upload received: <b>${filename}</b> on ${uploadDate}`;
      existingInfo.style.color = '#1f8c5c';
    }
  };

  const fetchTruidStatus = async () => {
    const response = await fetch(`/api/banking/status?userId=${encodeURIComponent(userId)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to check TruID status');
    }

    if (data.verified) {
      applyVerifiedState(data);
      status.textContent = (data.statusLabel === 'Captured' || data.capturedAt)
        ? 'TruID capture completed.'
        : 'Bank statement verified via TruID.';
      status.style.color = '#28a745';

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('document:uploaded', { detail: { fileType: 'bank_statement' } }));
      }
      return;
    }

    if (statusChip) {
      statusChip.textContent = data.statusLabel || 'Pending';
      statusChip.classList.remove('success');
    }

    if (data.statusLabel) {
      status.textContent = `TruID status: ${data.statusLabel}`;
      status.style.color = '#7a7a7a';
    }
  };

  const existingManualDoc = await getDocumentInfoByUser(userId, 'bank_statement');
  if (existingManualDoc?.file_name) {
    setManualUploadedState(existingManualDoc.file_name, existingManualDoc.uploaded_at);
  } else {
    await fetchTruidStatus();
  }

  if (manualFileInput && manualSelectedFile) {
    manualFileInput.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        manualSelectedFile.style.display = 'none';
        manualSelectedFile.innerHTML = '';
        return;
      }

      const fileSize = (file.size / 1024).toFixed(1);
      manualSelectedFile.innerHTML = `<i class="fas fa-file"></i> <strong>${file.name}</strong> <span>(${fileSize} KB)</span>`;
      manualSelectedFile.style.display = 'block';
    });
  }

  if (manualUploadBtn && manualFileInput) {
    manualUploadBtn.addEventListener('click', async () => {
      if (!manualFileInput.files?.length) {
        manualFileInput.click();
        return;
      }

      const file = manualFileInput.files[0];
      const authToken = session?.access_token;
      if (!authToken) {
        status.textContent = '⚠️ Please log in again before uploading.';
        status.style.color = '#ff9800';
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      if (applicationId) {
        formData.append('applicationId', applicationId);
      }

      status.textContent = 'Uploading manual bank statement...';
      status.style.color = '#7a7a7a';
      manualUploadBtn.disabled = true;
      manualUploadBtn.textContent = 'Uploading...';

      try {
        const response = await fetch('/api/bankstatement/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`
          },
          body: formData
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.message || data?.error || 'Manual upload failed');
        }

        setManualUploadedState(data?.filename || file.name, data?.uploadedAt || new Date().toISOString());

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('document:uploaded', { detail: { fileType: 'bank_statement' } }));
        }

        manualUploadBtn.textContent = 'Uploaded/Connected ✓';
      } catch (error) {
        console.error('❌ Manual bank statement upload failed', error);
        status.textContent = `❌ Manual upload failed: ${error.message || 'Unknown error'}`;
        status.style.color = '#dc3545';
        manualUploadBtn.disabled = false;
        manualUploadBtn.textContent = 'Manual Bank Upload';
      }
    });
  }

  connectBtn.addEventListener('click', async () => {
    status.textContent = 'Launching TruID secure connection...';
    status.style.color = '#7a7a7a';
    connectBtn.disabled = true;

    const redirectUrl = `${window.location.origin}/user-portal/?page=apply-loan`;
    const payload = {
      userId,
      name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
      idNumber: session.user.user_metadata?.id_number || session.user.user_metadata?.idNumber || null,
      idType: 'id',
      email: session.user.email,
      mobile: session.user.phone || session.user.user_metadata?.phone || session.user.user_metadata?.phone_number,
      correlation: {
        userId,
        applicationId: applicationId || null
      },
      redirectUrl
    };
    console.log('[TruID] Sending payload to backend:', JSON.stringify(payload, null, 2));

    try {
      const res = await fetch('/api/banking/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        const consumerUrl = data.consumerUrl || data.connect_url;
        if (consumerUrl) {
          window.open(consumerUrl, '_blank', 'width=900,height=700');
        }

        status.textContent = 'TruID launched. Complete bank linking to continue.';
        status.style.color = '#7a7a7a';

        if (statusChip) {
          statusChip.textContent = 'In Progress';
          statusChip.classList.remove('success');
        }

        if (statusPollInterval) {
          clearInterval(statusPollInterval);
        }
        statusPollInterval = setInterval(fetchTruidStatus, 5000);
      } else {
        console.error('❌ TruID launch failed', data);
        status.textContent = `❌ TruID start failed: ${data.message || data.error}`;
        status.style.color = '#dc3545';
        connectBtn.disabled = false;
        if (statusChip) {
          statusChip.textContent = 'Pending';
          statusChip.classList.remove('success');
        }
      }
    } catch (err) {
      console.error('⚠️ TruID request error', err);
      status.textContent = '⚠️ Something went wrong while starting TruID.';
      status.style.color = '#ff9800';
      connectBtn.disabled = false;
      if (statusChip) {
        statusChip.textContent = 'Pending';
        statusChip.classList.remove('success');
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBankStatementModule, { once: true });
} else {
  initBankStatementModule();
}
