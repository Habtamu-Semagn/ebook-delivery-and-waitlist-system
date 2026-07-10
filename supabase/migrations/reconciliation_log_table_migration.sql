-- Migration: Create reconciliation_logs table
CREATE TABLE IF NOT EXISTS reconciliation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id TEXT NOT NULL,
    evaluated_count INT DEFAULT 0,
    auto_fulfilled_count INT DEFAULT 0,
    marked_failed_count INT DEFAULT 0,
    error_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: Add index for performance on purchases lookup
CREATE INDEX IF NOT EXISTS idx_purchases_pending_created_at 
ON purchases (status, created_at) 
WHERE status = 'pending';