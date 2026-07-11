CREATE TABLE download_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL, -- or REFERENCES books(id)
    ip_address VARCHAR(45) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'success', 'rate_limited', etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by the rate limiter
CREATE INDEX idx_download_logs_rate_limit 
ON download_logs (user_id, book_id, created_at DESC);