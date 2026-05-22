-- SACRRA 700v2 PRODUCTION SETUP (REFINED V6 - REVENUE ANALYTICS SYNC)
-- This version mirrors the Balance Sheet Logic from Revenue Analytics.

-- 1. DROP THE OLD DUMMY VIEW
DROP VIEW IF EXISTS sacrra_monthly_export;

-- 2. CREATE THE PRODUCTION VIEW
-- Note: 'SECURITY INVOKER' ensures it works with your Supabase Auth settings
CREATE VIEW sacrra_monthly_export WITH (security_invoker = true) AS
WITH loan_performance AS (
    SELECT 
        l.id as loan_id,
        l.user_id,
        l.principal_amount,
        l.monthly_payment,
        l.start_date,
        COALESCE(SUM(p.amount), 0) as total_paid,
        -- Arrears: (Months since start * monthly_payment) - total_paid
        -- This logic mirrors the analytics.js "Waterfall" engine
        GREATEST(0, (EXTRACT(YEAR FROM age(NOW(), l.start_date)) * 12 + EXTRACT(MONTH FROM age(NOW(), l.start_date))) * l.monthly_payment - COALESCE(SUM(p.amount), 0)) as calculated_arrears
    FROM loans l
    LEFT JOIN payments p ON l.id = p.loan_id
    GROUP BY l.id, l.user_id, l.principal_amount, l.monthly_payment, l.start_date
)
SELECT
    'D' AS f1,                                             -- Record Type
    RPAD(UPPER(SPLIT_PART(p.full_name, ' ', 2)), 30, ' ') AS f15, -- Surname
    RPAD(COALESCE(p.identity_number, ''), 13, ' ') AS f10,      -- ID Number
    
    -- Balance from Analytics Logic (Principal - Principal Paid)
    LPAD((GREATEST(0, lp.principal_amount - lp.total_paid) * 100)::text, 12, '0') AS f44,
    
    -- Instalment (Contractual)
    LPAD((lp.monthly_payment * 100)::text, 12, '0') AS f48,
    
    -- Arrears (Calculated)
    LPAD((lp.calculated_arrears * 100)::text, 12, '0') AS f49,

    RPAD(COALESCE(lp.loan_id::text, ''), 30, ' ') AS f40,       -- Match Key (Field 40)
    TO_CHAR(COALESCE(lp.start_date, NOW()), 'YYYYMMDD') AS f26, -- Date Opened
    RPAD('', 570, ' ') AS filler                                -- Filler to reach 700
FROM loan_performance lp
JOIN profiles p ON lp.user_id = p.id;
