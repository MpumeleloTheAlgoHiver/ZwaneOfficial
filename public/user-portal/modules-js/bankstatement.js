import { supabase } from '/Services/supabaseClient.js';

async function initBankStatementModule() {
  const status = document.getElementById('truidStatusMessage');
  const connectBtn = document.getElementById('truidConnectBtn');
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
    return;
  }

  console.log('✅ Ready for TruID bank statement connection', { applicationId: applicationId || 'none', userId });

  const applyVerifiedState = (details = {}) => {
    if (checkmark) checkmark.classList.add('visible');
    if (connectBtn) {
      connectBtn.disabled = true;
      connectBtn.style.opacity = '0.5';
      connectBtn.style.cursor = 'not-allowed';
      connectBtn.textContent = 'Bank Connected ✓';
    }

    if (statusChip) {
      statusChip.textContent = 'Connected';
      statusChip.classList.add('success');
    }

    if (existingInfo) {
      const connectedDate = new Date(details.last_updated || details.connected_at || Date.now()).toLocaleDateString();
      existingInfo.style.color = '#1f8c5c';
      existingInfo.innerHTML = `✅ Bank connected via TruID on ${connectedDate}`;
    }

    if (statusPollInterval) {
      clearInterval(statusPollInterval);
      statusPollInterval = null;
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
      status.textContent = '✅ Bank statement verified via TruID.';
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

  await fetchTruidStatus();

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
