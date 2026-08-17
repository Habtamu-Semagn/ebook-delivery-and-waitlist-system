-- 1. Add the updated_at column allowing nulls initially or defaulting to NOW()
ALTER TABLE purchases 
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Backfill existing records so they aren't blank (set updated_at to match created_at)
UPDATE purchases 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 3. Create a reusable function that sets updated_at to the current time
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach the trigger to your purchases table
CREATE TRIGGER set_timestamp_purchases
BEFORE UPDATE ON purchases
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();