const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');
// Your .env config is correct
require('dotenv').config({ path: path.join(__dirname, 'public', 'user', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({
    verify: (req, res, buf) => {
        const url = req.originalUrl || '';
        if (url.startsWith('/api/docuseal/webhook')) {
            req.rawBody = Buffer.from(buf);
        }
    }
}));

// --- User Portal API routes (Your code) ---
const tillSlipRoute = require('./public/user/routes/tillSlipRoute');
const bankStatementRoute = require('./public/user/routes/bankStatementRoute');
const idcardRoute = require('./public/user/routes/idcardRoute');
const kyc = require(path.join(__dirname, 'public', 'user-portal', 'Services', 'kycService'));
const truid = require('./services/truidService');
const creditCheckService = require('./services/creditCheckService');
const sureSystemsService = require('./services/sureSystemsService');
const { supabase, supabaseService } = require('./config/supabaseServer');
const { startNotificationScheduler } = require('./services/notificationScheduler');

const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;
const DOCUSEAL_TEMPLATE_ID = process.env.DOCUSEAL_TEMPLATE_ID;
const DOCUSEAL_API_URL = process.env.DOCUSEAL_API_URL || 'https://api.docuseal.com';

const isDocuSealReady = () => Boolean(DOCUSEAL_API_KEY && DOCUSEAL_TEMPLATE_ID);

const docuSealHeaders = {
    'Content-Type': 'application/json',
    'X-Auth-Token': DOCUSEAL_API_KEY || ''
};

const sureSystemsActivationStore = {
    byApplication: new Map(),
    history: []
};

const SURESYSTEMS_MANDATES_TABLE = 'suresystems_mandates';

function normalizeApplicationId(value) {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : null;
}

async function persistSureSystemsActivation(entry = {}) {
    const normalizedApplicationId = normalizeApplicationId(entry.applicationId);
    if (!normalizedApplicationId) {
        return null;
    }

    try {
        const payload = {
            application_id: normalizedApplicationId,
            user_id: entry.userId || null,
            status: entry.status || 'unknown',
            contract_reference: entry.contractReference || null,
            message: entry.message || null,
            request_payload: entry.requestPayload || null,
            response_payload: entry.responsePayload || null,
            error_payload: entry.errorPayload || null,
            activated_at: entry.at || new Date().toISOString(),
            last_checked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { error } = await supabaseService
            .from(SURESYSTEMS_MANDATES_TABLE)
            .upsert(payload, { onConflict: 'application_id' });

        if (error) {
            throw error;
        }
        return payload;
    } catch (error) {
        console.warn('SureSystems activation persistence failed:', error.message || error);
        return null;
    }
}

async function recordSureSystemsActivation(entry = {}) {
    const normalizedApplicationId = normalizeApplicationId(entry.applicationId);
    if (!normalizedApplicationId) {
        return null;
    }

    const normalized = {
        applicationId: normalizedApplicationId,
        userId: entry.userId || null,
        status: entry.status || 'unknown',
        contractReference: entry.contractReference || null,
        message: entry.message || null,
        requestPayload: entry.requestPayload || null,
        responsePayload: entry.responsePayload || null,
        errorPayload: entry.errorPayload || null,
        at: entry.at || new Date().toISOString()
    };

    sureSystemsActivationStore.byApplication.set(normalized.applicationId, normalized);
    sureSystemsActivationStore.history.unshift(normalized);
    if (sureSystemsActivationStore.history.length > 200) {
        sureSystemsActivationStore.history = sureSystemsActivationStore.history.slice(0, 200);
    }

    await persistSureSystemsActivation(normalized);
    return normalized;
}

async function getSureSystemsActivationStatus() {
    const configStatus = sureSystemsService.getConfigStatus();

    try {
        const { data, error } = await supabaseService
            .from(SURESYSTEMS_MANDATES_TABLE)
            .select('application_id, user_id, status, contract_reference, message, activated_at, updated_at')
            .order('updated_at', { ascending: false })
            .limit(200);

        if (error) {
            throw error;
        }

        const rows = data || [];
        const recentWindow = rows.slice(0, 50);
        const successCount = recentWindow.filter((item) => item.status === 'success').length;
        const failureCount = recentWindow.filter((item) => item.status === 'failed').length;

        return {
            ...configStatus,
            source: 'database',
            recent: {
                total: recentWindow.length,
                success: successCount,
                failed: failureCount,
                lastAttemptAt: recentWindow[0]?.updated_at || null
            },
            applications: rows.slice(0, 20).map((item) => ({
                applicationId: item.application_id,
                userId: item.user_id,
                status: item.status,
                contractReference: item.contract_reference,
                message: item.message,
                at: item.updated_at || item.activated_at
            }))
        };
    } catch (error) {
        console.warn('SureSystems activation status DB read failed. Falling back to memory:', error.message || error);
    }

    const recentWindow = sureSystemsActivationStore.history.slice(0, 50);
    const successCount = recentWindow.filter((item) => item.status === 'success').length;
    const failureCount = recentWindow.filter((item) => item.status === 'failed').length;

    return {
        ...configStatus,
        source: 'memory-fallback',
        recent: {
            total: recentWindow.length,
            success: successCount,
            failed: failureCount,
            lastAttemptAt: recentWindow[0]?.at || null
        },
        applications: Array.from(sureSystemsActivationStore.byApplication.values())
            .sort((a, b) => new Date(b.at) - new Date(a.at))
            .slice(0, 20)
    };
}

const DEFAULT_AUTH_OVERLAY_COLOR = '#EA580C';
const DEFAULT_COMPANY_NAME = 'Your Company';

const DEFAULT_CAROUSEL_SLIDES = [
    {
        title: 'A Leap to\nFinancial Freedom',
        text: 'We offer credit of up to R200,000, with repayment terms extending up to a maximum of 36 months.'
    },
    {
        title: 'Flexible Repayments',
        text: "Repayment terms are tailored to each client's cash flow, risk profile, and agreed-upon conditions."
    },
    {
        title: 'Save on Interest',
        text: 'Our interest rates and fees are highly competitive, ensuring great value for our clients.'
    }
];

const DEFAULT_SYSTEM_SETTINGS = {
    id: 'global',
    company_name: DEFAULT_COMPANY_NAME,
    primary_color: '#E7762E',
    secondary_color: '#F97316',
    tertiary_color: '#FACC15',
    theme_mode: 'light',
    company_logo_url: null,
    auth_background_url: null,
    auth_background_flip: false,
    auth_overlay_color: DEFAULT_AUTH_OVERLAY_COLOR,
    auth_overlay_enabled: true,
    carousel_slides: DEFAULT_CAROUSEL_SLIDES.map((slide) => ({ ...slide }))
};

const normalizeBoolean = (value, fallback = false) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const lower = value.toLowerCase();
        if (lower === 'true') return true;
        if (lower === 'false') return false;
    }
    if (typeof value === 'number') {
        if (value === 1) return true;
        if (value === 0) return false;
    }
    return fallback;
};

const normalizeHexColor = (value, fallback) => {
    if (!value) return fallback;
    let hex = `${value}`.trim().replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map((char) => char + char).join('');
    }
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
        return fallback;
    }
    return `#${hex.toUpperCase()}`;
};

const normalizeCompanyName = (value) => {
    const name = typeof value === 'string' ? value.trim() : '';
    return name || DEFAULT_SYSTEM_SETTINGS.company_name;
};

const sanitizeSlide = (slide = {}, fallback = {}) => {
    const safeTitle = typeof slide.title === 'string' ? slide.title.trim() : '';
    const safeText = typeof slide.text === 'string' ? slide.text.trim() : '';
    return {
        title: safeTitle || fallback.title,
        text: safeText || fallback.text
    };
};

const normalizeCarouselSlides = (slides) => {
    const incoming = Array.isArray(slides) ? slides : [];
    return DEFAULT_CAROUSEL_SLIDES.map((fallback, index) => sanitizeSlide(incoming[index] || {}, fallback));
};

const hydrateSystemSettings = (settings = {}) => ({
    ...DEFAULT_SYSTEM_SETTINGS,
    ...settings,
    company_name: normalizeCompanyName(settings?.company_name),
    auth_background_flip: normalizeBoolean(settings?.auth_background_flip, DEFAULT_SYSTEM_SETTINGS.auth_background_flip),
    auth_overlay_color: normalizeHexColor(settings?.auth_overlay_color, DEFAULT_SYSTEM_SETTINGS.auth_overlay_color),
    auth_overlay_enabled: normalizeBoolean(settings?.auth_overlay_enabled, DEFAULT_SYSTEM_SETTINGS.auth_overlay_enabled),
    carousel_slides: normalizeCarouselSlides(settings.carousel_slides)
});

const THEME_CACHE_TTL_MS = 60 * 1000;
let cachedSystemSettings = {
    data: hydrateSystemSettings(),
    timestamp: 0
};

async function loadSystemSettings(forceRefresh = false) {
    const now = Date.now();
    const isCacheFresh = now - cachedSystemSettings.timestamp < THEME_CACHE_TTL_MS;
    if (!forceRefresh && isCacheFresh) {
        return cachedSystemSettings.data;
    }

    try {
        const { data, error } = await supabaseService
            .from('system_settings')
            .select('*')
            .eq('id', 'global')
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        const theme = hydrateSystemSettings(data);
        cachedSystemSettings = { data: theme, timestamp: now };
        return theme;
    } catch (error) {
        console.error('System settings fetch failed:', error.message || error);
        return cachedSystemSettings.data;
    }
}

async function docuSealRequest(method, endpoint, data) {
    if (!isDocuSealReady()) {
        throw new Error('DocuSeal configuration missing');               
    }

    return axios({
        method,
        url: `${DOCUSEAL_API_URL}${endpoint}`,
        headers: docuSealHeaders,
        data
    });
}

function buildDocuSealSubmission(applicationData = {}, profileData = {}) {
    return {
        template_id: parseInt(DOCUSEAL_TEMPLATE_ID, 10),
        send_email: true,
        submitters: [
            {
                role: 'Borrower',
                email: profileData.email,
                name: profileData.full_name,
                values: {
                    borrower_name: profileData.full_name,
                    borrower_email: profileData.email,
                    borrower_phone: profileData.contact_number || '',
                    borrower_id: profileData.id,
                    loan_amount: applicationData.requested_amount?.toString() || '0',
                    interest_rate: applicationData.interest_rate?.toString() || '20',
                    loan_term: applicationData.term_months?.toString() || '1',
                    monthly_payment: applicationData.monthly_payment?.toString() || '0',
                    total_repayment: applicationData.total_repayment?.toString() || '0',
                    application_id: applicationData.id,
                    application_date: applicationData.created_at
                        ? new Date(applicationData.created_at).toLocaleDateString('en-ZA')
                        : '',
                    contract_date: new Date().toLocaleDateString('en-ZA'),
                    first_payment_date: applicationData.repayment_start_date
                        ? new Date(applicationData.repayment_start_date).toLocaleDateString('en-ZA')
                        : ''
                },
                metadata: {
                    application_id: applicationData.id,
                    user_id: profileData.id,
                    loan_amount: applicationData.requested_amount
                }
            }
        ],
        metadata: {
            application_id: applicationData.id,
            user_id: profileData.id,
            loan_amount: applicationData.requested_amount,
            status: 'sent'
        }
    };
}

function handleDocuSealError(error, res) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || 'DocuSeal request failed';

    console.error('DocuSeal API error:', message, error.response?.data || '');
    return res.status(status).json({ error: message, details: error.response?.data });
}

function toSureSystemsDate(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10).replace(/-/g, '');
}

async function triggerSureSystemsMandateForApplication(applicationId) {
    if (!applicationId) return null;

    const { data: application, error: appError } = await supabaseService
        .from('loan_applications')
        .select('id, user_id, amount, repayment_start_date, bank_account_id')
        .eq('id', applicationId)
        .maybeSingle();

    if (appError || !application) {
        throw new Error(`Unable to load application ${applicationId} for SureSystems mandate`);
    }

    if (!application.bank_account_id) {
        throw new Error(`Application ${applicationId} has no bank_account_id`);
    }

    const { data: bankAccount, error: bankError } = await supabaseService
        .from('bank_accounts')
        .select('account_holder, account_number, branch_code')
        .eq('id', application.bank_account_id)
        .maybeSingle();

    if (bankError || !bankAccount) {
        throw new Error(`Unable to load bank account for application ${applicationId}`);
    }

    const { data: profile } = await supabaseService
        .from('profiles')
        .select('*')
        .eq('id', application.user_id)
        .maybeSingle();

    const collectionDate = toSureSystemsDate(application.repayment_start_date) || sureSystemsService.getToday();
    const debtorIdentificationNo = profile?.id_number || profile?.idNumber || application.user_id;

    const requestPayload = {
        clientNo: String(application.user_id || application.id).slice(0, 20),
        frontEndUserName: profile?.email || 'webuser',
        debtorAccountName: bankAccount.account_holder || profile?.full_name || '',
        debtorIdentificationNo: String(debtorIdentificationNo || ''),
        debtorAccountNumber: bankAccount.account_number,
        debtorBranchNumber: bankAccount.branch_code,
        debtorEmail: profile?.email || '',
        amount: Number(application.amount || 0),
        collectionDate,
        dateList: collectionDate,
        userReference: `APP-${application.id}`
    };

    const result = await sureSystemsService.loadMandate(requestPayload);

    return {
        applicationId: application.id,
        userId: application.user_id,
        contractReference: result?.contractReference || null,
        requestPayload,
        responsePayload: result?.response || null
    };
}

app.use('/api/tillslip', tillSlipRoute);
app.use('/api/bankstatement', bankStatementRoute);
app.use('/api/idcard', idcardRoute);

app.get('/api/system-settings', async (req, res) => {
    try {
        const forceRefresh = ['true', '1'].includes((req.query.refresh || '').toString());
        const theme = await loadSystemSettings(forceRefresh);
        return res.json({
            data: theme,
            updated_at: cachedSystemSettings.timestamp,
            cache_ttl_ms: THEME_CACHE_TTL_MS
        });
    } catch (error) {
        console.error('System settings API error:', error);
        return res.status(200).json({
            data: cachedSystemSettings.data,
            fallback: true
        });
    }
});

// KYC API routes
app.post('/api/kyc/create-session', async (req, res) => {
    try {
        const result = await kyc.createSession(req.body);
        return res.json(result);
    } catch (error) {
        console.error('KYC session error:', error);
        return res.status(500).json({ error: error.message || 'Unable to create KYC session' });
    }
});

app.post('/api/kyc/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-signature'];
        const payload = req.body;

        if (!signature || !kyc.verifyWebhookSignature(payload, signature)) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        kyc.updateSessionFromWebhook(payload);
        return res.status(200).json({ received: true });
    } catch (error) {
        console.error('KYC webhook error:', error);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
});

app.get('/api/kyc/session/:sessionId', async (req, res) => {
    try {
        const result = await kyc.getSessionStatus(req.params.sessionId);
        return res.json(result);
    } catch (error) {
        console.error('KYC session lookup error:', error);
        return res.status(404).json({ error: 'Session not found' });
    }
});

app.get('/api/kyc/user/:userId/status', async (req, res) => {
    try {
        const result = await kyc.getUserKycStatus(req.params.userId);
        return res.json(result);
    } catch (error) {
        console.error('KYC status error:', error);
        return res.status(500).json({ error: 'Unable to fetch KYC status' });
    }
});

// TruID API routes
app.post('/api/truid/create-session', async (req, res) => {
    try {
        const payload = req.body || {};
        const result = await truid.initiateCollection({
            ...payload,
            name: payload.name || payload.metadata?.full_name,
            idNumber: payload.idNumber || payload.metadata?.id_number || payload.metadata?.idNumber,
            email: payload.email,
            mobile: payload.phone,
            correlation: {
                userId: payload.userId,
                applicationId: payload.metadata?.applicationId || null
            }
        });

        return res.json({
            success: true,
            session_id: result.collectionId,
            connect_url: result.consumerUrl,
            status: result.status
        });
    } catch (error) {
        console.error('TruID create-session error:', error.message || error);
        if (error.code === 'TRUID_CONFIG_MISSING') {
            return res.status(503).json({ error: error.message });
        }
        return res.status(error.status || 500).json({ error: error.message || 'Unable to start TruID session' });
    }
});

app.get('/api/truid/session/:sessionId', async (req, res) => {
    try {
        const result = await truid.getCollectionStatus(req.params.sessionId);
        return res.json(result);
    } catch (error) {
        console.error('TruID session lookup error:', error.message || error);
        return res.status(error.status || 500).json({ error: 'Unable to fetch session status' });
    }
});

app.get('/api/truid/user/:userId/status', async (req, res) => {
    try {
        const result = await truid.getUserStatus(req.params.userId);
        return res.json(result);
    } catch (error) {
        console.error('TruID status error:', error.message || error);
        return res.status(500).json({ error: error.message || 'Unable to fetch TruID status' });
    }
});

app.post('/api/truid/webhook', async (req, res) => {
    try {
        const payload = req.body || {};
        const result = await truid.captureCollectionData({
            collectionId: payload.collectionId || payload.collection_id || payload.id,
            userId: payload.userId || payload.user_id || payload.correlation?.userId,
            applicationId: payload.applicationId || payload.correlation?.applicationId
        });
        return res.status(200).json(result);
    } catch (error) {
        console.error('TruID webhook error:', error.message || error);
        return res.status(error.status || 500).json({ error: 'Webhook processing failed' });
    }
});

// Banking API endpoints
app.post('/api/banking/initiate', async (req, res) => {
    try {
        const result = await truid.initiateCollection(req.body || {});
        return res.json(result);
    } catch (error) {
        console.error('Banking initiate error:', error.message || error);
        return res.status(error.status || 500).json({ success: false, error: error.message || 'Failed to initiate banking collection' });
    }
});

app.get('/api/banking/status', async (req, res) => {
    try {
        const { collectionId, userId } = req.query;

        if (collectionId) {
            const result = await truid.getCollectionStatus(collectionId);
            return res.json(result);
        }

        if (userId) {
            const result = await truid.getUserStatus(userId);
            return res.json(result);
        }

        return res.status(400).json({ success: false, error: 'Provide collectionId or userId' });
    } catch (error) {
        console.error('Banking status error:', error.message || error);
        return res.status(error.status || 500).json({ success: false, error: error.message || 'Failed to fetch banking status' });
    }
});

app.get('/api/banking/all', async (req, res) => {
    try {
        const result = await truid.getAllSessions();
        return res.json(result);
    } catch (error) {
        console.error('Banking all error:', error.message || error);
        return res.status(error.status || 500).json({ success: false, error: error.message || 'Failed to list banking sessions' });
    }
});

app.post('/api/banking/capture', async (req, res) => {
    try {
        const result = await truid.captureCollectionData(req.body || {});
        return res.json(result);
    } catch (error) {
        console.error('Banking capture error:', error.message || error);
        return res.status(error.status || 500).json({ success: false, error: error.message || 'Failed to capture banking data' });
    }
});

// Credit Check API endpoint
app.post('/api/credit-check', async (req, res) => {
    try {
        const { applicationId, userData } = req.body;

        if (!applicationId || !userData) {
            return res.status(400).json({ error: 'applicationId and userData are required' });
        }

        const authHeader = req.headers.authorization || '';
        const authToken = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : null;

        const result = await creditCheckService.performCreditCheck(
            userData,
            applicationId,
            authToken
        );

        return res.json(result);
    } catch (error) {
        console.error('Credit check error:', error);
        return res.status(500).json({ error: error.message || 'Credit check failed' });
    }
});

// Notification testing endpoints (development only)
const notificationScheduler = require('./services/notificationScheduler');

app.post('/api/notifications/check-payments', async (req, res) => {
    try {
        await notificationScheduler.checkPaymentDueNotifications();
        return res.json({ success: true, message: 'Payment due notifications checked' });
    } catch (error) {
        console.error('Error checking payment notifications:', error);
        return res.status(500).json({ error: error.message });
    }
});

app.post('/api/notifications/check-edit-window', async (req, res) => {
    try {
        await notificationScheduler.checkEditWindowNotifications();
        return res.json({ success: true, message: 'Edit window notifications checked' });
    } catch (error) {
        console.error('Error checking edit window notifications:', error);
        return res.status(500).json({ error: error.message });
    }
});

// Loan affordability calculation endpoint
app.post('/api/calculate-affordability', (req, res) => {
    try {
        const {
            monthly_income,
            affordability_percent = 20, // Default 20%
            annual_interest_rate = 20, // Default 20% APR
            loan_term_months = 1 // Default 1 month
        } = req.body;

        if (!monthly_income || monthly_income <= 0) {
            return res.status(400).json({ error: 'Valid monthly_income is required' });
        }

        // 1. Maximum monthly repayment (13% of income)
        const max_monthly_payment = monthly_income * (affordability_percent / 100);

        // 2. Monthly interest rate (APR / 12)
        const monthly_rate = (annual_interest_rate / 100) / 12;

        // 3. Amortized loan amount formula
        // Formula: P = M * [(1 - (1 + r)^-n) / r]
        // Where: P = Principal (loan amount), M = Monthly payment, r = monthly rate, n = number of months
        const loan_amount = monthly_rate > 0
            ? max_monthly_payment * (1 - Math.pow(1 + monthly_rate, -loan_term_months)) / monthly_rate
            : max_monthly_payment * loan_term_months; // If rate is 0, simple calculation

        return res.json({
            max_monthly_payment: Number(max_monthly_payment.toFixed(2)),
            affordability_threshold: Number(max_monthly_payment.toFixed(2)),
            max_loan_amount: Number(loan_amount.toFixed(2)),
            monthly_rate: Number((monthly_rate * 100).toFixed(4)),
            annual_interest_rate,
            loan_term_months,
            affordability_percent
        });
    } catch (error) {
        console.error('Affordability calculation error:', error);
        return res.status(500).json({ error: error.message || 'Calculation failed' });
    }
});

// SureSystems API proxy endpoints
app.get('/api/suresystems/config', (req, res) => {
    try {
        return res.json(sureSystemsService.getConfigStatus());
    } catch (error) {
        console.error('SureSystems config status error:', error);
        return res.status(500).json({ configured: false, error: 'Unable to read SureSystems configuration' });
    }
});

app.post('/api/suresystems/mandates/load', async (req, res) => {
    try {
        const payload = req.body || {};
        const result = await sureSystemsService.loadMandate(payload);
        return res.json({ success: true, contractReference: result.contractReference, ...result.response });
    } catch (error) {
        console.error('SureSystems mandate load error:', error.message || error);
        return res.status(error.status || 500).json({
            success: false,
            error: error.message || 'SureSystems mandate load failed',
            details: error.details || null
        });
    }
});

app.post('/api/suresystems/mandates/finalfate', async (req, res) => {
    try {
        const payload = req.body || {};
        const result = await sureSystemsService.checkFinalFate(payload);
        return res.json({ success: true, ...result.response });
    } catch (error) {
        console.error('SureSystems final fate error:', error.message || error);
        return res.status(error.status || 500).json({
            success: false,
            error: error.message || 'SureSystems final fate check failed',
            details: error.details || null
        });
    }
});

app.post('/api/suresystems/payments/download', async (req, res) => {
    try {
        const payload = req.body || {};
        const result = await sureSystemsService.downloadPayments(payload);
        return res.json({ success: true, ...result.response });
    } catch (error) {
        console.error('SureSystems payments download error:', error.message || error);
        return res.status(error.status || 500).json({
            success: false,
            error: error.message || 'SureSystems payment download failed',
            details: error.details || null
        });
    }
});

app.post('/api/suresystems/mandates/batch/mandateenquiry', async (req, res) => {
    try {
        const payload = req.body || {};
        const result = await sureSystemsService.mandateEnquiry(payload);
        return res.json({ success: true, ...result.response });
    } catch (error) {
        console.error('SureSystems mandate enquiry error:', error.message || error);
        return res.status(error.status || 500).json({
            success: false,
            error: error.message || 'SureSystems mandate enquiry failed',
            details: error.details || null
        });
    }
});

app.post('/api/suresystems/mandates/cancel', async (req, res) => {
    try {
        const payload = req.body || {};
        const result = await sureSystemsService.cancelMandate(payload);
        return res.json({ success: true, ...result.response });
    } catch (error) {
        console.error('SureSystems cancel mandate error:', error.message || error);
        return res.status(error.status || 500).json({
            success: false,
            error: error.message || 'SureSystems cancel mandate failed',
            details: error.details || null
        });
    }
});

app.post('/api/suresystems/installments/batch/installment', async (req, res) => {
    try {
        const payload = req.body || {};
        const result = await sureSystemsService.createInstallmentRequest(payload);
        return res.json({ success: true, ...result.response });
    } catch (error) {
        console.error('SureSystems installment request error:', error.message || error);
        return res.status(error.status || 500).json({
            success: false,
            error: error.message || 'SureSystems installment request failed',
            details: error.details || null
        });
    }
});

app.post('/api/suresystems/installments/batch/update', async (req, res) => {
    try {
        const payload = req.body || {};
        const result = await sureSystemsService.updateInstallmentRequest(payload);
        return res.json({ success: true, ...result.response });
    } catch (error) {
        console.error('SureSystems update installment error:', error.message || error);
        return res.status(error.status || 500).json({
            success: false,
            error: error.message || 'SureSystems update installment failed',
            details: error.details || null
        });
    }
});

app.post('/api/suresystems/installments/cancel', async (req, res) => {
    try {
        const payload = req.body || {};
        const result = await sureSystemsService.cancelInstallment(payload);
        return res.json({ success: true, ...result.response });
    } catch (error) {
        console.error('SureSystems cancel installment error:', error.message || error);
        return res.status(error.status || 500).json({
            success: false,
            error: error.message || 'SureSystems cancel installment failed',
            details: error.details || null
        });
    }
});

app.get('/api/suresystems/activation-status', async (req, res) => {
    try {
        const status = await getSureSystemsActivationStatus();
        return res.json(status);
    } catch (error) {
        console.error('SureSystems activation status error:', error);
        return res.status(500).json({ error: 'Unable to load SureSystems activation status' });
    }
});

app.post('/api/suresystems/activate-application', async (req, res) => {
    try {
        const applicationId = normalizeApplicationId(req.body?.applicationId);
        if (!applicationId) {
            return res.status(400).json({ success: false, error: 'applicationId is required' });
        }

        const activation = await triggerSureSystemsMandateForApplication(applicationId);
        const now = new Date().toISOString();

        await recordSureSystemsActivation({
            applicationId,
            userId: activation?.userId || null,
            status: 'success',
            contractReference: activation?.contractReference || null,
            message: 'Mandate activated manually by admin',
            requestPayload: activation?.requestPayload || null,
            responsePayload: activation?.responsePayload || null,
            at: now
        });

        return res.json({
            success: true,
            applicationId,
            contractReference: activation?.contractReference || null,
            activatedAt: now,
            message: 'SureSystems mandate activated successfully'
        });
    } catch (error) {
        const applicationId = normalizeApplicationId(req.body?.applicationId) || null;
        await recordSureSystemsActivation({
            applicationId,
            status: 'failed',
            message: error.message || 'Manual SureSystems activation failed',
            errorPayload: error.details || null,
            at: new Date().toISOString()
        });

        console.error('Manual SureSystems activation error:', error.message || error);
        return res.status(error.status || 500).json({
            success: false,
            error: error.message || 'Unable to activate SureSystems mandate',
            details: error.details || null
        });
    }
});

// DocuSeal proxy endpoints
app.get('/api/docuseal/config', (req, res) => {
    return res.json({
        configured: isDocuSealReady(),
        templateId: isDocuSealReady() ? DOCUSEAL_TEMPLATE_ID : null
    });
});

app.post('/api/docuseal/send-contract', async (req, res) => {
    if (!isDocuSealReady()) {
        return res.status(503).json({ error: 'DocuSeal integration is not configured' });
    }

    const { applicationData, profileData } = req.body || {};
    if (!applicationData || !profileData) {
        return res.status(400).json({ error: 'applicationData and profileData are required' });
    }

    try {
        const payload = buildDocuSealSubmission(applicationData, profileData);
        const response = await docuSealRequest('post', '/submissions', payload);
        return res.json(response.data);
    } catch (error) {
        return handleDocuSealError(error, res);
    }
});

app.get('/api/docuseal/submissions/:submissionId', async (req, res) => {
    if (!isDocuSealReady()) {
        return res.status(503).json({ error: 'DocuSeal integration is not configured' });
    }

    try {
        const response = await docuSealRequest('get', `/submissions/${req.params.submissionId}`);
        return res.json(response.data);
    } catch (error) {
        return handleDocuSealError(error, res);
    }
});

app.get('/api/docuseal/submitters/:submitterId', async (req, res) => {
    if (!isDocuSealReady()) {
        return res.status(503).json({ error: 'DocuSeal integration is not configured' });
    }

    try {
        const response = await docuSealRequest('get', `/submitters/${req.params.submitterId}`);
        return res.json(response.data);
    } catch (error) {
        return handleDocuSealError(error, res);
    }
});

app.put('/api/docuseal/submitters/:submitterId', async (req, res) => {
    if (!isDocuSealReady()) {
        return res.status(503).json({ error: 'DocuSeal integration is not configured' });
    }

    try {
        const payload = { send_email: true, ...(req.body || {}) };
        const response = await docuSealRequest('put', `/submitters/${req.params.submitterId}`, payload);
        return res.json(response.data);
    } catch (error) {
        return handleDocuSealError(error, res);
    }
});

app.delete('/api/docuseal/submissions/:submissionId', async (req, res) => {
    if (!isDocuSealReady()) {
        return res.status(503).json({ error: 'DocuSeal integration is not configured' });
    }

    try {
        const response = await docuSealRequest('delete', `/submissions/${req.params.submissionId}`);
        return res.json(response.data);
    } catch (error) {
        return handleDocuSealError(error, res);
    }
});

// DocuSeal Webhook Receiver – updates docuseal_submissions when DocuSeal sends events
app.post('/api/docuseal/webhook', async (req, res) => {
    try {
        // Verify webhook signature if secret is configured
        const secret = process.env.DOCUSEAL_WEBHOOK_SECRET;
        if (secret) {
            const sigHeader = (req.headers['x-docuseal-signature'] || req.headers['x-signature'] || req.headers['x-hub-signature'] || '').toString();
            if (!sigHeader) {
                // Allow a simple test header fallback (not secure) during debugging if configured
                const testHeaderName = process.env.DOCUSEAL_TEST_HEADER_NAME || '';
                const testHeaderValue = process.env.DOCUSEAL_TEST_HEADER_VALUE || '';
                if (testHeaderName && testHeaderValue) {
                    const incoming = req.headers[testHeaderName.toLowerCase()];
                    if (incoming && incoming === testHeaderValue) {
                        console.log('Accepted DocuSeal webhook via custom test header', testHeaderName);
                        // treat as valid and skip HMAC validation
                    } else {
                        console.warn('Missing DocuSeal signature header and test header did not match', {
                            expectedTestHeader: testHeaderName,
                            headers: req.headers,
                            rawBodyLength: req.rawBody ? req.rawBody.length : 0,
                            bodySample: (() => {
                                try { return JSON.stringify(req.body).slice(0, 1000); } catch (e) { return '<non-serializable body>'; }
                            })()
                        });
                        return res.status(401).json({ error: 'Missing signature header' });
                    }
                } else {
                    // Log full headers + small body sample to help debug what DocuSeal is sending
                    console.warn('Missing DocuSeal signature header', {
                        headers: req.headers,
                        rawBodyLength: req.rawBody ? req.rawBody.length : 0,
                        bodySample: (() => {
                            try { return JSON.stringify(req.body).slice(0, 1000); } catch (e) { return '<non-serializable body>'; }
                        })()
                    });
                    return res.status(401).json({ error: 'Missing signature header' });
                }
            }

            // Strip common prefix (e.g. 'sha256=') if present
            let received = sigHeader.startsWith('sha256=') ? sigHeader.slice(7) : sigHeader;

            // Compute expected digests
            const computedHex = crypto.createHmac('sha256', secret).update(req.rawBody || Buffer.from('')).digest('hex');
            const computedBase64 = crypto.createHmac('sha256', secret).update(req.rawBody || Buffer.from('')).digest('base64');

            let valid = false;
            try {
                // Try hex comparison (timing-safe)
                const rec = Buffer.from(received, 'hex');
                const comp = Buffer.from(computedHex, 'hex');
                if (rec.length === comp.length && crypto.timingSafeEqual(rec, comp)) valid = true;
            } catch (e) {}
            try {
                // Try base64 comparison (timing-safe)
                const recB = Buffer.from(received, 'base64');
                const compB = Buffer.from(computedBase64, 'base64');
                if (recB.length === compB.length && crypto.timingSafeEqual(recB, compB)) valid = true;
            } catch (e) {}
            // Fallback string compare for plain header formats
            if (received === computedHex || received === computedBase64) valid = true;

            if (!valid) {
                console.warn('Invalid DocuSeal webhook signature');
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }

        const payload = req.body || {};
        const eventType = payload.event_type || payload.type || '';
        const data = payload.data || payload;

        console.log('DocuSeal webhook received:', eventType, data?.id || data?.submission_id || 'no-id');

        const now = new Date().toISOString();

        const updateBySubmitter = async (fields) => {
            if (!data?.id) return;
            await supabase
                .from('docuseal_submissions')
                .update({ ...fields, updated_at: now })
                .eq('submitter_id', data.id);
        };

        const updateBySubmission = async (fields) => {
            const submissionId = data?.id || data?.submission_id;
            if (!submissionId) return;
            await supabase
                .from('docuseal_submissions')
                .update({ ...fields, updated_at: now })
                .eq('submission_id', submissionId);
        };

        switch (eventType) {
            case 'form.viewed':
                await updateBySubmitter({ status: 'opened', opened_at: data.opened_at || now });
                break;
            case 'form.started':
                await updateBySubmitter({ status: 'started' });
                break;
            case 'form.completed':
                await updateBySubmitter({ status: 'completed', completed_at: data.completed_at || now, metadata: data.values || data.metadata || {} });
                // After a submitter completes the form, mark the related application as Contract Signed (step 5)
                try {
                    const applicationId = data?.metadata?.application_id || data?.application_id || data?.submission?.metadata?.application_id || data?.submission?.application_id || null;
                    if (applicationId) {
                        await supabase
                            .from('loan_applications')
                            .update({ status: 'OFFER_ACCEPTED', contract_signed_at: now })
                            .eq('id', applicationId);
                        console.log('DocuSeal: set application', applicationId, 'to OFFER_ACCEPTED');

                        try {
                            const activation = await triggerSureSystemsMandateForApplication(applicationId);
                            await recordSureSystemsActivation({
                                applicationId,
                                userId: activation?.userId || null,
                                status: 'success',
                                contractReference: activation?.contractReference || null,
                                message: 'Mandate loaded after DocuSeal completion',
                                requestPayload: activation?.requestPayload || null,
                                responsePayload: activation?.responsePayload || null,
                                at: now
                            });
                            if (activation?.contractReference) {
                                console.log('SureSystems: mandate loaded for application', applicationId, 'contractReference:', activation.contractReference);
                            }
                        } catch (sureSystemsError) {
                            await recordSureSystemsActivation({
                                applicationId,
                                status: 'failed',
                                message: sureSystemsError?.message || 'SureSystems activation failed',
                                errorPayload: sureSystemsError?.details || null,
                                at: now
                            });
                            console.warn('SureSystems mandate activation failed for application', applicationId, sureSystemsError?.message || sureSystemsError);
                        }
                    }
                } catch (err) {
                    console.error('Error updating application status after DocuSeal completed:', err);
                }
                break;
            case 'form.declined':
                try {
                    // Mark the submitter row as declined (use submitter id present in data.id)
                    await updateBySubmitter({ status: 'declined', declined_at: data.declined_at || now, metadata: data.values || data.metadata || {} });

                    // Also update any submission-level rows by submission.id if available
                    const submissionId = data.submission?.id || data.submission_id;
                    if (submissionId) {
                        await supabase
                            .from('docuseal_submissions')
                            .update({ status: 'declined', declined_at: data.declined_at || now, updated_at: now })
                            .eq('submission_id', submissionId);
                    }
                } catch (error) {
                    console.error('DocuSeal form.declined handling error:', error);
                }
                break;
            case 'submission.archived':
                await updateBySubmission({ status: 'archived', archived_at: data.archived_at || now });
                break;
            case 'submission.created':
                try {
                    const submitters = data.submitters || [];
                    for (const submitter of submitters) {
                        await supabase
                            .from('docuseal_submissions')
                            .upsert({
                                application_id: data.metadata?.application_id || data.application_id || null,
                                submission_id: data.id || data.submission_id || null,
                                submitter_id: submitter.id,
                                slug: submitter.slug || null,
                                status: submitter.status || 'pending',
                                email: submitter.email || null,
                                name: submitter.name || null,
                                role: submitter.role || null,
                                embed_src: submitter.embed_src || null,
                                sent_at: submitter.sent_at || now,
                                metadata: submitter.metadata || {},
                                created_at: submitter.created_at || data.created_at || now,
                                updated_at: now
                            }, { onConflict: 'submitter_id' });
                    }
                } catch (error) {
                    console.error('DocuSeal webhook upsert error:', error);
                }
                break;
            // Handle updates where submitter status changes (e.g. declined) or submission metadata updates
            case 'submitter.updated':
            case 'submitter.status_changed':
            case 'submission.updated':
            case 'submission.declined':
            case 'submitter.declined':
            case 'form.declined':
                try {
                    // If submitters array provided, upsert each submitter (status may have changed)
                    const submitters = data.submitters || [];
                    if (submitters.length > 0) {
                        for (const submitter of submitters) {
                            await supabase
                                .from('docuseal_submissions')
                                .upsert({
                                    application_id: data.metadata?.application_id || data.application_id || null,
                                    submission_id: data.id || data.submission_id || null,
                                    submitter_id: submitter.id,
                                    slug: submitter.slug || null,
                                    status: submitter.status || 'pending',
                                    email: submitter.email || null,
                                    name: submitter.name || null,
                                    role: submitter.role || null,
                                    embed_src: submitter.embed_src || null,
                                    sent_at: submitter.sent_at || now,
                                    metadata: submitter.metadata || {},
                                    created_at: submitter.created_at || data.created_at || now,
                                    updated_at: now
                                }, { onConflict: 'submitter_id' });
                        }
                    }

                    // If submission-level status provided, update rows by submission_id
                    const submissionId = data.id || data.submission_id;
                    if (submissionId && data.status) {
                        await supabase
                            .from('docuseal_submissions')
                            .update({ status: data.status, updated_at: now })
                            .eq('submission_id', submissionId);
                    }
                } catch (error) {
                    console.error('DocuSeal webhook update error:', error);
                }
                break;
            default:
                console.log('Unhandled DocuSeal webhook event:', eventType);
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        console.error('DocuSeal webhook processing error:', error);
        return res.status(500).json({ error: error.message || 'DocuSeal webhook failed' });
    }
});


// =================================================================
// --- 5. ADMIN & PUBLIC STATIC FILE SERVING (THE FIX) ---
// =================================================================

// 5a. Define the path to your *BUILT* admin app's 'dist' folder
const adminDistPath = path.join(__dirname, 'public', 'admin', 'dist');
const adminAssetsPath = path.join(adminDistPath, 'assets');
const adminSourcePath = path.join(__dirname, 'public', 'admin');
const adminBuildExists = fs.existsSync(path.join(adminDistPath, 'index.html'));

// Helper to pick the built file when it exists, otherwise fall back to source HTML.
const resolveAdminFile = (fileName) => {
    const builtFile = path.join(adminDistPath, fileName);
    if (adminBuildExists && fs.existsSync(builtFile)) {
        return builtFile;
    }
    return path.join(adminSourcePath, fileName);
};

if (adminBuildExists) {
    // ★★★ THIS IS THE FIX YOU NEEDED ★★★
    // This captures requests to /assets/... and points them to public/admin/dist/assets
    app.use('/assets', express.static(adminAssetsPath));

    // Fallback for cached asset names (serves latest hash when old file requested)
    app.get('/assets/:assetName', (req, res, next) => {
        const requestedFile = path.join(adminAssetsPath, req.params.assetName);
        if (fs.existsSync(requestedFile)) {
            return res.sendFile(requestedFile);
        }

        const dotIndex = req.params.assetName.lastIndexOf('.');
        const dashIndex = req.params.assetName.indexOf('-');
        if (dotIndex === -1 || dashIndex === -1) {
            return next();
        }

        const baseName = req.params.assetName.slice(0, dashIndex);
        const extension = req.params.assetName.slice(dotIndex);

        try {
            const files = fs.readdirSync(adminAssetsPath);
            const match = files.find(file => file.startsWith(`${baseName}-`) && file.endsWith(extension));
            if (match) {
                return res.sendFile(path.join(adminAssetsPath, match));
            }
        } catch (err) {
            console.error('Asset fallback error:', err);
        }

        return next();
    });

    // 5b. Serve all static assets (CSS, JS) from the 'dist' folder
    // This uses the '/admin' prefix
    app.use('/admin', express.static(adminDistPath));
} else {
    console.warn('Admin build not found at public/admin/dist. Falling back to source files. Run "npm run build --prefix public/admin" for optimized assets.');
    app.use('/admin', express.static(adminSourcePath));
}

// 5c. Serve the REST of the 'public' folder (for login.html, etc.)
app.use(express.static(path.join(__dirname, 'public')));


// --- 6. Root Redirect & Auth Helpers ---
app.get('/', (req, res) => {
    res.redirect('/auth/login.html');
});

// Helper routes to catch bad redirects
app.get('/login.html', (req, res) => {
    res.redirect('/auth/login.html');
});
app.get('/auth.html', (req, res) => {
    res.redirect('/auth/login.html');
});


// --- 7. Admin Page Routes (FOR MPA) ---

const sendAdminPage = (fileName, res) => {
    const filePath = resolveAdminFile(fileName);
    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    }
    return res.status(404).send('Admin page not found. Build the admin app or check the path.');
};

app.get('/admin', (req, res) => {
    sendAdminPage('index.html', res);
});

app.get('/admin/index.html', (req, res) => {
    sendAdminPage('index.html', res);
});

app.get('/admin/auth.html', (req, res) => {
    sendAdminPage('auth.html', res);
});

app.get('/admin/dashboard', (req, res) => {
    sendAdminPage('dashboard.html', res);
});


app.get('/admin/analytics', (req, res) => {
    sendAdminPage('analytics.html', res);
});

app.get('/admin/applications', (req, res) => {
    sendAdminPage('applications.html', res);
});

app.get('/admin/application-detail', (req, res) => {
    sendAdminPage('application-detail.html', res);
});

app.get('/admin/create-application-step1', (req, res) => {
    sendAdminPage('create-application-step1.html', res);
});

app.get('/admin/incoming-payments', (req, res) => {
    sendAdminPage('incoming-payments.html', res);
});

app.get('/admin/outgoing-payments', (req, res) => {
    sendAdminPage('outgoing-payments.html', res);
});

app.get('/admin/users', (req, res) => {
    sendAdminPage('users.html', res);
});

app.get('/admin/settings', (req, res) => {
    sendAdminPage('settings.html', res);
});


// --- 8. Start Server ---
app.listen(PORT, () => {
    const companyNameForLog = cachedSystemSettings?.data?.company_name || DEFAULT_SYSTEM_SETTINGS.company_name;
    console.log(`🚀 ${companyNameForLog} server running on http://localhost:${PORT}`);
    console.log(`📁 Serving admin files from: ${adminDistPath}`);
    console.log(`📁 Serving public files from: ${path.join(__dirname, 'public')}`);
    
    // Start notification scheduler
    startNotificationScheduler();
});