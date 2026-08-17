# Apply Categories Migration

## Problem
The `category` column doesn't exist in the `books` table yet, causing API errors when trying to fetch books by category.

## Solution
Apply the migration file: `supabase/migrations/20260810_add_categories.sql`

## Steps

### Via Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard: https://supabase.com/dashboard
2. Go to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the SQL from `supabase/migrations/20260810_add_categories.sql`
5. Paste it into the editor
6. Click **Run** or press `Ctrl+Enter`

### Via Supabase CLI (if local)

```bash
cd ebook-system
npx supabase db push
```

## What the Migration Does

1. Creates a `categories` table with:
   - 9 predefined categories (programming, ai, business, finance, self-development, design, education, fiction, other)
   - Slug-based identification

2. Adds `category` column to `books` table
   - VARCHAR(255) type
   - Foreign key reference to categories.slug
   - Optional (can be NULL)

3. Creates database index on `books.category` for faster queries

4. Sets up RLS policies for public read access to categories

## After Migration

Once applied:
- Accessing `/books/programming` will work (returns empty array if no books)
- Accessing `/books/ai` will work (returns empty array if no books)
- All 9 category routes will function properly
- The frontend will show "No books uploaded yet in {category}" message instead of errors

## Verify Migration

After applying, verify with:

```sql
-- Check if category column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'books' AND column_name = 'category';

-- Check categories table
SELECT * FROM categories;

-- Check books with categories (will be empty if no books have categories yet)
SELECT id, title, category FROM books WHERE category IS NOT NULL;
```

## Next Steps

After migration:
1. Test category routes: http://localhost:3000/books/programming
2. You should see "No books uploaded yet in Programming" message (empty state)
3. To add books to categories, update existing books:
   ```sql
   UPDATE books SET category = 'programming' WHERE title LIKE '%JavaScript%';
   UPDATE books SET category = 'ai' WHERE title LIKE '%AI%' OR title LIKE '%Machine Learning%';
   ```
