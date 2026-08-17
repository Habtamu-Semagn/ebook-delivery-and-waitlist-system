# Free Deployment Guide for Ebook System

This guide covers deploying your monorepo ebook system completely free using modern cloud platforms.

## Architecture Overview

Your project has 3 main components:
1. **Frontend (Web)** - TanStack Router + React app
2. **Backend (API)** - NestJS application
3. **Database** - Supabase (PostgreSQL + Storage)

## Free Deployment Strategy

### Option 1: Recommended Free Tier Setup

#### Components:
- **Frontend**: Vercel (Free tier)
- **Backend**: Railway.app or Render.com (Free tier)
- **Database**: Supabase (Free tier - included)
- **Email**: Resend (Free tier - 100 emails/day)
- **File Storage**: Supabase Storage (Free tier - 1GB)
- **Auth**: Firebase (Free Spark plan)

---

## Step-by-Step Deployment

### 1. Supabase Setup (Database & Storage)

**Already done locally, now move to cloud:**

1. **Create Supabase Project**
   ```bash
   # Go to https://supabase.com
   # Create new project (free tier)
   # Note down:
   - Project URL
   - anon/public key
   - service_role key
   ```

2. **Run Migrations**
   ```bash
   # Link to remote project
   npx supabase link --project-ref your-project-ref
   
   # Push migrations
   npx supabase db push
   ```

3. **Configure Storage Buckets**
   - `ebooks` bucket (for PDF files)
   - `book-images` bucket (for cover images)
   - Set appropriate RLS policies (already in migrations)

---

### 2. Firebase Setup (Authentication)

**Free Spark Plan:**

1. **Go to** [Firebase Console](https://console.firebase.google.com)
2. **Create project** (or use existing)
3. **Enable Authentication**:
   - Email/Password
   - Google Sign-In (optional)
4. **Generate service account**:
   - Project Settings → Service Accounts
   - Generate new private key
   - Store securely (for backend)
5. **Get Web Config**:
   - Project Settings → General → Your apps
   - Copy Firebase config (for frontend)

---

### 3. Backend Deployment (Railway.app - Free Tier)

**Railway Free Tier**: $5 credit/month, ~500 hours

#### Steps:

1. **Prepare Backend for Deployment**

   Create `apps/api/Procfile`:
   ```
   web: npm run start:prod
   ```

   Update `apps/api/package.json`:
   ```json
   {
     "scripts": {
       "start:prod": "node dist/main.js",
       "build": "nest build"
     }
   }
   ```

2. **Deploy to Railway**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Initialize in api directory
   cd apps/api
   railway init
   
   # Deploy
   railway up
   ```

3. **Set Environment Variables** in Railway Dashboard:
   ```env
   NODE_ENV=production
   PORT=3002
   
   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Firebase
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY=your-private-key
   FIREBASE_CLIENT_EMAIL=your-client-email
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # Resend
   RESEND_API_KEY=re_...
   
   # Redis (optional - Railway addon)
   REDIS_HOST=your-redis-host
   REDIS_PORT=6379
   ```

4. **Add Redis** (optional, for job queue):
   - Add Redis plugin in Railway dashboard
   - Automatically sets REDIS_URL

5. **Note your backend URL**: `https://your-app.railway.app`

---

### Alternative: Render.com (Backend)

**Render Free Tier**: 750 hours/month, auto-sleep after 15 min inactivity

1. **Connect GitHub repo**
2. **Create Web Service**:
   - Root Directory: `apps/api`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
3. **Add Environment Variables** (same as Railway)

---

### 4. Frontend Deployment (Vercel - Free Tier)

**Vercel Free Tier**: Unlimited bandwidth, 100GB/month

#### Steps:

1. **Prepare Frontend**

   Create `apps/web/.env.production`:
   ```env
   VITE_API_URL=https://your-backend.railway.app
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123:web:abc
   ```

2. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

3. **Deploy**:
   ```bash
   # From root directory
   cd apps/web
   vercel
   
   # Follow prompts:
   # - Link to existing project or create new
   # - Set root directory: apps/web
   # - Override settings: No
   ```

4. **Configure Build Settings** in Vercel Dashboard:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Add Environment Variables** in Vercel Dashboard:
   - Copy all from `.env.production`

6. **Deploy**: `vercel --prod`

---

### Alternative: Netlify (Frontend)

**Free Tier**: 100GB bandwidth/month

1. **Create** `apps/web/netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy**:
   ```bash
   npm install -g netlify-cli
   cd apps/web
   netlify deploy --prod
   ```

---

## 5. Stripe Webhook Configuration

1. **Go to** [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. **Add endpoint**: `https://your-backend.railway.app/webhooks/stripe`
3. **Select events**:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `charge.refunded`
4. **Copy webhook secret** → Add to backend env vars

---

## 6. Domain Configuration (Optional - Free)

### Using Custom Domain:

**Vercel (Frontend)**:
1. Buy domain from Namecheap/Porkbun (~$1-5/year)
2. Add domain in Vercel dashboard
3. Update DNS records

**Railway (Backend)**:
1. Add custom domain in Railway dashboard
2. Update DNS CNAME record

---

## Cost Breakdown (Monthly)

| Service | Free Tier Limits | Cost |
|---------|-----------------|------|
| Supabase | 500MB DB, 1GB storage, 2GB bandwidth | $0 |
| Railway | $5 credit (~500 hours) | $0* |
| Vercel | Unlimited bandwidth | $0 |
| Firebase Auth | 50k MAU | $0 |
| Resend | 100 emails/day | $0 |
| Stripe | Pay per transaction | $0** |
| **Total** | | **$0/month** |

\* Railway may charge after $5 credit exhausted (usually sufficient for low traffic)
\** Stripe takes 2.9% + $0.30 per transaction

---

## Monorepo Deployment Considerations

### Problem: Monorepos require building the entire repo

### Solution 1: Use Turborepo (Already configured)

**Build only what changed:**
```bash
# In root package.json
"scripts": {
  "build:api": "turbo run build --filter=api",
  "build:web": "turbo run build --filter=web"
}
```

### Solution 2: Separate Git Repos (Optional)

Use git subtree to split monorepo:
```bash
# Create separate repo for API
git subtree push --prefix apps/api origin api-deploy

# Create separate repo for Web
git subtree push --prefix apps/web origin web-deploy
```

---

## Environment Variables Checklist

### Backend (.env):
```env
NODE_ENV=production
PORT=3002
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
REDIS_HOST=
REDIS_PORT=
```

### Frontend (.env.production):
```env
VITE_API_URL=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## Deployment Commands Summary

```bash
# 1. Push to GitHub
git push origin main

# 2. Deploy Backend (Railway)
cd apps/api
railway up

# 3. Deploy Frontend (Vercel)
cd apps/web
vercel --prod

# 4. Run Supabase migrations
npx supabase db push
```

---

## Monitoring & Logs

### Backend Logs:
- Railway: Dashboard → Deployments → Logs
- Render: Dashboard → Logs tab

### Frontend Logs:
- Vercel: Dashboard → Deployments → Function Logs

### Database:
- Supabase: Dashboard → Logs → Database

---

## Scaling Beyond Free Tier

When you outgrow free tiers:

1. **Railway** ($5/month) → AWS Elastic Beanstalk ($10-20/month)
2. **Vercel** (stays free for most cases)
3. **Supabase** ($25/month for Pro tier)
4. **Resend** ($20/month for 50k emails)

---

## Troubleshooting

### Backend won't start:
- Check environment variables
- Verify Firebase credentials format
- Check Railway/Render logs

### Frontend can't connect to API:
- Verify VITE_API_URL is correct
- Check CORS settings in backend
- Verify API is running

### Database connection issues:
- Verify SUPABASE_URL and keys
- Check Supabase project status
- Review RLS policies

### Stripe webhooks not working:
- Verify webhook secret
- Check endpoint URL is accessible
- Review Stripe dashboard event logs

---

## Security Checklist

- [ ] All secrets in environment variables (not in code)
- [ ] Firebase service account secured
- [ ] Supabase service role key secured
- [ ] Stripe webhook secret configured
- [ ] CORS properly configured
- [ ] RLS policies enabled on Supabase
- [ ] Rate limiting enabled
- [ ] HTTPS enforced

---

## Next Steps

1. Set up monitoring (Sentry free tier)
2. Configure CI/CD with GitHub Actions
3. Add backup strategy for database
4. Set up staging environment
5. Configure custom domain

---

## Additional Free Services

### Monitoring:
- **Sentry** (Free: 5k errors/month) - Error tracking
- **LogTail** (Free: 1GB logs/month) - Log management
- **UptimeRobot** (Free: 50 monitors) - Uptime monitoring

### CI/CD:
- **GitHub Actions** (Free: 2000 minutes/month)

### Analytics:
- **Plausible** (Self-hosted, free)
- **Umami** (Self-hosted, free)

---

## Support & Resources

- Supabase: https://supabase.com/docs
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- Firebase: https://firebase.google.com/docs
