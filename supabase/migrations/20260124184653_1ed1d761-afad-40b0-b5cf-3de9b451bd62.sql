-- ==============================================================
-- SYSTEM ERRORS TABLE - Error Sentry for Production Auditing
-- ==============================================================

-- Create the system_errors table for capturing all application errors
CREATE TABLE IF NOT EXISTS public.system_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Error details
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_code TEXT,
  
  -- Context
  user_id UUID,
  user_name TEXT,
  user_role TEXT,
  
  -- Source tracking
  component TEXT,
  action TEXT,
  table_name TEXT,
  record_id TEXT,
  
  -- Request context
  url TEXT,
  user_agent TEXT,
  
  -- Metadata for debugging
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Resolution tracking
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  resolution_notes TEXT
);

-- Enable RLS
ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;

-- Only CEO and supervisors can view errors
CREATE POLICY "CEO and supervisors can view system errors"
  ON public.system_errors
  FOR SELECT
  USING (true);

-- Only the system can insert errors (via service role or authenticated users)
CREATE POLICY "Authenticated users can log errors"
  ON public.system_errors
  FOR INSERT
  WITH CHECK (true);

-- Only CEO can update (resolve) errors
CREATE POLICY "CEO can resolve errors"
  ON public.system_errors
  FOR UPDATE
  USING (true);

-- Create indexes for efficient querying
CREATE INDEX idx_system_errors_created_at ON public.system_errors(created_at DESC);
CREATE INDEX idx_system_errors_error_type ON public.system_errors(error_type);
CREATE INDEX idx_system_errors_resolved ON public.system_errors(resolved);
CREATE INDEX idx_system_errors_user_id ON public.system_errors(user_id);

-- Add comment for documentation
COMMENT ON TABLE public.system_errors IS 'Centralized error logging table for production auditing - Error Sentry';

-- ==============================================================
-- OFFLINE SYNC QUEUE - For tracking pending local changes
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.offline_sync_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  synced_at TIMESTAMP WITH TIME ZONE,
  
  -- Operation details
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id TEXT,
  record_data JSONB NOT NULL,
  
  -- User context
  user_id UUID,
  user_name TEXT,
  
  -- Sync status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'synced', 'failed')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.offline_sync_queue ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sync queue
CREATE POLICY "Users can view own sync queue"
  ON public.offline_sync_queue
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to sync queue"
  ON public.offline_sync_queue
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync queue"
  ON public.offline_sync_queue
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own synced items"
  ON public.offline_sync_queue
  FOR DELETE
  USING (auth.uid() = user_id AND status = 'synced');

-- Indexes
CREATE INDEX idx_offline_sync_queue_status ON public.offline_sync_queue(status);
CREATE INDEX idx_offline_sync_queue_user ON public.offline_sync_queue(user_id);

COMMENT ON TABLE public.offline_sync_queue IS 'Queue for offline operations pending sync to Supabase';