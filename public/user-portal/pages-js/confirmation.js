import '/user-portal/Services/sessionGuard.js'; // Production auth guard

const PENDING_LOAN_KEY = 'pendingLoanConfig';
const SAVED_ACCOUNTS_KEY = 'savedBankAccounts';

let pendingLoanConfig = null;
let savedAccounts = [];

function ensureGoToStep() {
  if (typeof window.goToStep === 'function') {
    return;
  }

  window.goToStep = function(step) {
    const pages = {
      1: 'apply-loan',
      2: 'apply-loan-2',
      3: 'apply-loan-3',
      4: 'confirmation'
    };

    if (typeof loadPage === 'function') {
      loadPage(pages[step] || 'apply-loan');
    } else {
      const staticPages = {
        1: 'apply-loan.html',
        2: 'apply-loan-2.html',
        3: 'apply-loan-3.html',
        4: 'confirmation.html'
      };
      window.location.href = staticPages[step] || 'apply-loan.html';
    }
  };
}

function readPendingLoanConfig() {
  try {
    const raw = sessionStorage.getItem(PENDING_LOAN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Unable to read pending loan config:', error);
    return null;
  }
}

function loadSavedAccounts() {
  // Kept for backward compatibility, but will be populated from DB
  return savedAccounts || [];
}

async function loadSavedAccountsFromDB(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Error loading bank accounts:', error);
      return [];
    }
    
    // Transform to match expected format
    savedAccounts = (data || []).map(account => ({
      id: account.id,
      bankName: account.bank_name,
      accountHolder: account.account_holder,
      accountNumber: account.account_number,
      branchCode: account.branch_code,
      accountType: account.account_type,
      savedAt: account.created_at
    }));
    
    return savedAccounts;
  } catch (error) {
    console.error('Error loading saved bank accounts:', error);
    return [];
  }
}

function persistSavedAccount(account) {
  const sanitized = { ...account, savedAt: new Date().toISOString() };
  const filtered = savedAccounts.filter((entry) => entry.accountNumber !== sanitized.accountNumber);
  filtered.unshift(sanitized);
  savedAccounts = filtered.slice(0, 3);

  try {
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(savedAccounts));
  } catch (error) {
    console.warn('Unable to persist saved bank accounts:', error);
  }
}

function ensureLoanSummary(config) {
  if (!config) {
    return null;
  }

  if (config.summary) {
    return config.summary;
  }

  const amount = Number(config.amount) || 0;
  const period = Number(config.period) || 1;
  const rate = Number(config.interestRate) || 0;
  const totalInterest = amount * rate * period;
  const totalRepayment = amount + totalInterest;
  const monthlyPayment = totalRepayment / period;

  return {
    totalInterest,
    totalRepayment,
    monthlyPayment
  };
}

function formatCurrency(value) {
  const number = Number(value) || 0;
  return `R ${number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function escapeHtml(value = '') {
  return `${value}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function ensurePdfLibraries() {
  if (typeof window.jspdf !== 'undefined') return true;

  return new Promise((resolve, reject) => {
    const script1 = document.createElement('script');
    script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script1.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
      script2.onload = () => resolve(true);
      script2.onerror = () => reject(new Error('Unable to load PDF table library.'));
      document.head.appendChild(script2);
    };
    script1.onerror = () => reject(new Error('Unable to load PDF library.'));
    document.head.appendChild(script1);
  });
}

function readImageDimensions(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({
      width: image.width || 1,
      height: image.height || 1
    });
    image.onerror = () => reject(new Error('Unable to read signature image.'));
    image.src = dataUrl;
  });
}

async function buildCreditLifeContractPdfBlob(application, session, summary) {
  const contract = pendingLoanConfig?.creditLifeContract || {};
  const signedAt = contract.signedAt ? new Date(contract.signedAt).toLocaleString() : 'Not signed';
  const applicantName = session?.user?.user_metadata?.full_name || session?.user?.email || 'Applicant';
  const contractText = contract.contractText || 'No contract text stored.';
  const loanSignature = pendingLoanConfig?.signature || null;
  const creditLifeSignature = contract.signature || null;

  await ensurePdfLibraries();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const ensureSpace = (needed = 40) => {
    if (y + needed <= pageHeight - margin) return;
    doc.addPage();
    y = margin;
  };

  doc.setFillColor(255, 247, 237);
  doc.rect(0, 0, pageWidth, 110, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(194, 65, 12);
  doc.text('CREDIT LIFE CONTRACT', margin, y);
  y += 24;
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(22);
  doc.text('Signed Contract Snapshot', margin, y);
  y += 26;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`Generated on ${new Date().toLocaleString()}`, margin, y);
  y = 130;

  const metaRows = [
    ['Application ID', application.id],
    ['Applicant', applicantName],
    ['Signed At', signedAt],
    ['Contract Version', contract.contractVersion || 'v1'],
    ['Loan Amount', formatCurrency(pendingLoanConfig?.amount || 0)],
    ['Credit Life Premium', formatCurrency(summary?.totalCreditLife || 0)]
  ];

  doc.autoTable({
    startY: y,
    theme: 'grid',
    head: [['Field', 'Value']],
    body: metaRows,
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 8,
      textColor: [31, 41, 55]
    },
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: margin, right: margin }
  });

  y = doc.lastAutoTable.finalY + 24;
  ensureSpace(120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(107, 114, 128);
  doc.text('CONTRACT TEXT', margin, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  const wrapped = doc.splitTextToSize(contractText, pageWidth - margin * 2);
  wrapped.forEach((line) => {
    ensureSpace(18);
    doc.text(line, margin, y);
    y += 16;
  });

  const addSignatureBlock = async (title, dataUrl) => {
    ensureSpace(220);
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 190, 12, 12, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128);
    doc.text(title.toUpperCase(), margin + 16, y + 24);

    if (dataUrl) {
      const dims = await readImageDimensions(dataUrl);
      const maxWidth = pageWidth - margin * 2 - 32;
      const maxHeight = 130;
      const ratio = Math.min(maxWidth / dims.width, maxHeight / dims.height);
      const width = dims.width * ratio;
      const height = dims.height * ratio;
      const x = margin + 16 + ((maxWidth - width) / 2);
      const imageY = y + 38 + ((maxHeight - height) / 2);
      doc.addImage(dataUrl, 'PNG', x, imageY, width, height, undefined, 'FAST');
      doc.setDrawColor(209, 213, 219);
      doc.rect(margin + 16, y + 38, maxWidth, maxHeight);
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(156, 163, 175);
      doc.text('No signature captured', margin + 16, y + 98);
      doc.setDrawColor(209, 213, 219);
      doc.rect(margin + 16, y + 38, pageWidth - margin * 2 - 32, 130);
    }

    y += 210;
  };

  await addSignatureBlock('Loan Signature', loanSignature);
  await addSignatureBlock('Credit Life Signature', creditLifeSignature);

  return doc.output('blob');
}

async function uploadCreditLifeContractArtifact(supabase, session, application, summary) {
  if (!pendingLoanConfig?.hasCreditLifeInsurance || !pendingLoanConfig?.creditLifeContract?.accepted) {
    return null;
  }

  const fileName = `credit-life-contract-${application.id}.pdf`;
  const storagePath = `${session.user.id}/credit-life/${application.id}/${fileName}`;
  const pdfBlob = await buildCreditLifeContractPdfBlob(application, session, summary);
  const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Failed to upload Credit Life contract: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);
  const publicUrl = urlData?.publicUrl || null;

  const documentRow = {
    user_id: session.user.id,
    application_id: application.id,
    file_name: fileName,
    original_name: fileName,
    file_type: 'credit_life_contract',
    file_path: publicUrl || storagePath,
    mime_type: 'application/pdf',
    file_size: file.size,
    status: 'uploaded'
  };

  const { data: existingDoc } = await supabase
    .from('document_uploads')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('application_id', application.id)
    .eq('file_type', 'credit_life_contract')
    .maybeSingle();

  if (existingDoc?.id) {
    const { error: docUpdateError } = await supabase
      .from('document_uploads')
      .update(documentRow)
      .eq('id', existingDoc.id);
    if (docUpdateError) {
      throw new Error(`Failed to save Credit Life document record: ${docUpdateError.message}`);
    }
  } else {
    const { error: docInsertError } = await supabase
      .from('document_uploads')
      .insert(documentRow);
    if (docInsertError) {
      throw new Error(`Failed to save Credit Life document record: ${docInsertError.message}`);
    }
  }

  return {
    fileName,
    filePath: publicUrl || storagePath
  };
}

function formatPeriod(period) {
  const months = Number(period) || 0;
  return months ? `${months} month${months > 1 ? 's' : ''}` : '--';
}

function formatDate(dateValue) {
  if (!dateValue) {
    return '--';
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }
  return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function maskAccountNumber(accountNumber = '') {
  if (!accountNumber) {
    return '';
  }
  const visible = accountNumber.slice(-4);
  return `•••• ${visible}`;
}

function renderLoanSummary() {
  const summary = ensureLoanSummary(pendingLoanConfig);
  if (!summary) {
    return;
  }

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    }
  };

  setText('summaryLoanAmount', formatCurrency(pendingLoanConfig.amount));
  setText('summaryLoanPeriod', formatPeriod(pendingLoanConfig.period));
  setText('summaryMonthlyPayment', formatCurrency(summary.monthlyPayment));
  setText('summaryTotalRepayment', formatCurrency(summary.totalRepayment));
  setText('summaryFirstDebit', 'Set by admin after review');

  const signatureChip = document.getElementById('signatureStatus');
  if (signatureChip) {
    signatureChip.classList.toggle('warning', !pendingLoanConfig.signature);
    signatureChip.innerHTML = pendingLoanConfig.signature
      ? '<i class="fas fa-signature"></i> Signature on file'
      : '<i class="fas fa-signature"></i> Please re-sign before submitting';
  }
}

function renderSavedAccounts() {
  const select = document.getElementById('savedAccountsSelect');
  if (!select) {
    return;
  }

  if (!savedAccounts.length) {
    select.innerHTML = '<option value="">-- No saved accounts yet --</option>';
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = '<option value="">-- Select an account or add new --</option>' + 
    savedAccounts.map((account) => {
      const displayText = `${account.bankName} - ${maskAccountNumber(account.accountNumber)} (${account.accountHolder})`;
      return `<option value="${account.id}">${displayText}</option>`;
    }).join('');
}

function prefillBankForm(account) {
  const map = {
    bankName: account.bankName,
    accountHolder: account.accountHolder,
    accountNumber: account.accountNumber,
    branchCode: account.branchCode,
    accountType: account.accountType,
    debitDay: account.debitDay || ''
  };

  Object.entries(map).forEach(([id, value]) => {
    const field = document.getElementById(id);
    if (field) {
      field.value = value || '';
    }
  });
}

function showMissingState() {
  document.getElementById('missingLoanState')?.classList.remove('hidden');
  document.getElementById('confirmationContent')?.classList.add('hidden');
}

function showConfirmationContent() {
  document.getElementById('missingLoanState')?.classList.add('hidden');
  document.getElementById('confirmationContent')?.classList.remove('hidden');
}

function bindEditButton() {
  const editBtn = document.getElementById('editLoanBtn');
  if (!editBtn || editBtn.dataset.bound) {
    return;
  }
  editBtn.dataset.bound = 'true';
  editBtn.addEventListener('click', () => goToStep(3));
}

function bindUseSavedAccountButton() {
  const select = document.getElementById('savedAccountsSelect');
  if (!select || select.dataset.bound) {
    return;
  }
  select.dataset.bound = 'true';
  
  select.addEventListener('change', (e) => {
    const selectedValue = e.target.value;
    const bankDetailsSection = document.getElementById('bankDetailsSection');
    const selectedIdInput = document.getElementById('selectedBankAccountId');
    const consentCheckbox = document.getElementById('finalConsent');
    
    if (selectedValue === '' || selectedValue === 'new') {
      // Show form fields for new account
      if (bankDetailsSection) {
        bankDetailsSection.style.display = 'block';
        // Clear and enable all fields
        const bankName = document.getElementById('bankName');
        const accountHolder = document.getElementById('accountHolder');
        const accountNumber = document.getElementById('accountNumber');
        const branchCode = document.getElementById('branchCode');
        const accountType = document.getElementById('accountType');
        
        if (bankName) { bankName.value = ''; bankName.disabled = false; }
        if (accountHolder) { accountHolder.value = ''; accountHolder.disabled = false; }
        if (accountNumber) { accountNumber.value = ''; accountNumber.disabled = false; }
        if (branchCode) { branchCode.value = ''; branchCode.disabled = false; }
        if (accountType) { accountType.value = ''; accountType.disabled = false; }
      }
      if (selectedIdInput) selectedIdInput.value = '';
      // Keep consent checkbox enabled
      if (consentCheckbox) consentCheckbox.disabled = false;
    } else {
      // Use existing account - hide form fields and store ID
      const accountId = selectedValue;
      const account = savedAccounts.find(acc => acc.id == accountId);
      
      if (account && bankDetailsSection) {
        // Hide the form fields
        bankDetailsSection.style.display = 'none';
        // Store the selected account ID
        if (selectedIdInput) selectedIdInput.value = accountId;
        // Keep consent checkbox enabled
        if (consentCheckbox) consentCheckbox.disabled = false;
      }
    }
  });
}

function setSubmissionStatus(message, variant = 'info') {
  const el = document.getElementById('submissionStatus');
  if (!el) {
    return;
  }
  el.textContent = message;
  el.dataset.variant = variant;
  el.style.color = variant === 'error' ? '#c0392b' : variant === 'success' ? '#0f9158' : '#555';
}

function disableFormFields(disabled) {
  const form = document.getElementById('bankDetailsForm');
  if (!form) {
    return;
  }
  Array.from(form.elements).forEach((element) => {
    if (element.id !== 'useSavedAccountBtn') {
      element.disabled = disabled;
    }
  });
}

function showSubmissionResult(applicationId, bankDetails) {
  const container = document.getElementById('submissionResult');
  if (!container) {
    return;
  }
  container.classList.remove('hidden');
  container.innerHTML = `
    <h3><i class="fas fa-circle-check"></i> Application submitted</h3>
    <p>Your reference number is <strong>${applicationId}</strong>. We will verify ${bankDetails.bankName} (${maskAccountNumber(bankDetails.accountNumber)}) within the next business day.</p>
  `;
}

async function handleBankFormSubmit() {
  if (!pendingLoanConfig) {
    setSubmissionStatus('Loan terms missing. Please return to Step 3.', 'error');
    return;
  }

  const submitBtn = document.getElementById('submitConfirmationBtn');
  const finalConsent = document.getElementById('finalConsent');
  const selectedBankAccountId = document.getElementById('selectedBankAccountId')?.value;

  // Check if using existing account
  let bankDetails;
  let useExistingAccount = false;
  
  if (selectedBankAccountId) {
    // Using existing account - no need to validate form fields
    useExistingAccount = true;
    const existingAccount = savedAccounts.find(acc => acc.id == selectedBankAccountId);
    if (!existingAccount) {
      setSubmissionStatus('Selected account not found. Please try again.', 'error');
      return;
    }
    bankDetails = {
      bankAccountId: selectedBankAccountId,
      bankName: existingAccount.bankName,
      accountHolder: existingAccount.accountHolder,
      accountNumber: existingAccount.accountNumber,
      branchCode: existingAccount.branchCode,
      accountType: existingAccount.accountType,
      consented: Boolean(finalConsent?.checked)
    };
  } else {
    // New account - validate form fields
    bankDetails = {
      bankName: document.getElementById('bankName')?.value?.trim(),
      accountHolder: document.getElementById('accountHolder')?.value?.trim(),
      accountNumber: document.getElementById('accountNumber')?.value?.trim(),
      branchCode: document.getElementById('branchCode')?.value?.trim(),
      accountType: document.getElementById('accountType')?.value,
      consented: Boolean(finalConsent?.checked)
    };
    
    const missingField = Object.entries(bankDetails).find(([key, value]) => !value && key !== 'consented');
    if (missingField) {
      setSubmissionStatus('Please complete all banking fields.', 'error');
      return;
    }
  }

  if (!bankDetails.consented) {
    setSubmissionStatus('Please check the confirmation box to continue.', 'error');
    return;
  }

  setSubmissionStatus('Saving your application...', 'info');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing';
  let submissionCompleted = false;

  try {
    const { supabase } = await import('/Services/supabaseClient.js');
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      throw new Error('Session expired. Please sign in again.');
    }

    const summary = ensureLoanSummary(pendingLoanConfig);
    
    // Step 1: Save or retrieve bank account from database
    let bankAccountId = null;
    
    if (useExistingAccount && bankDetails.bankAccountId) {
      // Use the selected existing account
      bankAccountId = bankDetails.bankAccountId;
      // Update last_used_at
      await supabase
        .from('bank_accounts')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', bankAccountId)
        .eq('user_id', session.user.id); // Security check
      console.log('✅ Using selected bank account:', bankAccountId);
    } else {
      // Check if account already exists (in case user entered duplicate manually)
      const { data: existingAccounts } = await supabase
        .from('bank_accounts')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('account_number', bankDetails.accountNumber)
        .eq('bank_name', bankDetails.bankName)
        .maybeSingle();
      
      if (existingAccounts) {
        bankAccountId = existingAccounts.id;
        // Update last_used_at
        await supabase
          .from('bank_accounts')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', bankAccountId);
        console.log('✅ Using existing bank account:', bankAccountId);
      } else {
        // Create new bank account
        const { data: newBankAccount, error: bankError } = await supabase
          .from('bank_accounts')
          .insert([{
            user_id: session.user.id,
            bank_name: bankDetails.bankName,
            account_holder: bankDetails.accountHolder,
            account_number: bankDetails.accountNumber,
            branch_code: bankDetails.branchCode,
            account_type: bankDetails.accountType,
            last_used_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (bankError) {
          console.error('Error saving bank account:', bankError);
          throw new Error('Failed to save banking details. Please try again.');
        }
        
        bankAccountId = newBankAccount.id;
        console.log('✅ Created new bank account:', bankAccountId);
      }
    }
    
    // Step 2: Update existing loan application or create new one
    let applicationId = sessionStorage.getItem('currentApplicationId');
    let newApplication;

    const offerFields = {
      offer_principal: Number(pendingLoanConfig?.amount) || 0,
      offer_interest_rate: Number((pendingLoanConfig?.interestRate || 0) * 100).toFixed(2),
      offer_total_interest: Number(summary?.totalInterest) || 0,
      offer_total_admin_fees: Number(summary?.totalMonthlyFees) || 0,
      offer_total_initiation_fees: Number(summary?.totalInitiationFees) || 0,
      offer_credit_life_monthly: Number(summary?.creditLifeMonthly) || 0,
      offer_credit_life_total: Number(summary?.totalCreditLife) || 0,
      offer_monthly_repayment: Number(summary?.monthlyPayment) || 0,
      offer_total_repayment: Number(summary?.totalRepayment) || 0
    };
    
    if (applicationId) {
      // Check if application is already submitted
      const { data: existingApp, error: checkError } = await supabase
        .from('loan_applications')
        .select('status')
        .eq('id', applicationId)
        .single();
      
      // Only update if application is still in draft state (BUREAU_OK or BUREAU_CHECKING)
      if (!checkError && existingApp && ['BUREAU_OK', 'BUREAU_CHECKING'].includes(existingApp.status)) {
        // Update existing application from credit check step
        console.log('✅ Updating existing application:', applicationId);
        const { data: updatedApp, error: updateError } = await supabase
          .from('loan_applications')
          .update({
            amount: Number(pendingLoanConfig.amount),
            term_months: Number(pendingLoanConfig.period),
            purpose: 'Personal Loan',
            status: 'STARTED',
            bank_account_id: bankAccountId,
            has_credit_life_insurance: Boolean(pendingLoanConfig?.hasCreditLifeInsurance),
            ...offerFields,
            offer_details: {
              interest_rate: pendingLoanConfig.interestRate,
              total_interest: summary?.totalInterest,
              total_repayment: summary?.totalRepayment,
              monthly_payment: summary?.monthlyPayment,
              credit_life_enabled: Boolean(pendingLoanConfig?.hasCreditLifeInsurance),
              credit_life_rate: 0.0045,
              credit_life_total: Number(summary?.totalCreditLife) || 0,
              credit_life_monthly: Number(summary?.creditLifeMonthly) || 0,
              credit_life_contract_signed: Boolean(pendingLoanConfig?.creditLifeContract?.accepted),
              credit_life_signed_at: pendingLoanConfig?.creditLifeContract?.signedAt || null,
              credit_life_signature_data: pendingLoanConfig?.creditLifeContract?.signature || null,
              credit_life_contract_version: pendingLoanConfig?.creditLifeContract?.contractVersion || 'v1',
              credit_life_contract_text: pendingLoanConfig?.creditLifeContract?.contractText || null,
              first_payment_date: null,
              signature_data: pendingLoanConfig.signature
            }
          })
          .eq('id', applicationId)
          .eq('user_id', session.user.id) // Security check
          .select()
          .single();
      
        if (updateError) {
          console.error('Error updating application:', updateError);
          throw new Error('Failed to update loan application. Please try again.');
        }
        
        newApplication = updatedApp;
      } else {
        // Application already submitted - create new one
        console.log('📝 Creating new application (existing one already submitted)');
        applicationId = null; // Reset so we create new
      }
    }
    
    if (!applicationId) {
      // Create new application
      console.log('📝 Creating new application');
      const applicationData = {
        user_id: session.user.id,
        amount: Number(pendingLoanConfig.amount),
        term_months: Number(pendingLoanConfig.period),
        purpose: 'Personal Loan',
        status: 'STARTED',
        bank_account_id: bankAccountId,
        has_credit_life_insurance: Boolean(pendingLoanConfig?.hasCreditLifeInsurance),
        ...offerFields,
        offer_details: {
          interest_rate: pendingLoanConfig.interestRate,
          total_interest: summary?.totalInterest,
          total_repayment: summary?.totalRepayment,
          monthly_payment: summary?.monthlyPayment,
          credit_life_enabled: Boolean(pendingLoanConfig?.hasCreditLifeInsurance),
          credit_life_rate: 0.0045,
          credit_life_total: Number(summary?.totalCreditLife) || 0,
          credit_life_monthly: Number(summary?.creditLifeMonthly) || 0,
          credit_life_contract_signed: Boolean(pendingLoanConfig?.creditLifeContract?.accepted),
          credit_life_signed_at: pendingLoanConfig?.creditLifeContract?.signedAt || null,
          credit_life_signature_data: pendingLoanConfig?.creditLifeContract?.signature || null,
          credit_life_contract_version: pendingLoanConfig?.creditLifeContract?.contractVersion || 'v1',
          credit_life_contract_text: pendingLoanConfig?.creditLifeContract?.contractText || null,
          first_payment_date: null,
          signature_data: pendingLoanConfig.signature
        }
      };

      const { data: createdApp, error: createError } = await supabase
        .from('loan_applications')
        .insert([applicationData])
        .select()
        .single();

      if (createError) {
        throw createError;
      }
      
      newApplication = createdApp;
    }

    const creditLifeArtifact = await uploadCreditLifeContractArtifact(supabase, session, newApplication, summary);
    if (creditLifeArtifact) {
      const updatedOfferDetails = {
        ...(newApplication.offer_details || {}),
        credit_life_contract_file_name: creditLifeArtifact.fileName,
        credit_life_contract_file_path: creditLifeArtifact.filePath
      };

      const { data: refreshedApp, error: artifactLinkError } = await supabase
        .from('loan_applications')
        .update({
          offer_details: updatedOfferDetails,
          credit_life_contract_file_name: creditLifeArtifact.fileName,
          credit_life_contract_file_path: creditLifeArtifact.filePath
        })
        .eq('id', newApplication.id)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (artifactLinkError) {
        throw new Error(`Credit Life contract saved, but could not attach it to the application: ${artifactLinkError.message}`);
      }

      newApplication = refreshedApp;
    }

    sessionStorage.setItem('lastApplicationId', newApplication.id);
    sessionStorage.removeItem(PENDING_LOAN_KEY);
    sessionStorage.removeItem('currentApplicationId'); // Clear so next application creates new record

    // Create notification for application submission (for user)
    const { notifyApplicationSubmitted, notifyAdminsNewApplication } = await import('/Services/notificationService.js');
    await notifyApplicationSubmitted(session.user.id, newApplication.id, newApplication.amount);
    
    // Create notification for admins about new application
    const userName = session.user.user_metadata?.full_name || session.user.email || 'User';
    await notifyAdminsNewApplication(session.user.id, newApplication.id, newApplication.amount, userName);

    // Refresh saved accounts from database
    await loadSavedAccountsFromDB(supabase, session.user.id);
    renderSavedAccounts();
    disableFormFields(true);
    setSubmissionStatus('Application submitted successfully.', 'success');
    showSubmissionResult(newApplication.id, bankDetails);
    submissionCompleted = true;
    submitBtn.innerHTML = '<i class="fas fa-check"></i> Submitted';
    
    // Mark step 4 as completed and save to session storage
    const step4 = document.querySelector('.step.active');
    if (step4) {
      step4.classList.add('completed');
    }
    sessionStorage.setItem('applicationSubmitted', 'true');
    
  } catch (error) {
    console.error('Failed to submit application:', error);
    setSubmissionStatus(error.message || 'Unable to submit application.', 'error');
  } finally {
    if (submissionCompleted) {
      submitBtn.disabled = true;
      // Redirect to dashboard shortly after successful submission so user sees confirmation
      setTimeout(() => {
        if (typeof loadPage === 'function') {
          loadPage('dashboard');
        } else {
          window.location.href = '/user-portal/?page=dashboard';
        }
      }, 1100);
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Submit application</span> <i class="fas fa-arrow-right"></i>';
    }
  }
}

function bindSubmitButton() {
  const btn = document.getElementById('submitConfirmationBtn');
  if (!btn || btn.dataset.bound) {
    return;
  }
  btn.dataset.bound = 'true';
  btn.addEventListener('click', handleBankFormSubmit);
}

async function loadBankingFormModule() {
  try {
    // Load CSS if not already loaded
    if (!document.getElementById('banking-form-css')) {
      const link = document.createElement('link');
      link.id = 'banking-form-css';
      link.rel = 'stylesheet';
      link.href = '/user-portal/modules-css/banking-form.css';
      document.head.appendChild(link);
    }

    const response = await fetch('/user-portal/modules/banking-form.html');
    if (!response.ok) {
      throw new Error('Failed to load banking form');
    }
    const html = await response.text();
    const moduleContent = document.getElementById('module-content');
    const moduleContainer = document.getElementById('module-container');
    
    if (moduleContent && moduleContainer) {
      moduleContent.innerHTML = html;
      moduleContainer.classList.remove('hidden');
      
      // Render loan summary in the modal
      renderLoanSummary();
      
      // Load and render saved accounts from database
      try {
        const { supabase } = await import('/Services/supabaseClient.js');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          await loadSavedAccountsFromDB(supabase, session.user.id);
        }
      } catch (err) {
        console.error('Error loading saved accounts:', err);
      }
      
      renderSavedAccounts();
      
      // Re-bind event handlers for the modal form
      bindUseSavedAccountButton();
      bindSubmitButton();
      bindCancelButton();
    }
  } catch (error) {
    console.error('Error loading banking form:', error);
    alert('Failed to load banking form. Please try again.');
  }
}

function closeBankingModal() {
  const moduleContainer = document.getElementById('module-container');
  if (moduleContainer) {
    moduleContainer.classList.add('hidden');
  }
}

function bindCancelButton() {
  const btn = document.getElementById('cancelBankingBtn');
  if (!btn || btn.dataset.bound) {
    return;
  }
  btn.dataset.bound = 'true';
  btn.addEventListener('click', closeBankingModal);
}

// Make functions available globally for onclick handlers
window.loadBankingFormModule = loadBankingFormModule;
window.closeBankingModal = closeBankingModal;

async function initConfirmationPage() {
  ensureGoToStep();
  pendingLoanConfig = readPendingLoanConfig();
  
  // Check if application was already submitted in this session
  const wasSubmitted = sessionStorage.getItem('applicationSubmitted');
  if (wasSubmitted === 'true') {
    const step4 = document.querySelector('.step.active');
    if (step4) {
      step4.classList.add('completed');
    }
  }
  
  // Load saved accounts from database
  try {
    const { supabase } = await import('/Services/supabaseClient.js');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      await loadSavedAccountsFromDB(supabase, session.user.id);
    } else {
      savedAccounts = [];
    }
  } catch (error) {
    console.error('Error initializing confirmation page:', error);
    savedAccounts = [];
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initConfirmationPage);
} else {
  initConfirmationPage();
}

window.addEventListener('pageLoaded', (event) => {
  if (event?.detail?.pageName === 'confirmation') {
    initConfirmationPage();
  }
});
