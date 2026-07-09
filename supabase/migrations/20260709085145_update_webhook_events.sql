-- 1. Add missing tracking columns to your existing table
ALTER TABLE webhook_events 
ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Optional: Add an index on event_id and status for faster queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);