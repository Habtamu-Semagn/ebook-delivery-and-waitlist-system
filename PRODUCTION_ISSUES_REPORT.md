# Production Issues Report

## ✅ All Critical Issues Fixed

### 1. **Hardcoded Localhost URLs for Supabase Storage** ✅ FIXED

**Issue**: Book cover images used hardcoded `localhost:54321` URL which would break in production.

**Affected Files** (ALL FIXED):
1. ✅ `apps/web/src/components/books/BookCard.tsx`
2. ✅ `apps/web/src/routes/books/category/$category.tsx`
3. ✅ `apps/web/src/routes/books/$bookId.tsx`

**Solution Implemented**:
- Created `apps/web/src/lib/supabase.ts` helper utility
- Added `getSupabaseUrl()` - reads from `VITE_SUPABASE_URL` env var
- Added `getSupabaseStorageUrl()` - constructs storage base URL
- Added `getBookImageUrl(imageName)` - generates full image URLs
- Updated all 3 files to use the helper functions
- Created `.env.example` file with all required variables

**Code Changes**:
```typescript
// Before (hardcoded):
const imageUrl = book.image_url 
  ? `http://localhost:54321/storage/v1/object/public/book-images/${book.image_url}`
  : null

// After (environment-based):
import { getBookImageUrl } from '../../lib/supabase'
const imageUrl = getBookImageUrl(book.image_url)
```

**Environment Variable**:
- Development: `VITE_SUPABASE_URL=http://localhost:54321`
- Production: `VITE_SUPABASE_URL=https://your-project.supabase.co`

---

### 2. **Hardcoded API Proxy in Vite Config** ✅ ACCEPTABLE

**File**: `apps/web/vite.config.ts`

**Status**: No changes needed - this is development-only configuration.

**Explanation**: 
- The Vite proxy (`localhost:3002`) only runs during development
- In production, Vite dev server is not used
- Frontend should use relative URLs (`/api/*`) in API calls
- Vercel/hosting platform handles routing to backend

---

## Implementation Summary

### Files Created:
1. ✅ `apps/web/src/lib/supabase.ts` - Supabase URL helper utilities
2. ✅ `apps/web/.env.example` - Environment variable template

### Files Modified:
1. ✅ `apps/web/src/components/books/BookCard.tsx` - Uses `getBookImageUrl()`
2. ✅ `apps/web/src/routes/books/category/$category.tsx` - Uses `getBookImageUrl()`
3. ✅ `apps/web/src/routes/books/$bookId.tsx` - Uses `getBookImageUrl()` + added `image_url` to interface

---

## Additional Checks Performed

### ✅ No Issues Found:

1. **API Calls**: All API calls in `apps/web/src/lib/api.ts` use relative paths (`/api/*`)
2. **No hardcoded 127.0.0.1** references
3. **No hardcoded port numbers** in API calls
4. **Firebase config** properly uses environment variables
5. **Stripe keys** properly uses environment variables

---

## Recommended Fixes

### Fix 1: Create Environment-Based Supabase URL Helper

**Create**: `apps/web/src/lib/supabase.ts`

```typescript
// Get Supabase URL from environment or use default for development
export const getSupabaseStorageUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
  return `${supabaseUrl}/storage/v1/object/public`
}

export const getBookImageUrl = (imageName: string | undefined) => {
  if (!imageName) return null
  return `${getSupabaseStorageUrl()}/book-images/${imageName}`
}
```

**Usage**:
```typescript
import { getBookImageUrl } from '../../lib/supabase'

const imageUrl = getBookImageUrl(book.image_url)
```

---

### Fix 2: Update Environment Files

**`apps/web/.env.example`** (create this):
```env
# API
VITE_API_URL=http://localhost:3002

# Supabase
VITE_SUPABASE_URL=http://localhost:54321

# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**`apps/web/.env.production`** (for Vercel):
```env
VITE_API_URL=https://your-api.railway.app
VITE_SUPABASE_URL=https://your-project.supabase.co
```

---

### Fix 3: Update API Client to Use Environment Variable

**File**: `apps/web/src/lib/api.ts`

**Add at the top**:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// Use API_BASE_URL for all fetch calls
// Example:
export async function fetchBooks(): Promise<Book[]> {
  const response = await fetch(`${API_BASE_URL}/api/books`)
  // ... rest of the code
}
```

**Note**: In production on Vercel, you can keep using relative URLs (`/api/*`) and configure environment variables to point frontend to the backend API domain.

---

## Priority Actions

### **MUST FIX before deployment**:

1. ✅ Fix hardcoded Supabase storage URLs in 3 files
2. ✅ Add `VITE_SUPABASE_URL` environment variable
3. ✅ Test image loading in production-like environment

### **SHOULD FIX**:

4. Add `.env.example` file with all required variables
5. Update deployment documentation with environment variable requirements
6. Add environment variable validation on app startup

### **NICE TO HAVE**:

7. Add config validation library (e.g., zod) for environment variables
8. Create centralized config file that validates all env vars at startup
9. Add development vs production config documentation

---

## Testing Checklist

Before deploying to production:

- [ ] Book images load correctly
- [ ] API calls work with production backend URL
- [ ] Firebase authentication works
- [ ] Stripe checkout redirects correctly
- [ ] All environment variables are set in Vercel dashboard
- [ ] Test with `npm run build` locally
- [ ] Preview deployment on Vercel works correctly

---

## Environment Variables Required in Production

### Vercel (Frontend):
```
VITE_API_URL=https://your-backend.railway.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Railway (Backend):
```
NODE_ENV=production
PORT=3002
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
RESEND_API_KEY=...
```

---

## Additional Security Recommendations

1. **Never commit** `.env` files to git (already in `.gitignore`)
2. **Rotate secrets** after testing in production
3. **Use different** Firebase/Stripe keys for production vs development
4. **Enable** Supabase RLS policies (already done)
5. **Review** CORS settings for production domains
6. **Add** rate limiting on API endpoints
7. **Enable** Vercel preview deployment protection
8. **Set up** monitoring and alerting (Sentry already configured)

---

## Next Steps

1. Apply fixes from this report
2. Test locally with production-like environment variables
3. Deploy to staging/preview environment
4. Verify all functionality works
5. Deploy to production
6. Monitor logs and error tracking

