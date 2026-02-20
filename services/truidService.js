const axios = require('axios');
const { supabaseService } = require('../config/supabaseServer');

const readEnv = (key) => process.env[key] || process.env[`VITE_${key}`];

const COMPLETE_STATUSES = new Set([
  'connected',
  'verified',
  'completed',
  'success',
  'approved',
  'data_ready',
  'ready'
]);

const sessionsByCollectionId = new Map();
const latestCollectionByUser = new Map();
const TRUID_COLLECTIONS_TABLE = 'truid_collections';

class TruIDClient {
  constructor() {
    this.apiKey = readEnv('TRUID_API_KEY');
    this.subscriptionKey = readEnv('TRUID_SUBSCRIPTION_KEY') || this.apiKey;
    const configuredBase = readEnv('TRUID_API_BASE') || readEnv('TRUID_API_BASE_URL') || 'https://api.truidconnect.io';
    this.baseURL = configuredBase.replace(/\/$/, '');
    this.companyId = readEnv('COMPANY_ID');
    this.brandId = readEnv('BRAND_ID');
    this.redirectUrl = readEnv('REDIRECT_URL');
    this.webhookUrl = readEnv('WEBHOOK_URL');
  }

  validateSetup() {
    const missing = [];
    if (!this.apiKey) missing.push('TRUID_API_KEY');
    if (!this.companyId) missing.push('COMPANY_ID');
    if (!this.brandId) missing.push('BRAND_ID');
    if (missing.length) {
      const err = new Error(`Missing required environment variables: ${missing.join(', ')}`);
      err.code = 'TRUID_CONFIG_MISSING';
      throw err;
    }
  }

  buildConsumerUrl(consentId) {
    if (!consentId) return null;
    const scheme = readEnv('TRUID_SCHEME') || 'https';
    const domain = readEnv('TRUID_DOMAIN') || 'hello.truidconnect.io';
    const host = domain.startsWith('www.') ? domain : `www.${domain}`;
    return `${scheme}://${host}/consents/${consentId}`;
  }

  normalizeConsumerUrl(url) {
    if (!url || typeof url !== 'string') return url;
    const scheme = readEnv('TRUID_SCHEME') || 'https';
    const domain = readEnv('TRUID_DOMAIN');
    if (!domain) return url;
    try {
      const parsed = new URL(url);
      const host = domain.startsWith('www.') ? domain : `www.${domain}`;
      parsed.protocol = `${scheme}:`;
      parsed.host = host;
      return parsed.toString();
    } catch (_) {
      return url;
    }
  }

  resolveConsumerUrl(responseData, consentId, locationHeader) {
    if (responseData?.consumerUrl) return this.normalizeConsumerUrl(responseData.consumerUrl);
    if (responseData?.links?.consumer) return this.normalizeConsumerUrl(responseData.links.consumer);
    if (responseData?.inviteUrl) return this.normalizeConsumerUrl(responseData.inviteUrl);
    if (locationHeader) return this.normalizeConsumerUrl(locationHeader);
    return this.buildConsumerUrl(consentId);
  }

  extractCollectionId(locationHeader, fallback) {
    if (fallback) return fallback;
    if (!locationHeader) return null;
    try {
      const parts = locationHeader.split('/');
      return parts[parts.length - 1];
    } catch (_) {
      return null;
    }
  }

  normalizeError(error, defaultMessage) {
    const status = error.status || error.response?.status || 500;
    const details = error.message || error.response?.data?.message || defaultMessage;
    const err = new Error(details);
    err.status = status;
    return err;
  }

  async fetchApi(client, method, path, body = null) {
    const url = `${this.baseURL}/${client}${path}`;
    try {
      const response = await axios({
        method,
        url,
        data: body,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey
        },
        validateStatus: () => true,
        timeout: 25000
      });

      const responseHeaders = {};
      Object.keys(response.headers || {}).forEach((key) => {
        responseHeaders[key.toLowerCase()] = response.headers[key];
      });

      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        const err = new Error(typeof data === 'string' ? data : JSON.stringify(data));
        err.status = response.status;
        throw err;
      }

      return { status: response.status, data, headers: responseHeaders };
    } catch (error) {
      if (!error.status && error.response?.status) {
        error.status = error.response.status;
      }
      throw error;
    }
  }

  async createCollection(options = {}) {
    this.validateSetup();
    const {
      name,
      idNumber,
      idType = 'id',
      email,
      mobile,
      provider,
      accounts,
      auto,
      consentId,
      rememberMe,
      services,
      correlation,
      force
    } = options;

    if (!name || !idNumber) {
      const err = new Error('Name and idNumber are required to create a collection.');
      err.status = 400;
      throw err;
    }

    const payload = {
      name,
      idNumber,
      idType,
      brandId: this.brandId,
      ...(this.companyId && { companyId: this.companyId }),
      ...(email && { email }),
      ...(mobile && { mobile }),
      ...(provider && { provider }),
      ...(Array.isArray(accounts) && accounts.length ? { accounts } : {}),
      ...(typeof auto === 'boolean' ? { auto } : {}),
      ...(consentId && { consentId }),
      ...(rememberMe && { rememberMe }),
      ...(Array.isArray(services) && services.length ? { services } : {}),
      ...(correlation && Object.keys(correlation).length ? { correlation } : {}),
      ...(force ? { force: true } : {}),
      ...(this.redirectUrl && { redirectUrl: this.redirectUrl }),
      ...(this.webhookUrl && { webhookUrl: this.webhookUrl })
    };

    try {
      const response = await this.fetchApi('consultant-api', 'POST', '/collections', payload);
      const payloadData = typeof response.data === 'object' && response.data !== null ? response.data : null;
      const collectionId = this.extractCollectionId(response.headers.location, payloadData?.id);
      const consumerUrl = this.resolveConsumerUrl(payloadData, response.headers['x-consent'], response.headers.location);

      return {
        success: true,
        status: response.status,
        collectionId,
        data: payloadData,
        consentId: response.headers['x-consent'],
        consumerUrl
      };
    } catch (error) {
      throw this.normalizeError(error, 'Failed to create collection');
    }
  }

  async getCollection(collectionId) {
    this.validateSetup();
    try {
      const response = await this.fetchApi('consultant-api', 'GET', `/collections/${collectionId}`);
      return { success: true, status: response.status, data: response.data };
    } catch (error) {
      throw this.normalizeError(error, 'Failed to retrieve collection');
    }
  }

  async getCollectionData(collectionId) {
    this.validateSetup();
    try {
      const response = await this.fetchApi('delivery-api', 'GET', `/collections/${collectionId}/products/summary`);
      return { success: true, status: response.status, data: response.data };
    } catch (error) {
      throw this.normalizeError(error, 'Failed to download collection data');
    }
  }
}

const truIDClient = new TruIDClient();

function isMissingTableError(error) {
  return error?.code === '42P01' || /relation .* does not exist/i.test(error?.message || '');
}

function createMissingTableError() {
  const err = new Error('TruID persistence table is missing. Run the provided SQL migration to create truid_collections.');
  err.status = 500;
  err.code = 'TRUID_TABLE_MISSING';
  return err;
}

async function upsertCollectionRecord(record = {}) {
  if (!record.collection_id) {
    return null;
  }

  const payload = {
    collection_id: record.collection_id,
    user_id: record.user_id || null,
    application_id: record.application_id || null,
    consent_id: record.consent_id || null,
    consumer_url: record.consumer_url || null,
    status: record.status || null,
    normalized_status: normalizeStatus(record.status || ''),
    verified: typeof record.verified === 'boolean' ? record.verified : isCompleteStatus(record.status || ''),
    correlation: record.correlation || null,
    collection_payload: record.collection_payload || null,
    summary_payload: record.summary_payload || null,
    capture_attempts: Number.isInteger(record.capture_attempts) ? record.capture_attempts : undefined,
    captured_at: record.captured_at || null,
    last_error: record.last_error || null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabaseService
    .from(TRUID_COLLECTIONS_TABLE)
    .upsert(payload, { onConflict: 'collection_id' })
    .select('*')
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      throw createMissingTableError();
    }
    throw new Error(error.message || 'Unable to upsert TruID collection record');
  }

  return data;
}

async function getCollectionRecord(collectionId) {
  if (!collectionId) {
    return null;
  }

  const { data, error } = await supabaseService
    .from(TRUID_COLLECTIONS_TABLE)
    .select('*')
    .eq('collection_id', collectionId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      throw createMissingTableError();
    }
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(error.message || 'Unable to load TruID collection record');
  }

  return data || null;
}

async function getLatestCollectionForUser(userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabaseService
    .from(TRUID_COLLECTIONS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      throw createMissingTableError();
    }
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(error.message || 'Unable to resolve latest TruID collection for user');
  }

  return data || null;
}

function buildNameFromParts(firstName, lastName) {
  const full = [firstName, lastName].filter(Boolean).join(' ').trim();
  return full || null;
}

async function resolveProfileIdentity(userId) {
  if (!userId) {
    return { name: null, idNumber: null, email: null, mobile: null };
  }

  const { data, error } = await supabaseService
    .from('profiles')
    .select('full_name, identity_number, email, contact_number')
    .eq('id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message || 'Unable to resolve profile identity');
  }

  const name = data?.full_name || null;
  const idNumber = data?.identity_number || null;
  const email = data?.email || null;
  const mobile = data?.contact_number || null;

  return { name, idNumber, email, mobile };
}

function normalizeStatus(status) {
  return (status || '').toString().trim().toLowerCase();
}

function formatStatusLabel(status) {
  if (!status) return 'Pending';
  return status
    .toString()
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isCompleteStatus(status) {
  return COMPLETE_STATUSES.has(normalizeStatus(status));
}

async function recordBankStatementCompletion(userId, collectionId, payload = {}) {
  if (!userId) {
    return null;
  }

  const { data: existingRecord } = await supabaseService
    .from('document_uploads')
    .select('id, file_name, uploaded_at')
    .eq('user_id', userId)
    .eq('file_type', 'bank_statement')
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRecord) {
    return existingRecord;
  }

  const filename = `truid_collection_${Date.now()}.json`;
  const filePath = payload.file_path
    || payload.report_url
    || `truid://collection/${collectionId || 'unknown'}`;

  const { data, error } = await supabaseService
    .from('document_uploads')
    .insert({
      application_id: payload.applicationId || payload.metadata?.applicationId || null,
      user_id: userId,
      file_name: filename,
      original_name: 'TruID Collection',
      file_path: filePath,
      file_type: 'bank_statement',
      mime_type: 'application/json',
      file_size: 0,
      status: 'uploaded'
    })
    .select('id, file_name, uploaded_at')
    .single();

  if (error) {
    throw new Error(error.message || 'Unable to mark bank statement as completed');
  }

  return data;
}

async function initiateCollection(input = {}) {
  const userId = input.userId || input.correlation?.userId || input.correlation?.user_id || null;

  let resolvedInput = { ...input };
  if ((!resolvedInput.name || !resolvedInput.idNumber) && userId) {
    const profileIdentity = await resolveProfileIdentity(userId);
    resolvedInput = {
      ...resolvedInput,
      name: resolvedInput.name || profileIdentity.name || undefined,
      idNumber: resolvedInput.idNumber || profileIdentity.idNumber || undefined,
      email: resolvedInput.email || profileIdentity.email || undefined,
      mobile: resolvedInput.mobile || profileIdentity.mobile || undefined
    };
  }

  const missingIdentityFields = [];
  if (!resolvedInput.name) missingIdentityFields.push('name');
  if (!resolvedInput.idNumber) missingIdentityFields.push('idNumber');

  if (missingIdentityFields.length > 0) {
    const err = new Error(
      `Missing required TruID identity data: ${missingIdentityFields.join(', ')}. Provide these in the request or ensure they exist on profiles for user ${userId || 'unknown'}.`
    );
    err.status = 400;
    throw err;
  }

  const result = await truIDClient.createCollection(resolvedInput);
  const collectionId = result.collectionId;

  const sessionEntry = {
    collectionId,
    userId,
    status: result.data?.status || result.data?.state || 'started',
    consentId: result.consentId || null,
    consumerUrl: result.consumerUrl || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    correlation: input.correlation || null
  };

  if (collectionId) {
    sessionsByCollectionId.set(collectionId, sessionEntry);
  }
  if (userId && collectionId) {
    latestCollectionByUser.set(userId, collectionId);
  }

  if (collectionId) {
    await upsertCollectionRecord({
      collection_id: collectionId,
      user_id: userId,
      application_id: input.applicationId || input.correlation?.applicationId || null,
      consent_id: result.consentId || null,
      consumer_url: result.consumerUrl || null,
      status: sessionEntry.status,
      correlation: input.correlation || null,
      collection_payload: result.data || null,
      verified: isCompleteStatus(sessionEntry.status)
    });
  }

  return {
    success: true,
    collectionId,
    consentId: result.consentId,
    consumerUrl: result.consumerUrl,
    status: sessionEntry.status,
    raw: result.data
  };
}

async function getCollectionStatus(collectionId) {
  if (!collectionId) {
    const err = new Error('collectionId is required');
    err.status = 400;
    throw err;
  }

  const result = await truIDClient.getCollection(collectionId);
  const status = result.data?.status || result.data?.state || 'pending';

  const dbRecord = await getCollectionRecord(collectionId);
  const existing = sessionsByCollectionId.get(collectionId) || {
    collectionId,
    userId: dbRecord?.user_id || null,
    applicationId: dbRecord?.application_id || null,
    createdAt: new Date().toISOString()
  };

  existing.status = status;
  existing.updatedAt = new Date().toISOString();
  sessionsByCollectionId.set(collectionId, existing);

  await upsertCollectionRecord({
    collection_id: collectionId,
    user_id: existing.userId,
    application_id: existing.applicationId || dbRecord?.application_id || null,
    consent_id: dbRecord?.consent_id || null,
    consumer_url: dbRecord?.consumer_url || null,
    status,
    correlation: dbRecord?.correlation || null,
    collection_payload: result.data || null,
    verified: isCompleteStatus(status)
  });

  if (isCompleteStatus(status) && existing.userId) {
    try {
      await captureCollectionData({
        collectionId,
        userId: existing.userId,
        applicationId: existing.applicationId || dbRecord?.application_id || null
      });
    } catch (captureError) {
      console.error('Failed to capture TruID summary after completion:', captureError.message || captureError);
      await upsertCollectionRecord({
        collection_id: collectionId,
        user_id: existing.userId,
        application_id: existing.applicationId || dbRecord?.application_id || null,
        status,
        last_error: captureError.message || 'Capture failed'
      });
    }
  }

  return {
    success: true,
    collectionId,
    status,
    statusLabel: formatStatusLabel(status),
    verified: isCompleteStatus(status),
    data: result.data,
    userId: existing.userId,
    updatedAt: existing.updatedAt
  };
}

async function getUserStatus(userId) {
  if (!userId) {
    const err = new Error('userId is required');
    err.status = 400;
    throw err;
  }

  const { data: uploadedDoc, error } = await supabaseService
    .from('document_uploads')
    .select('id, uploaded_at')
    .eq('user_id', userId)
    .eq('file_type', 'bank_statement')
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message || 'Unable to fetch bank statement status');
  }

  if (uploadedDoc) {
    return {
      success: true,
      verified: true,
      status: 'connected',
      statusLabel: 'Connected',
      source: 'document_uploads',
      updatedAt: uploadedDoc.uploaded_at
    };
  }

  let collectionId = latestCollectionByUser.get(userId);
  if (!collectionId) {
    const latestRecord = await getLatestCollectionForUser(userId);
    collectionId = latestRecord?.collection_id || null;
    if (collectionId) {
      latestCollectionByUser.set(userId, collectionId);
      sessionsByCollectionId.set(collectionId, {
        collectionId,
        userId,
        applicationId: latestRecord?.application_id || null,
        status: latestRecord?.status || 'pending',
        updatedAt: latestRecord?.updated_at || new Date().toISOString(),
        createdAt: latestRecord?.created_at || new Date().toISOString()
      });
    }
  }

  if (!collectionId) {
    return {
      success: true,
      verified: false,
      status: 'pending',
      statusLabel: 'Pending'
    };
  }

  const collectionStatus = await getCollectionStatus(collectionId);
  return {
    success: true,
    verified: collectionStatus.verified,
    status: collectionStatus.status,
    statusLabel: collectionStatus.statusLabel,
    collectionId,
    source: 'collection',
    updatedAt: collectionStatus.updatedAt
  };
}

async function getAllSessions() {
  try {
    const { data, error } = await supabaseService
      .from(TRUID_COLLECTIONS_TABLE)
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200);

    if (error) {
      if (isMissingTableError(error)) {
        throw createMissingTableError();
      }
      throw new Error(error.message || 'Unable to fetch TruID sessions');
    }

    return {
      success: true,
      count: data?.length || 0,
      sessions: data || []
    };
  } catch (error) {
    console.error('Falling back to in-memory TruID sessions:', error.message || error);
  }

  return {
    success: true,
    count: sessionsByCollectionId.size,
    sessions: Array.from(sessionsByCollectionId.values())
  };
}

async function captureCollectionData({ collectionId, userId, applicationId } = {}) {
  if (!collectionId) {
    const err = new Error('collectionId is required');
    err.status = 400;
    throw err;
  }

  const dbRecord = await getCollectionRecord(collectionId);
  const summary = await truIDClient.getCollectionData(collectionId);
  const status = summary.data?.status || 'data_ready';

  const existing = sessionsByCollectionId.get(collectionId) || {
    collectionId,
    userId: userId || dbRecord?.user_id || null,
    applicationId: applicationId || dbRecord?.application_id || null,
    createdAt: new Date().toISOString()
  };

  if (userId) {
    existing.userId = userId;
    latestCollectionByUser.set(userId, collectionId);
  }

  if (applicationId) {
    existing.applicationId = applicationId;
  }

  existing.status = status;
  existing.updatedAt = new Date().toISOString();
  sessionsByCollectionId.set(collectionId, existing);

  const verified = isCompleteStatus(status);
  const nextCaptureAttempts = (dbRecord?.capture_attempts || 0) + 1;

  await upsertCollectionRecord({
    collection_id: collectionId,
    user_id: existing.userId,
    application_id: existing.applicationId || dbRecord?.application_id || null,
    consent_id: dbRecord?.consent_id || null,
    consumer_url: dbRecord?.consumer_url || null,
    status,
    correlation: dbRecord?.correlation || null,
    summary_payload: summary.data || null,
    verified,
    capture_attempts: nextCaptureAttempts,
    captured_at: new Date().toISOString(),
    last_error: null
  });

  if (verified && existing.userId) {
    await recordBankStatementCompletion(existing.userId, collectionId, {
      applicationId: existing.applicationId || dbRecord?.application_id || null,
      file_path: `truid://collection/${collectionId}`
    });
  }

  return {
    success: true,
    collectionId,
    verified,
    status,
    statusLabel: formatStatusLabel(status),
    data: summary.data
  };
}

module.exports = {
  truIDClient,
  initiateCollection,
  getCollectionStatus,
  getUserStatus,
  getAllSessions,
  captureCollectionData,
  recordBankStatementCompletion
};
