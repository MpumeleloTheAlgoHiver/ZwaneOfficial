-- SACRRA 700v2 UAT DUMMY DATA (THE "PERFECT 10" COHORT)
-- This script populates the database with intentional edge cases to test formatting and logic.

-- 1. SEED CONSUMERS (Mapping provided 'customers' to our 'consumers' schema)
INSERT INTO consumers (sa_id, first_name, surname, date_of_birth)
VALUES
  ('8507125123088', 'THABO', 'DZUMBA', '19850712'),
  ('9201010123081', 'ANNA-MARIE', 'VAN DER MERWE', '19920101'),
  ('9602295123082', 'LARRY', 'LEAP', '19960229'),
  ('0505055123084', 'YOLANDA', 'YOUTH', '20050505'),
  ('A01234567', 'JOHN', 'SMITH', '19701010');

-- 2. SEED ACCOUNTS (Matching Account Type logic)
INSERT INTO accounts (
  consumer_id, 
  account_number, 
  account_type, -- Field 23
  current_balance, -- Field 31
  instalment_amount, -- Field 33
  opened_date, -- Field 26
  status_code -- Internal/Compliance
)
SELECT 
  id, 
  'ZN-' || SUBSTR(sa_id, 1, 8) || '-001',
  CASE 
    WHEN surname = 'DZUMBA' THEN 'P' -- Personal Loan
    WHEN surname = 'VAN DER MERWE' THEN 'C' -- Credit Card
    WHEN surname = 'LEAP' THEN 'M' -- One Month Loan
    WHEN surname = 'YOUTH' THEN 'Y' -- Vehicle Finance
    ELSE 'F' -- Open Service
  END,
  250000, -- R2500.00
  50000,  -- R500.00
  '20230101',
  '00'
FROM consumers;

-- 3. SEED ACCOUNT CONVERSIONS (Field 42-45 Sync Test)
INSERT INTO account_conversions (old_account_number, new_account_number, conversion_date)
SELECT 'OLD-EXT-12345', account_number, to_char(now(), 'YYYYMMDD') 
FROM accounts LIMIT 1;
