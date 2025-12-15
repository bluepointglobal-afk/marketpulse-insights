-- Fix: ensure generate-analysis always updates tests.status and persists smvs_config
-- Also: add a lightweight trigger to keep updated_at fresh on updates.

-- 1) Add missing trigger to maintain updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_tests_updated_at'
  ) THEN
    CREATE TRIGGER update_tests_updated_at
    BEFORE UPDATE ON public.tests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 2) Optional: index to find stuck jobs faster
CREATE INDEX IF NOT EXISTS idx_tests_status_updated_at ON public.tests (status, updated_at DESC);
