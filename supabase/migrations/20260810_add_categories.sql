-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add category column to books table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'books' AND column_name = 'category'
  ) THEN
    ALTER TABLE books ADD COLUMN category VARCHAR(255);
  END IF;
END $$;

-- Add foreign key constraint for category (optional, for referential integrity)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'books' AND constraint_name = 'books_category_fk'
  ) THEN
    ALTER TABLE books 
    ADD CONSTRAINT books_category_fk 
    FOREIGN KEY (category) REFERENCES categories(slug) ON DELETE SET NULL;
  END IF;
END $$;

-- Insert default categories
INSERT INTO categories (slug, name, description) VALUES
  ('programming', 'Programming', 'Learn programming languages, frameworks, and best practices'),
  ('ai', 'Artificial Intelligence', 'Explore AI, machine learning, and deep learning concepts'),
  ('business', 'Business', 'Business strategy, entrepreneurship, and management'),
  ('finance', 'Finance', 'Personal finance, investing, and financial planning'),
  ('self-development', 'Self Development', 'Personal growth, productivity, and self-improvement'),
  ('design', 'Design', 'UI/UX design, graphic design, and creative thinking'),
  ('education', 'Education', 'Learning techniques, educational resources, and courses'),
  ('fiction', 'Fiction', 'Novels, short stories, and creative fiction'),
  ('other', 'Other', 'Books that don''t fit into other categories')
ON CONFLICT (slug) DO NOTHING;

-- Create index on category for faster queries
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);

-- Add RLS policy for categories table (read-only for public)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON categories
  FOR SELECT USING (true);
