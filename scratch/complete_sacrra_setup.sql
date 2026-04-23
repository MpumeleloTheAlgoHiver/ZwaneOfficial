-- SACRRA 700v2 COMPLETE SETUP & SHOWCASE SEED (FULL CASCADE RESET)
-- RUN THIS ENTIRE SCRIPT AT ONCE TO INITIALIZE THE SCHEMA AND TEST DATA.

-- 1. HARD RESET (Clear old schema)
DROP VIEW IF EXISTS v_monthly_extract_accounts CASCADE;
DROP TABLE IF EXISTS sacrra_rejections CASCADE;
DROP TABLE IF EXISTS sacrra_extract_runs CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS consumers CASCADE;

-- 2. CREATE TABLES (Correct Schema)
CREATE TABLE consumers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sa_id TEXT UNIQUE NOT NULL,
    first_name TEXT,
    surname TEXT,
    date_of_birth TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number TEXT UNIQUE NOT NULL,
    consumer_id UUID REFERENCES consumers(id),
    account_type TEXT DEFAULT 'P',
    current_balance BIGINT DEFAULT 0,
    instalment_amount BIGINT DEFAULT 0,
    arrears_amount BIGINT DEFAULT 0,
    months_in_arrears INTEGER DEFAULT 0,
    status_code TEXT DEFAULT '00',
    loan_reason_code TEXT DEFAULT 'P',
    payment_type TEXT DEFAULT '01',
    last_payment_date TEXT DEFAULT '00000000',
    last_payment_amount BIGINT DEFAULT 0,
    term INTEGER DEFAULT 24,
    opened_date TEXT DEFAULT '20230101',
    active BOOLEAN DEFAULT true,
    branch_code TEXT DEFAULT '0001',
    sub_account TEXT DEFAULT '01',
    supplier_ref TEXT DEFAULT 'AA0001',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sacrra_extract_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_end TEXT NOT NULL,
    record_count INTEGER,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sacrra_rejections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number TEXT,
    field_name TEXT,
    error_message TEXT,
    severity TEXT, -- This is the missing column
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATE COMPLIANCE VIEW
CREATE VIEW v_monthly_extract_accounts AS
SELECT 
    a.*,
    c.sa_id,
    c.first_name,
    c.surname,
    c.date_of_birth
FROM accounts a
JOIN consumers c ON a.consumer_id = c.id;

-- 4. SEED SHOWCASE DATA
-- 4.1 Seed Consumers
INSERT INTO consumers (sa_id, first_name, surname, date_of_birth)
VALUES 
('8501015009087', 'Thabo', 'Mokoena', '19850101'),
('9205125218084', 'Sarah', 'Levin', '19920512'),
('7811235190083', 'James', 'Smit', '19781123'),
('8802285211082', 'Naledi', 'Zwane', '19880228'),
('9507155140087', 'Kevin', 'Naidoo', '19950715'),
('8203045213081', 'Elena', 'Botha', '19820304'),
('9004255142080', 'Bongani', 'Dlamini', '19900425'),
('7512305191089', 'Catherine', 'OReilly', '19751230'),
('8406185214085', 'Siyabonga', 'Gumede', '19840618'),
('9108105141086', 'Zoe', 'Hendricks', '19910810');

-- 4.2 Seed Accounts
INSERT INTO accounts (account_number, consumer_id, current_balance, instalment_amount, months_in_arrears, status_code, loan_reason_code)
SELECT 
    'ZN-' || floor(random() * 90000 + 10000)::text || '-001',
    id,
    floor(random() * 5000000 + 100000),
    floor(random() * 500000 + 50000),
    floor(random() * 2),
    '00',
    'P'
FROM consumers;

-- 4.3 Seed Rejections (Matches the Validation Workspace design)
INSERT INTO sacrra_rejections (account_number, field_name, error_message, severity)
VALUES 
('ZN-10294-001', 'Identity_Number', 'ID checksum failed (Invalid SA Identity Format)', 'Critical'),
('ZN-49203-045', 'Opening_Balance', 'Negative value detected in credit-only account', 'Critical'),
('ZN-29384-092', 'Postal_Code', 'Length mismatch (Expected 4, received 5)', 'Warning');
