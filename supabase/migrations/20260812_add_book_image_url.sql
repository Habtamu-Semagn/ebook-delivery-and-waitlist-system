-- Add image_url column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN books.image_url IS 'Path to book cover image in storage';
