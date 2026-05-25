-- =====================================================================
-- SACRRA Layout 700v2 — Compliance View
-- Replaces sacrra_700_view; now reads from loan_applications + profiles
-- Run once in Supabase SQL Editor
-- =====================================================================

-- Status code mapping (app status → Layout 700 code):
--   DISBURSED / ACTIVE / DEBICHECK_AUTH / READY_TO_DISBURSE  → C  (Current)
--   OFFER_ACCEPTED / CONTRACT_SIGN                           → P  (Payment arrangement)
--   IN_DEFAULT                                               → D  (Delinquent 1–2 months)
--   CLOSED / PAID_UP                                         → T  (Transfer / paid up)
--   CANCELLED / REJECTED                                     → V  (Voluntary surrender / cancelled)
--   Everything else (pending/processing)                     → L  (Legal / hold)

CREATE OR REPLACE VIEW public.sacrra_700_view AS
SELECT
    la.id::text                                                 AS internal_id,

    -- Record type: 'R' for new registration, 'C' for correction
    'R'                                                         AS f01_record_type,

    -- Supplier Reference Number (SRN) — 6 chars: 2 letters + 4 digits
    -- Populated from system_settings.provider_branch_code or fallback
    RPAD(COALESCE(
        (SELECT provider_branch_code FROM public.system_settings LIMIT 1),
        'AL0001'
    ), 6, ' ')                                                  AS f02_supplier_ref,

    -- Account Number (unique match key — no spaces)
    REPLACE(la.id::text, ' ', '')                               AS f40_account_number,

    -- Account type: M = One Month Personal Loan, P = Personal Loans
    CASE
        WHEN COALESCE(la.term_months, 1) = 1 THEN 'M'
        ELSE 'P'
    END                                                         AS f03_account_type,

    -- Status code mapped from application status
    CASE la.status
        WHEN 'DISBURSED'          THEN 'C'
        WHEN 'ACTIVE'             THEN 'C'
        WHEN 'DEBICHECK_AUTH'     THEN 'C'
        WHEN 'READY_TO_DISBURSE'  THEN 'C'
        WHEN 'OFFER_ACCEPTED'     THEN 'P'
        WHEN 'CONTRACT_SIGN'      THEN 'P'
        WHEN 'IN_DEFAULT'         THEN 'D'
        WHEN 'CLOSED'             THEN 'T'
        WHEN 'PAID_UP'            THEN 'T'
        WHEN 'CANCELLED'          THEN 'V'
        WHEN 'REJECTED'           THEN 'V'
        ELSE                           'L'
    END                                                         AS f50_status_code,

    -- Status date (YYYYMMDD)
    TO_CHAR(COALESCE(la.updated_at, la.created_at), 'YYYYMMDD') AS f51_status_date,

    -- Account opened date (YYYYMMDD)
    TO_CHAR(la.created_at, 'YYYYMMDD')                          AS f43_date_opened,

    -- Financial fields (in cents, 12-digit zero-padded)
    LPAD((COALESCE(la.offer_principal, la.amount, 0) * 100)::bigint::text, 12, '0')
                                                                AS f41_opening_balance,

    LPAD((
        CASE la.status
            WHEN 'CLOSED'   THEN 0
            WHEN 'PAID_UP'  THEN 0
            WHEN 'CANCELLED' THEN 0
            WHEN 'REJECTED'  THEN 0
            ELSE COALESCE(la.offer_total_repayment, la.offer_principal, la.amount, 0)
        END * 100
    )::bigint::text, 12, '0')                                   AS f44_current_balance,

    LPAD((COALESCE(la.offer_monthly_repayment, 0) * 100)::bigint::text, 12, '0')
                                                                AS f45_installment,

    -- Arrears (zero for positive status codes C/P/T/V)
    LPAD((
        CASE la.status
            WHEN 'IN_DEFAULT' THEN COALESCE(la.offer_monthly_repayment, 0)
            ELSE 0
        END * 100
    )::bigint::text, 12, '0')                                   AS f49_arrears_amount,

    -- Months in arrears (0 for positive status codes)
    CASE la.status WHEN 'IN_DEFAULT' THEN '01' ELSE '00' END    AS f53_months_in_arrears,

    -- Consumer identity
    RPAD(COALESCE(p.id_number, ''), 13, ' ')                    AS f10_id_number,
    COALESCE(p.gender, 'M')                                     AS f11_gender,
    COALESCE(REPLACE(p.date_of_birth, '-', ''), '00000000')     AS f12_date_of_birth,

    -- Consumer name
    RPAD(UPPER(COALESCE(p.surname, '')), 30, ' ')               AS f06_surname,
    RPAD(COALESCE(UPPER(p.title), 'MR'), 5, ' ')                AS f08_title,
    RPAD(UPPER(COALESCE(p.first_name, '')), 30, ' ')            AS f07_first_names,
    RPAD(COALESCE(UPPER(p.middle_name), ''), 15, ' ')           AS f09_middle_names,

    -- Address
    RPAD(COALESCE(p.address_line_1, ''), 30, ' ')               AS f13_address_1,
    RPAD('', 30, ' ')                                           AS f14_address_2,
    RPAD(COALESCE(p.town_city, ''), 30, ' ')                    AS f15_city,
    RPAD('', 30, ' ')                                           AS f16_province,
    RPAD(COALESCE(p.postal_code, ''), 10, ' ')                  AS f17_postal,

    -- Employment
    RPAD(COALESCE(p.employer_name, ''), 50, ' ')                AS f35_employer,
    RPAD(COALESCE(p.occupation, ''), 30, ' ')                   AS f36_occupation,

    -- Contact
    RPAD(COALESCE(p.phone_mobile, p.contact_number, ''), 15, ' ') AS f31_mobile,
    RPAD(COALESCE(p.phone_work, ''), 15, ' ')                   AS f32_work,

    -- Repayment start date (00000000 if not set)
    COALESCE(TO_CHAR(la.repayment_start_date::date, 'YYYYMMDD'), '00000000')
                                                                AS f46_first_payment_date

FROM public.loan_applications la
JOIN public.profiles p ON la.user_id = p.id
WHERE la.status NOT IN ('STARTED', 'BUREAU_CHECKING', 'BUREAU_OK', 'BANK_LINKING', 'AFFORD_OK', 'OFFERED');

-- Only include records that have actually progressed past the offer stage
-- (records not yet accepted don't need to be reported to bureaux)
