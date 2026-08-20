# Render CI/CD Setup Guide

## Overview

This guide shows you how to set up automatic deployments to Render using GitHub Actions.

Your workflow:
1. **GitHub Actions** runs tests on every push
2. **Render** builds and deploys from source (has access to all your environment variables including Redis)
3. Render's environment provides the Redis URL automatically

## Step 1: Enable Auto-Deploy on Render

### For Your API Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your **API service**
3. Go to **Settings** → **Build & Deploy**
4. Enable **Auto-Deploy: Yes**
5. Select branch: **main**
6. Save Changes

### For Your Web Service (if separate)

1. Select your **Web service**
2. Go to **Settings** → **Build & Deploy**
3. Enable **Auto-Deploy: Yes**
4. Select branch: **main**
5. Save Changes

## Step 2: Get Deploy Hooks (for Manual Triggers)

### API Deploy Hook

1. In your API service settings
2. Scroll to **Deploy Hook** section
3. Copy the webhook URL (looks like: `https://api.render.com/deploy/srv-xxxxx?key=yyy`)
4. Save this for GitHub secrets

### Web Deploy Hook (Optional)

1. In your Web service settings
2. Scroll to **Deploy Hook** section
3. Copy the webhook URL
4. Save this for GitHub secrets

## Step 3: Configure GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

```
Name: RENDER_DEPLOY_HOOK_API
Value: https://api.render.com/deploy/srv-xxxxx?key=yyy

Name: RENDER_DEPLOY_HOOK_WEB (optional)
Value: https://api.render.com/deploy/srv-zzzzz?key=www
```

## Step 4: How It Works

### Automatic Deployment Flow

```
Developer pushes to main branch
         ↓
GitHub Actions runs:
  ├─ Install dependencies
  ├─ Run lint checks
  └─ Run tests
         ↓
  [Tests Pass] ✓
         ↓
GitHub Actions triggers Render deploy hooks
         ↓
Render receives webhook
         ↓
Render pulls latest code from GitHub
         ↓
Render builds your app with all environment variables
  ├─ Has access to REDIS_HOST from Render Redis addon
  ├─ Has access to all other env vars you configured
  └─ Builds and deploys new version
         ↓
    [Live] 🎉
```

### Key Benefits

✅ **No Docker complexity** - Render builds from source  
✅ **All env vars available** - Redis URL, API keys, everything  
✅ **Automatic rollback** - Easy to revert if needed  
✅ **Zero downtime** - Render handles deployment gracefully  
✅ **Free tier friendly** - No extra services needed

## Step 5: Test It Out

```bash
# Make a small change
echo "# Test deployment" >> README.md

# Commit and push
git add README.md
git commit -m "test: trigger auto-deploy"
git push origin main
```

Watch what happens:
1. **GitHub Actions** tab - See tests running
2. **Render Dashboard** - See deployment starting
3. Your app updates automatically!

## Monitoring Deployments

### GitHub Actions

- Go to: **your-repo** → **Actions** tab
- See test results and deployment triggers

### Render Dashboard

- Go to: **dashboard.render.com**
- Click your service
- View:
  - **Events**: Deployment history
  - **Logs**: Real-time application logs
  - **Metrics**: CPU, memory usage

## Redis Connection

Render automatically provides Redis connection details via environment variables when you add the Redis addon:

```env
# These are automatically set by Render
REDIS_URL=redis://...
REDIS_HOST=...
REDIS_PORT=...
```

Your application code just reads these variables - no manual configuration needed!

## Manual Deployment

### Via GitHub Actions

1. Go to **Actions** tab
2. Select **Deploy to Render** workflow
3. Click **Run workflow**
4. Choose branch and run

### Via Command Line

```bash
# Deploy API
curl -X POST "$RENDER_DEPLOY_HOOK_API"

# Deploy Web
curl -X POST "$RENDER_DEPLOY_HOOK_WEB"
```

### Via npm script

Add to your `package.json`:

```json
{
  "scripts": {
    "deploy": "curl -X POST $RENDER_DEPLOY_HOOK_API"
  }
}
```

Then run:
```bash
npm run deploy
```

## Rollback

If something goes wrong:

1. Go to **Render Dashboard** → Your Service
2. Click **Deploys** tab
3. Find the last working deployment
4. Click **Rollback to this deploy**

## Troubleshooting

### Tests Pass But Deployment Fails

**Check Render logs:**
1. Dashboard → Your Service → Logs
2. Look for error messages
3. Common issues:
   - Missing environment variables
   - Build command incorrect
   - Port configuration wrong

### Redis Connection Errors

**Verify Redis is added:**
1. Dashboard → Your Service
2. Check **Environment** tab
3. Should see `REDIS_HOST`, `REDIS_PORT` variables
4. If missing: Add Redis addon from Render dashboard

### Auto-Deploy Not Triggering

**Checklist:**
- [ ] Auto-Deploy enabled in Render settings
- [ ] Correct branch selected (main)
- [ ] Push was successful
- [ ] No build errors in previous deployment

## Environment Variables Checklist

### Required on Render (API Service)

```env
NODE_ENV=production
PORT=3002

# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Auth
FIREBASE_PROJECT_ID=xxx
FIREBASE_PRIVATE_KEY=xxx
FIREBASE_CLIENT_EMAIL=xxx

# Payments
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email
RESEND_API_KEY=re_xxx

# Redis (auto-populated by Render)
REDIS_HOST=xxx
REDIS_PORT=6379
```

### Required on Render (Web Service)

```env
# These are build-time variables
VITE_API_URL=https://your-api.onrender.com
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

## Best Practices

### Before Pushing to Main

```bash
# Always test locally first
pnpm run lint
pnpm run test
pnpm run build

# If all pass, safe to deploy
git push origin main
```

### Branch Strategy

```
main (production) ← Auto-deploys to Render
  ↑
develop (staging) ← Test here first
  ↑
feature/xxx (work) ← Development
```

### Commit Messages

```bash
feat(api): add new endpoint
fix(auth): resolve token issue
chore(deps): update dependencies
test: add unit tests
docs: update README
```

## Cost Considerations

### Free Tier Limits

- **Web Service**: Free (static sites)
- **API Service**: 750 hours/month free (sleeps after 15 min inactivity)
- **Redis**: $5-10/month (no free tier for persistent Redis)

### Upgrade Recommendations

If you need:
- ✅ No sleep/always on → Upgrade to Starter ($7/month)
- ✅ Custom domain → Free tier supports this
- ✅ More resources → Professional plan ($25/month)

## Next Steps

1. ✅ Enable Auto-Deploy on Render
2. ✅ Configure GitHub secrets
3. ✅ Test deployment with a commit
4. □ Set up staging environment
5. □ Configure custom domain
6. □ Add monitoring (Sentry, UptimeRobot)
7. □ Set up backup strategy

## Quick Reference

- **Render Dashboard**: https://dashboard.render.com
- **GitHub Actions**: https://github.com/your-user/repo/actions
- **API Health Check**: https://your-api.onrender.com/health
- **Deploy Hooks**: Saved in GitHub Secrets

## Support Resources

- [Render Documentation](https://render.com/docs)
- [Render Community Forum](https://community.render.com)
- [GitHub Actions Docs](https://docs.github.com/actions)

---

**Last Updated**: January 2026  
**Status**: Production Ready ✓
