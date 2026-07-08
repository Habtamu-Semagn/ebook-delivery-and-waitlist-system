# E-book Delivery & Waitlist System - Software Architecture

## Project Overview

A full-stack web application for selling and delivering e-books with a waitlist system, built using a modern monorepo architecture with TypeScript, React, and NestJS.

## 1. Tech Stack

### Frontend
- **Framework**: React 19 with TanStack Start (SSR meta-framework)
- **Router**: TanStack Router (file-based routing)
- **Styling**: TailwindCSS 4 + custom components
- **Build Tool**: Vite with TypeScript
- **State Management**: React hooks + Context API
- **Testing**: Vitest
- **Authentication**: Firebase Client SDK

### Backend
- **Framework**: NestJS with Express adapter
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **Job Queue**: BullMQ with Redis
- **Authentication**: Firebase Admin SDK
- **Payment**: Stripe
- **Email**: Resend
- **Storage**: Supabase Storage (for e-book PDFs)
- **API Docs**: Swagger/OpenAPI

### Infrastructure
- **Monorepo Tool**: Turborepo
- **Package Manager**: pnpm 9.0.0
- **Database Migrations**: Supabase CLI
- **Environment**: Node.js >= 18

## 2. Project Structure

```
ebook-system/
├── apps/
│   ├── api/                    # NestJS backend (port 3002)
│   │   ├── src/
│   │   │   ├── main.ts         # Application entry point
│   │   │   ├── app.module.ts   # Root NestJS module
│   │   │   ├── books/          # Book catalog
│   │   │   ├── orders/         # Order processing (Stripe)
│   │   │   ├── purchases/      # Purchase management
│   │   │   ├── users/          # User management
│   │   │   ├── waitlist/       # Waitlist functionality
│   │   │   ├── email/          # Email service (Resend)
│   │   │   ├── webhooks/       # Stripe webhooks + BullMQ processor
│   │   │   ├── firebase/       # Firebase auth service
│   │   │   └── guards/         # Auth guards
│   │   ├── package.json
│   │   ├── .env                # API environment (Firebase, Stripe, Resend)
│   │   └── nest-cli.json
│   │
│   └── web/                    # React frontend (port 3000)
│       ├── src/
│       │   ├── routes/         # TanStack Router pages
│       │   │   ├── index.tsx   # Landing page
│       │   │   ├── login.tsx   # Firebase auth
│       │   │   ├── books/
│       │   │   │   └── $bookId.tsx  # Book detail + checkout
│       │   │   ├── purchases.tsx    # User's books
│       │   │   └── success.tsx      # Order confirmation
│       │   ├── components/
│       │   │   ├── books/     # BookCard, BooksGrid, filters
│       │   │   ├── sections/  # Hero, FeaturedBooks, Testimonials
│       │   │   ├── layout/    # Navbar, Footer
│       │   │   └── ui/        # Button, Badge
│       │   ├── hooks/         # useAuth, useBooks
│       │   ├── lib/           # API client, Firebase, Stripe, types
│       │   └── styles.css     # Global styles
│       ├── package.json
│       ├── .env               # Firebase + Supabase client config
│       ├── vite.config.ts     # Vite + TanStack Router plugin
│       └── tsr.config.json    # TanStack Router configuration
│
├── packages/
│   ├── shared-types/          # Shared TypeScript interfaces
│   ├── eslint-config/         # ESLint presets
│   └── typescript-config/     # TypeScript presets
│
├── supabase/
│   ├── config.toml            # Supabase local dev config
│   ├── migrations/            # Database schema + RLS policies
│   │   ├── 20260628125756_rls_policies.sql
│   │   └── 20260703112624_storage_rls_policy.sql
│   └── seed.sql               # (Optional) initial data
│
├── package.json               # Monorepo root
├── pnpm-workspace.yaml        # Workspace definition
├── turbo.json                 # Turbo build config
├── .npmrc                      # npm registry config
├── .prettierrc                 # Code formatting
├── eslintrc.js                # Root ESLint
└── .env                       # Supabase local config
```

## 3. Data Model

### Database Schema (Supabase PostgreSQL)

**users** table:
- `id` (UUID, PK) - Supabase auto-generated
- `firebase_uid` (STRING, UNIQUE) - Firebase UID for sync
- `email` (STRING, UNIQUE) - User email
- `created_at` (TIMESTAMP) - Account creation

**books** table:
- `id` (UUID, PK)
- `title` (STRING)
- `author` (STRING)
- `description` (TEXT)
- `category` (STRING)
- `price` (INTEGER) - In cents (multiply by 100 for Stripe)
- `file_url` (STRING) - Path in Supabase Storage
- `rating` (FLOAT)
- `is_active` (BOOLEAN) - Public catalog control
- `created_at` (TIMESTAMP)

**purchases** table:
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `book_id` (UUID, FK → books)
- `status` (ENUM: pending/completed/failed)
- `payment_order_id` (STRING) - Stripe session ID
- `created_at` (TIMESTAMP)
- **Unique Constraint**: (user_id, book_id) prevents duplicate purchases

**waitlist** table:
- `id` (UUID, PK)
- `email` (STRING, UNIQUE) - Duplicate prevention at DB level
- `position` (INTEGER) - Queue position
- `created_at` (TIMESTAMP)

**webhook_events** table (idempotency):
- `id` (UUID, PK)
- `event_id` (STRING, UNIQUE) - Stripe event ID
- `event_type` (STRING) - checkout.session.completed, etc.
- `payload` (JSONB) - Full Stripe event
- `status` (ENUM: pending/processed/failed)
- `created_at` (TIMESTAMP)

**supabase_storage.objects**:
- Private bucket `ebooks/` for PDF files
- RLS: Only owner (via auth.uid) can access signed URLs

## 4. Authentication Flow

### Firebase Integration
1. **Frontend**: User logs in via Firebase SDK (Email/Password or Google OAuth)
2. **Firebase**: Returns ID token (JWT) valid for 1 hour
3. **Frontend**: Stores token in localStorage or session
4. **Backend**: Validates token on protected routes using `FirebaseAuthGuard`
5. **Sync**: First login triggers user row creation in Supabase (firebase_uid → users.firebase_uid)

### Row-Level Security (RLS)

| Table | Policy | Role | Access |
|-------|--------|------|--------|
| books | books_select_active | anon/authenticated | SELECT (is_active=true) |
| waitlist | waitlist_insert_anyone | anon/authenticated | INSERT any email |
| users | (none) | service_role only | All operations via NestJS |
| purchases | (none) | service_role only | All operations via NestJS |
| webhook_events | (none) | service_role only | Webhook processor only |
| ebooks (storage) | Custom RLS | authenticated | Download own purchases |

## 5. Payment Flow (Stripe)

### Complete Workflow

```
1. User clicks "Buy Now"
   └─> Frontend: handleBuy() → createOrder(bookId, token)

2. Backend: POST /orders (FirebaseAuthGuard validates token)
   ├─> Get user from Supabase (via firebase_uid)
   ├─> Get book from Supabase
   ├─> Create Stripe checkout session with metadata
   ├─> Save purchase record with status='pending'
   ├─> [DEV MODE] Auto-complete + send email immediately
   └─> Return { sessionId, sessionUrl }

3. Frontend: Redirect to Stripe checkout page
   └─> User fills card details, clicks Pay

4. Stripe processes payment
   └─> Payment succeeds or fails

5A. PRODUCTION: Stripe sends webhook to POST /webhooks/stripe
    ├─> WebhooksController receives request
    ├─> Verifies Stripe signature (HMAC-SHA256)
    ├─> Delegates to WebhooksService (BullMQ job queue)
    └─> Returns 200 immediately (don't block)

5B. BACKGROUND: BullMQ WebhooksProcessor handles async
    ├─> Check if event already processed (idempotency)
    ├─> Update purchase status='completed'
    ├─> Generate signed download URL (24h expiry)
    ├─> Send confirmation email with download link
    └─> Update webhook_events status='processed'

6. Frontend: Redirects to /success?session_id=...
   └─> Fetches /purchases (shows newly completed purchase)

7. User receives email with download link
   └─> Clicks link → signed URL grants file access
```

### Dev Mode (NODE_ENV=development)
- Auto-completes after creating Stripe session
- Skips real webhook (no ngrok needed)
- Email sent immediately in orders.service.ts

### Production Mode (NODE_ENV=production)
- Waits for actual Stripe webhook
- Requires: ngrok tunnel OR public deployment + Stripe webhook endpoint configured

## 6. Email Service

**Provider**: Resend  
**Sender**: onboarding@resend.dev (test account)

### Email Templates

**Purchase Confirmation** (`sendPurchaseConfirmation`)
- To: user email
- Subject: "Your purchase of {bookTitle} is confirmed!"
- Contains: Download button + link + expiry notice (24h)
- Sent by: WebhooksProcessor after payment succeeds

**Waitlist Confirmation** (`sendWaitlistConfirmation`)
- To: user email
- Subject: "You're on the waitlist!"
- Contains: Confirmation message
- Sent by: WaitlistService after signup

## 7. API Endpoints

### Books
- `GET /books` - List active books (paginated)
- `GET /books/:id` - Get book details + ratings

### Orders (Protected)
- `POST /orders` - Create Stripe checkout session
  - Body: `{ bookId: string }`
  - Returns: `{ sessionId, sessionUrl }`
  - Guard: FirebaseAuthGuard

### Purchases (Protected)
- `GET /purchases` - List user's completed purchases
  - Returns array with book details, download URLs
  - Guard: FirebaseAuthGuard

### Waitlist
- `POST /waitlist` - Add email to waitlist
  - Body: `{ email: string }`
  - Returns: Position or "already_on_waitlist"

### Webhooks
- `POST /webhooks/stripe` - Receives Stripe events
  - Verifies signature, queues job, returns 200 immediately

### Swagger Documentation
- `GET /api/docs` - Interactive API explorer
- All endpoints documented with @Api* decorators

## 8. Module Architecture (Backend)

### FirebaseModule
- Initializes Firebase Admin SDK
- Provides `FirebaseService` for token verification
- Exports `FirebaseAuthGuard` for route protection

### BooksModule
- `BooksService`: Database queries (is_active books)
- `BooksController`: REST endpoints
- No payment logic (read-only catalog)

### OrdersModule
- `OrdersService`: Stripe session creation + auto-complete logic
- `OrdersController`: POST /orders endpoint
- Integrates with: Stripe API, Supabase, Resend (email)

### PurchasesModule
- `PurchasesService`: Fetch user purchases + generate signed URLs
- `PurchasesController`: GET /purchases endpoint
- Integrates with: Supabase storage (signed URL generation)

### WebhooksModule
- `WebhooksController`: Receives Stripe events
- `WebhooksService`: Signature verification + event queueing
- `WebhooksProcessor`: BullMQ worker for async processing
- Integrates with: Stripe webhooks, Supabase, Resend (email)

### EmailModule
- `EmailService`: Resend API wrapper
- Methods: `sendPurchaseConfirmation`, `sendWaitlistConfirmation`
- Used by: OrdersService (dev), WebhooksProcessor, WaitlistService

### WaitlistModule
- `WaitlistService`: Upsert pattern for duplicate prevention
- `WaitlistController`: POST /waitlist endpoint
- RLS: Public INSERT allowed (unauthenticated users can join)

### UsersModule
- `UsersService`: Firebase UID sync on first login
- `UsersController`: GET /users/me endpoint
- Auto-creates user row on first auth

## 9. Frontend Architecture

### Routing (TanStack Router)
- File-based: `/routes/index.tsx` = `/`
- Layouts: `/__root.tsx` wraps all routes
- Dynamic: `/books/$bookId.tsx` = `/books/123`
- Code-splitting: Each route lazy-loaded

### State Management
- **Auth State**: Firebase SDK + `useAuth` hook
- **Book State**: Local useState in components, fetch via API
- **Form State**: React useState (controlled inputs)
- No Redux/Zustand (unnecessary for this app)

### API Client (`lib/api.ts`)
- Centralized fetch wrapper with auth headers
- Methods:
  - `fetchBookById(id)` - GET /books/:id
  - `createOrder(bookId, token)` - POST /orders
  - `fetchPurchases(token)` - GET /purchases
  - `fetchBooks()` - GET /books
  - `joinWaitlist(email)` - POST /waitlist

### Styling
- **Framework**: TailwindCSS v4 (JIT compilation)
- **Colors**: Custom color scheme (dark theme)
  - Background: #020617
  - Cards: #1E293B
  - Accent: #10B981 (green)
- **Components**: Reusable Button, Badge, BookCard, etc.

## 10. Build & Deployment

### Development

```bash
# Start all services
pnpm dev                          # API + web + Supabase local

# Individual
pnpm --filter=api dev             # Backend only (port 3002)
pnpm --filter=web dev             # Frontend only (port 3000)
supabase start                     # Local Supabase (port 54321)
```

### Production Build

```bash
pnpm build                        # Build all apps (uses Turbo cache)
pnpm --filter=api start:prod      # Run API from dist/
pnpm --filter=web preview         # Preview built web app
```

### Deployment Checklist

**Backend (NestJS)**
1. Build: `nest build`
2. Set env vars (Stripe, Firebase, Resend, Supabase keys)
3. Run: `node dist/main`
4. Configure Stripe webhook endpoint in dashboard:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`
   - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

**Frontend (TanStack Start)**
1. Build: `vite build`
2. Deploy dist/server to Node server OR serverless (Vercel, Netlify)
3. Set env: Firebase + Supabase public keys

**Database**
1. Apply migrations to production Supabase project
2. Enable RLS policies
3. Configure Supabase Storage bucket permissions

## 11. Key Features Implemented

### Week 1: Foundation
- ✅ Monorepo setup (Turborepo + pnpm)
- ✅ Supabase + RLS design
- ✅ Firebase auth integration + sync
- ✅ Stripe checkout session creation + signature verification
- ✅ Resend email templates

### Week 2: Business Logic
- ✅ Book catalog with search/filter UI
- ✅ Book detail page with purchase flow
- ✅ Stripe webhook processing (BullMQ queue)
- ✅ Email sending on purchase confirmation
- ✅ Waitlist with duplicate prevention
- ✅ Purchase history page with download links (signed URLs)
- ✅ Swagger API documentation

### Security Features
- ✅ Firebase JWT validation on protected routes
- ✅ Row-Level Security on Supabase tables
- ✅ Stripe HMAC-SHA256 signature verification
- ✅ Idempotency: webhook_events table prevents duplicate processing
- ✅ Signed URLs (24h expiry) for file downloads
- ✅ Unique constraints: purchases(user_id, book_id), waitlist(email)

## 12. Performance Optimizations

- **Code Splitting**: TanStack Router lazy-loads routes
- **Turbo Caching**: Monorepo build caching
- **BullMQ Queue**: Async email/webhook processing (doesn't block checkout)
- **Supabase RLS**: Database-level authorization (no N+1 queries)
- **Signed URLs**: Time-limited downloads (secure, cache-friendly)
- **Build Output**: Server-side rendering (TanStack Start) for SEO

## 13. Error Handling

### Backend
- Custom exceptions with HTTP status codes
- Swagger docs show error responses (400, 401, 404, 500)
- Firebase auth errors → 401 Unauthorized
- Stripe errors → 400 Bad Request
- Database errors → 500 Internal Server Error

### Frontend
- Catch API errors, display to user in error UI
- Redirect to login if token invalid
- Retry checkout on network error

## 14. Testing Strategy

**Unit Tests**: Jest for NestJS modules  
**E2E Tests**: Supertest for API endpoints  
**Frontend Tests**: Vitest for React components  
**Webhook Testing**: Use Stripe CLI for local webhook simulation

## 15. Monitoring & Logging

- NestJS Logger: logs all HTTP requests, errors, webhook processing
- Supabase Dashboard: view database activity, RLS policy violations
- Stripe Dashboard: monitor webhooks, payment events, refunds
- Resend Dashboard: email delivery status, bounce rates

---

**Last Updated**: July 2026  
**Version**: 1.0 (Week 2 Complete)
