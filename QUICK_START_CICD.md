# Quick Start: Enable CI/CD for Your Render Deployment

## 🚀 5-Minute Setup

Your code is now CI/CD-ready! Here's how to activate automatic deployments:

### Step 1: Enable Auto-Deploy on Render (2 minutes)

1. Open [Render Dashboard](https://dashboard.render.com)
2. Click on your **ebook-api** service
3. Go to **Settings** → **Build & Deploy**
4. Toggle **Auto-Deploy** to **Yes**
5. Select branch: **main**
6. Click **Save Changes**

✅ **Done!** Your backend will now automatically deploy on every push to `main`

### Step 2: Test It (1 minute)

```bash
# Make a test commit
echo "# CI/CD Enabled" >> README.md
git add README.md
git commit -m "test: verify auto-deploy"
git push origin main
```

Watch your Render dashboard - deployment should start within seconds!

---

## What You Just Got

### ✅ Automatic Deployments
- Push to `main` → Render automatically deploys
- No manual intervention needed
- Zero-downtime deployments

### ✅ Docker Support
- Containerized applications
- Consistent environments
- Easy local development with `docker-compose up`

### ✅ GitHub Actions Ready
- Automated testing on every push
- Optional Docker image builds
- Manual deployment triggers

---

## Next Steps (Optional)

### Add GitHub Actions Testing

1. **Go to GitHub**: Your repo → **Settings** → **Secrets and variables** → **Actions**

2. **Add Secret**:
   ```
   Name: RENDER_DEPLOY_HOOK_API
   Value: https://api.render.com/deploy/srv-xxxxx?key=yyy
   ```
   
   Get this from: Render Dashboard → Your Service → Settings → Deploy Hook

3. **Push to main** - GitHub Actions will now run tests before deployment!

### Local Development with Docker

```bash
# Create environment file
cp .env.example .env

# Start everything locally
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

---

## How It Works

```
┌──────────────┐
│  Git Push    │
│   to main    │
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   GitHub     │  │   Render     │
│   Actions    │  │  Detects     │
│  (Optional)  │  │   Change     │
└──────┬───────┘  └──────┬───────┘
       │                 │
       │ Tests Pass      │ Auto-Deploy
       │                 │ Enabled
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│  Trigger     │  │  Pull Code   │
│  Render      │  │  Build       │
│  Deploy      │  │  Deploy      │
└──────────────┘  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  Live on     │
                  │  Production  │
                  └──────────────┘
```

---

## Troubleshooting

### Deployment Not Triggering?

**Check**:
1. Auto-Deploy is ON in Render settings
2. Branch is set to `main`
3. You pushed to the correct branch: `git branch`

### Build Failing?

```bash
# Test locally first
pnpm install
cd apps/api
pnpm run build

# If it fails locally, fix the errors
# Then commit and push
```

### Need to Rollback?

1. Render Dashboard → **Deployments**
2. Find last working deployment
3. Click **Rollback**

---

## Documentation

- **Full Guide**: See `DEPLOYMENT_GUIDE.md` for complete Docker/CI/CD documentation
- **CI/CD Details**: See `CI_CD_SETUP.md` for GitHub Actions setup
- **Render Help**: [render.com/docs](https://render.com/docs)

---

## Current Status

✅ Docker files created
✅ GitHub Actions workflows added
✅ Deployment guide updated
✅ Auto-deploy instructions ready

**Next Action**: Enable Auto-Deploy on Render (see Step 1 above)

---

**Questions?** Check the full guides or Render's support documentation.
