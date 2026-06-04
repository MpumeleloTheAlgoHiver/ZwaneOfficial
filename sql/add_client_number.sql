-- Migration: Add client_number to profiles
-- Run this once in the Supabase SQL Editor

-- 1. Add the column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS client_number TEXT;

-- 2. Auto-generate client numbers for existing borrowers (sequential)
DO $$
DECLARE
  rec RECORD;
  counter INT := 1;
BEGIN
  FOR rec IN 
    SELECT id FROM public.profiles 
    WHERE role = 'borrower' OR role IS NULL
    ORDER BY created_at ASC
  LOOP
    UPDATE public.profiles 
    SET client_number = 'C' || LPAD(counter::text, 4, '0')
    WHERE id = rec.id AND client_number IS NULL;
    counter := counter + 1;
  END LOOP;
END $$;

-- 3. Create a trigger to auto-assign on new borrower insert
CREATE OR REPLACE FUNCTION assign_client_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INT;
BEGIN
  IF NEW.role = 'borrower' AND NEW.client_number IS NULL THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(client_number FROM 2) AS INT)), 0) + 1
    INTO next_num
    FROM public.profiles
    WHERE client_number ~ '^C[0-9]+$';
    NEW.client_number := 'C' || LPAD(next_num::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_client_number ON public.profiles;
CREATE TRIGGER trg_assign_client_number
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION assign_client_number();

-- Verify
SELECT id, full_name, role, client_number FROM public.profiles ORDER BY created_at;
