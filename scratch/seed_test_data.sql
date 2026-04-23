-- SACRRA 700v2 TEST SUITE SEED
-- This script adds 10 mock users and accounts for showcase purposes.

-- 1. SEED CONSUMERS (10 Realistic SA Identity Profiles)
INSERT INTO consumers (id, sa_id, first_name, surname, date_of_birth)
VALUES 
(gen_random_uuid(), '8501015009087', 'Thabo', 'Mokoena', '19850101'),
(gen_random_uuid(), '9205125218084', 'Sarah', 'Levin', '19920512'),
(gen_random_uuid(), '7811235190083', 'James', 'Smit', '19781123'),
(gen_random_uuid(), '8802285211082', 'Naledi', 'Zwane', '19880228'),
(gen_random_uuid(), '9507155140087', 'Kevin', 'Naidoo', '19950715'),
(gen_random_uuid(), '8203045213081', 'Elena', 'Botha', '19820304'),
(gen_random_uuid(), '9004255142080', 'Bongani', 'Dlamini', '19900425'),
(gen_random_uuid(), '7512305191089', 'Catherine', 'OReilly', '19751230'),
(gen_random_uuid(), '8406185214085', 'Siyabonga', 'Gumede', '19840618'),
(gen_random_uuid(), '9108105141086', 'Zoe', 'Hendricks', '19910810');

-- 2. SEED ACCOUNTS (Matching 1:1, varied statuses for showcase)
INSERT INTO accounts (account_number, consumer_id, current_balance, instalment_amount, months_in_arrears, status_code, loan_reason_code, account_type, active, opened_date, term)
SELECT 
    'ACC-' || floor(random() * 1000000)::text,
    id,
    floor(random() * 5000000 + 100000), -- 1,000 to 50,000 Rand (in cents)
    floor(random() * 500000 + 50000),   -- 500 to 5,000 Rand (in cents)
    floor(random() * 3),                -- 0 to 2 months arrears
    '00',                               -- Default OK
    'P',                                -- Personal Loan
    'P',                                -- Type P
    true,
    '20230101',
    24
FROM consumers
WHERE surname IN ('Mokoena', 'Levin', 'Smit', 'Zwane', 'Naidoo', 'Botha', 'Dlamini', 'OReilly', 'Gumede', 'Hendricks');

-- 3. SEED SHOWCASE REJECTIONS (For the Validation Workspace)
INSERT INTO sacrra_rejections (account_number, field_name, error_message, severity, resolved)
SELECT 
    account_number,
    'Identity_Number',
    'ID checksum failed (Invalid SA Identity Format)',
    'Critical',
    false
FROM accounts
LIMIT 2;

INSERT INTO sacrra_rejections (account_number, field_name, error_message, severity, resolved)
SELECT 
    account_number,
    'Opening_Balance',
    'Negative value detected in credit-only account',
    'Critical',
    false
FROM accounts
OFFSET 2 LIMIT 1;
