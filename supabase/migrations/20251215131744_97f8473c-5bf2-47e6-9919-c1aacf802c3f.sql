-- Create job_audit table to track analysis runs
CREATE TABLE public.job_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'STARTED',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  step TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_audit ENABLE ROW LEVEL SECURITY;

-- Users can view their own job audits (via test ownership)
CREATE POLICY "Users can view their own job audits"
ON public.job_audit
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tests
    WHERE tests.id = job_audit.test_id
    AND tests.user_id = auth.uid()
  )
);

-- Service role can insert/update (edge functions use service role)
CREATE POLICY "Service role can manage job audits"
ON public.job_audit
FOR ALL
USING (true)
WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_job_audit_test_id ON public.job_audit(test_id);
CREATE INDEX idx_job_audit_status ON public.job_audit(status);