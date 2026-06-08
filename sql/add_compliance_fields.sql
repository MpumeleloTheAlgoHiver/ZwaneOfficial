-- Add compliance fields for the login footer + contracts
-- Run once in Supabase SQL editor

ALTER TABLE public.system_settings
    ADD COLUMN IF NOT EXISTS legal_entity_name text,
    ADD COLUMN IF NOT EXISTS fsp_number        text;

-- Suggested defaults for Zwane Financial Services — replace with real values when supplied
UPDATE public.system_settings
SET legal_entity_name = COALESCE(legal_entity_name, 'Zwane Financial Services (Pty) Ltd')
WHERE id = 'global' AND (legal_entity_name IS NULL OR legal_entity_name = '');
