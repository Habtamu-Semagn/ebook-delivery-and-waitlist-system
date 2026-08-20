# Vercel Frontend Deployment Guide

Complete guide for deploying the E-book System frontend to Vercel.

## Overview

This guide covers deploying the TanStack Start React application to Vercel with automatic deployments from GitHub.

**Your Setup:**
- Frontend: TanStack Start (React SSR)
- Backend: Render.com (already deployed)
- Repository: GitHub (connected to both services)

---

## Prerequisites

- GitHub account with your repository
- Vercel account (free tier is fine)
- Backend API already deployed on Render
- Firebase project configured

---

## Step 1: Prepare Your Repository

### 1.1 Create Vercel Configuration

Create `vercel.json` in the root of your project:

```json
{
  "buildCommand": "cd apps/web && pnpm run build",
  "outputDirectory": "apps/web/dist/client",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": null,
  "regions": ["iad1"]
}
```

### 1.2 Verify Build Configuration

Your `apps/web/package.json` should have:
```json
{
  "scripts": {
    "build": "vite build && cp instrument.server.mjs dist/server",
    "start": "node --import ./dist/server/instrument.server.mjs dist/server/server.js"
  }
}
```

✅ Already configured correctly!

---

## Step 2: Connect Repository to Vercel

### 2.1 Sign Up / Login to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" or "Login"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub

### 2.2 Import Your Project

1. Click "Add New" → "Project"
2. Select your repository: `Habtamu-Semagn/ebook-delivery-and-waitlist-system`
3. Vercel will detect it as a monorepo

### 2.3 Configure Build Settings

**Framework Preset:** Other (or Custom)

**Root Directory:** `apps/web`

**Build Command:**
```bash
cd ../.. && pnpm install --frozen-lockfile && cd apps/web && pnpm run build
```

**Output Directory:** `dist/client`

**Install Command:**
```bash
pnpm install --frozen-lockfile
```

---

## Step 3: Configure Environment Variables

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

### Required Environment Variables

```env
# API Configuration
VITE_API_URL=https://your-api-name.onrender.com

# Firebase Client Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Supabase Configuration
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe Public Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Sentry (Optional)
SENTRY_AUTH_TOKEN=your-sentry-token
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### How to Add Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. For each variable:
   - Enter the **Key** (e.g., `VITE_API_URL`)
   - Enter the **Value**
   - Select environments: **Production**, **Preview**, **Development**
   - Click **Save**

**IMPORTANT:** All `VITE_*` variables are build-time variables and will be embedded in your client-side code.

---

## Step 4: Deploy

### 4.1 First Deployment

1. Click **Deploy** in the Vercel import wizard
2. Vercel will:
   - Install dependencies
   - Build your app
   - Deploy to a production URL

### 4.2 Monitor Deployment

- Watch the build logs in real-time
- Check for any errors
- Wait for "✓ Deployment ready"

### 4.3 Get Your URL

After deployment:
- Production URL: `https://your-project-name.vercel.app`
- You can add a custom domain later

---

## Step 5: Configure Automatic Deployments

### 5.1 Enable Auto-Deploy

Vercel automatically enables this, but verify:

1. Go to **Settings** → **Git**
2. **Production Branch:** `main`
3. **Deploy Hooks:** Enabled

### 5.2 Deployment Workflow

```
Developer pushes to GitHub
         ↓
Vercel detects push
         ↓
Runs build command
         ↓
Deploys to production
         ↓
    [Live] 🎉
```

### Preview Deployments

- Every PR gets a unique preview URL
- Test changes before merging
- Share with team for review

---

## Step 6: Update API CORS Settings

Update your backend API to allow requests from your Vercel domain.

### On Render (Backend API)

Add environment variable:
```env
FRONTEND_URL=https://your-project-name.vercel.app
```

Your backend `main.ts` already handles CORS:
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
```

---

## Step 7: Custom Domain (Optional)

### Add Custom Domain

1. Go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `myebook.com`)
4. Follow DNS configuration instructions

### DNS Configuration

Add these records to your domain provider:

**For root domain:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## Step 8: Testing Your Deployment

### 8.1 Smoke Tests

Visit your deployed site and test:
- [ ] Homepage loads
- [ ] Firebase authentication works
- [ ] API calls to backend succeed
- [ ] Book browsing works
- [ ] Stripe checkout works
- [ ] Admin panel accessible

### 8.2 Check Browser Console

Open DevTools → Console:
- No CORS errors
- No 404s for API calls
- Firebase initialized correctly

### 8.3 Test API Connection

```bash
curl https://your-project-name.vercel.app/health
```

Should return 200 OK.

---

## Troubleshooting

### Build Fails with "Module not found"

**Solution:** Check that all dependencies are in `package.json`
```bash
cd apps/web
pnpm install
```

### Environment Variables Not Working

**Solution:** 
- Variables must start with `VITE_` to be accessible client-side
- Redeploy after adding variables
- Check **Settings** → **Environment Variables**

### CORS Errors

**Solution:**
```bash
# On Render API, verify:
FRONTEND_URL=https://your-project-name.vercel.app
```

Then redeploy the backend.

### Build Succeeds But Site Shows 404

**Solution:** Check output directory
- Should be: `apps/web/dist/client`
- Verify in **Settings** → **General**

### API Calls Fail (Network Error)

**Causes:**
1. Wrong `VITE_API_URL` (missing https://)
2. API not deployed/running
3. CORS not configured

**Check:**
```bash
# Test API directly
curl https://your-api-name.onrender.com/health
```

---

## Monorepo Considerations

### Workspace Dependencies

Your app uses:
```json
"@ebook/shared-types": "workspace:*"
```

**Vercel handles this automatically** when using pnpm.

### Turborepo (If Configured)

If using Turborepo, add to `vercel.json`:
```json
{
  "buildCommand": "pnpm turbo build --filter=web"
}
```

---

## CI/CD Integration

### GitHub Actions + Vercel

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to Vercel

on:
  push:
    branches: [main]
    paths:
      - 'apps/web/**'
      - 'packages/shared-types/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Trigger Vercel Deployment
        run: |
          curl -X POST "${{ secrets.VERCEL_DEPLOY_HOOK }}"
```

**Setup:**
1. Get deploy hook from Vercel: **Settings** → **Git** → **Deploy Hooks**
2. Add to GitHub Secrets as `VERCEL_DEPLOY_HOOK`

---

## Performance Optimization

### Enable Vercel Analytics

1. Go to **Analytics** tab
2. Click **Enable Analytics**
3. Monitor Core Web Vitals

### Enable Vercel Speed Insights

```bash
cd apps/web
pnpm add @vercel/speed-insights
```

```tsx
// apps/web/src/client.tsx
import { SpeedInsights } from '@vercel/speed-insights/react'

// Add to your root component
<SpeedInsights />
```

### Edge Functions (Optional)

Convert API routes to edge functions for better performance:
```typescript
export const config = {
  runtime: 'edge',
}
```

---

## Security Best Practices

### 1. Environment Variables

- ✅ Never commit `.env` files
- ✅ Use Vercel's encrypted environment variables
- ✅ Rotate keys regularly

### 2. API Keys

- ✅ Use `VITE_` prefix only for public keys
- ✅ Keep private keys on backend only
- ❌ Never expose API secrets in frontend

### 3. Content Security Policy

Add headers in `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

---

## Cost Estimation

### Vercel Pricing

**Free Tier (Hobby):**
- 100 GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS
- Preview deployments
- Perfect for personal projects

**Pro Tier ($20/month):**
- 1 TB bandwidth
- Advanced analytics
- Team collaboration
- Password protection
- Better for production apps

---

## Quick Commands

### Local Development
```bash
cd apps/web
pnpm dev
```

### Build Locally
```bash
cd apps/web
pnpm build
```

### Preview Production Build
```bash
cd apps/web
pnpm preview
```

### Deploy from CLI (Optional)
```bash
pnpm add -g vercel
vercel --prod
```

---

## Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Backend CORS allows Vercel domain
- [ ] Custom domain configured (optional)
- [ ] Firebase authentication tested
- [ ] Stripe payments tested
- [ ] Analytics enabled
- [ ] Error monitoring setup (Sentry)
- [ ] Performance tested
- [ ] Mobile responsiveness checked
- [ ] SEO meta tags configured

---

## Support Resources

- **Vercel Documentation:** https://vercel.com/docs
- **TanStack Start Docs:** https://tanstack.com/start
- **Deployment Issues:** https://github.com/vercel/vercel/discussions

---

**Last Updated:** January 2026
**Status:** Production Ready ✓
