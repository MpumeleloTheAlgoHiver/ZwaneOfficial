-- SACRRA IN-PLACE UPGRADE (EMERGENCY LOGIN RESTORE)
-- This script RESTORES the original profiles/loans tables and upgrades them in-place.
-- This is 100% SAFE for Supabase Auth and Login.

DO $$ 
BEGIN
    -- 1. DROP THE MISTAKE TABLES & VIEWS (THE REASON FOR BLOCKAGE)
    DROP TABLE IF EXISTS public.consumers CASCADE;
    DROP TABLE IF EXISTS public.accounts CASCADE;
    DROP VIEW IF EXISTS public.profiles CASCADE;
    DROP VIEW IF EXISTS public.loans CASCADE;
    DROP VIEW IF EXISTS public.sacrra_700_view CASCADE;

    -- 2. RENAME LEGACY TABLES BACK TO LIVE NAMES
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles_legacy') THEN
        ALTER TABLE public.profiles_legacy RENAME TO profiles;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'loans_legacy') THEN
        ALTER TABLE public.loans_legacy RENAME TO loans;
    END IF;

    -- 3. SURGICALLY ADD SACRRA COLUMNS TO THE LIVE TABLES
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS title text DEFAULT 'MR';
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS middle_name text;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS surname text;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_number text;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth text;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text DEFAULT 'M';
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_line_1 text;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS town_city text;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS postal_code text;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employer_name text;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation text;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_work text;

        -- SYNC DATA (LOGIN SAFE)
        UPDATE public.profiles 
        SET 
            first_name = COALESCE(first_name, SPLIT_PART(full_name, ' ', 1)),
            surname = COALESCE(surname, NULLIF(SPLIT_PART(full_name, ' ', 2), '')),
            id_number = COALESCE(id_number, identity_number)
        WHERE first_name IS NULL;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'loans') THEN
        ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS supplier_ref text DEFAULT 'CS06626';
        ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS sub_account text DEFAULT '001';
        ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS account_type text DEFAULT '00';
        ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS installment_amount numeric DEFAULT 0;
        ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS arrears_amount numeric DEFAULT 0;
        ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS status_code text DEFAULT '00';
    END IF;
END $$;

-- 4. RECREATE COMPLIANCE VIEW POINTING TO THE LIVE TABLES
CREATE OR REPLACE VIEW public.sacrra_700_view AS
SELECT 
    l.id AS internal_id,
    'R' AS f01_record_type,
    RPAD(COALESCE(p.id_number, ''), 15, ' ') AS f10_id_number,
    RPAD('', 15, ' ') AS f00_silence_1,
    COALESCE(p.gender, 'M') AS f11_gender,
    COALESCE(REPLACE(p.date_of_birth, '-', ''), '19000101') AS f12_date_of_birth,
    RPAD(COALESCE(l.supplier_ref, 'CS06626'), 15, ' ') AS f02_supplier_ref,
    RPAD('60', 30, ' ') AS f40_match_index,
    RPAD(UPPER(COALESCE(p.surname, '')), 30, ' ') AS f06_surname,
    RPAD(COALESCE(UPPER(p.title), 'MR'), 5, ' ') AS f08_title,
    RPAD(UPPER(COALESCE(p.first_name, '')), 30, ' ') AS f07_first_names,
    RPAD(COALESCE(UPPER(p.middle_name), ''), 15, ' ') AS f09_middle_names,
    RPAD(COALESCE(p.address_line_1, ''), 30, ' ') AS f13_address_1,
    RPAD(COALESCE(p.town_city, ''), 30, ' ') AS f15_city,
    RPAD(COALESCE(p.postal_code, ''), 10, ' ') AS f17_postal,
    RPAD(COALESCE(p.employer_name, ''), 50, ' ') AS f35_employer,
    RPAD(COALESCE(p.occupation, ''), 30, ' ') AS f36_occupation,
    '00O' AS f51_lifecycle_1,
    '00M' AS f52_lifecycle_2,
    COALESCE(TO_CHAR(l.created_at, 'YYYYMMDD'), '20230302') AS f43_date_opened,
    LPAD((COALESCE(l.outstanding_balance, 0) * 100)::bigint::text, 12, '0') AS f44_current_balance,
    LPAD((COALESCE(l.installment_amount, 0) * 100)::bigint::text, 12, '0') AS f45_installment,
    LPAD((COALESCE(l.arrears_amount, 0) * 100)::bigint::text, 12, '0') AS f49_arrears_amount,
    RPAD(COALESCE(l.status_code, '00'), 2, ' ') AS f50_status_code,
    RPAD(COALESCE(p.phone_mobile, p.contact_number, ''), 15, ' ') AS f31_mobile,
    RPAD(COALESCE(p.phone_work, ''), 15, ' ') AS f32_work
FROM public.loans l
JOIN public.profiles p ON l.user_id = p.id;
