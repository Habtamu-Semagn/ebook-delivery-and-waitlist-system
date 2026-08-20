# CI/CD Setup Guide

## Quick Setup for Render Auto-Deploy

### For Your Current Deployed Backend

Since you already have your backend deployed on Render, here's how to enable automatic deployments:

#### Step 1: Enable Auto-Deploy on Render

1. Go to your [Render Dashboard](https://dashboard.render.com)
2. Select your API service (ebook-api)
3. Click **Settings** → **Build & Deploy**
4. Under "Auto-Deploy", toggle it to **Yes**
5. Select branch: `main`
6. Click **Save Changes**

That's it! Now every time you push to the `main` branch, Render will automatically:
- Pull the latest code
- Install dependencies
- Build the application
- Deploy the new version

#### Step 2: Get Deploy Hook (Optional - for Manual Triggers)

1. In your service settings, scroll to **Deploy Hook**
2. Copy the webhook URL (looks like `https://api.render.com/deploy/srv-xxxxx?key=yyy`)
3. Save this for manual deployments or GitHub Actions

### Testing Auto-Deploy

```bash
# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: trigger auto-deploy"
git push origin main
```

Watch your Render dashboard - deployment should start automatically!

---

## GitHub Actions Setup (Optional)

If you want more control over your CI/CD pipeline with automated testing and Docker builds:

### Step 1: Add GitHub Secrets

Go to **your GitHub repo** → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

#### Required for Render Deploy
```
RENDER_DEPLOY_HOOK_API=https://api.render.com/deploy/srv-xxxxx?key=yyy
API_URL=https://your-api.onrender.com
```

#### Optional (for Docker Hub)
```
DOCKERHUB_USERNAME=your-username
DOCKERHUB_TOKEN=your-access-token
```

#### Optional (for Frontend Environment)
```
VITE_API_URL=https://your-api.onrender.com
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Step 2: Push Workflow Files

The workflow files are already created in `.github/workflows/`:
- `ci.yml` - Main CI/CD pipeline with tests and builds
- `deploy-render.yml` - Manual deployment trigger

```bash
# Commit the workflow files
git add .github/
git commit -m "ci: add GitHub Actions workflows"
git push origin main
```

### Step 3: Watch It Work

1. Go to your GitHub repo
2. Click **Actions** tab
3. See your workflows running automatically on every push

---

## Manual Deployment

### Using Deploy Hook

```bash
# Deploy API
curl -X POST "https://api.render.com/deploy/srv-xxxxx?key=yyy"

# Or save as npm script in package.json:
"deploy:api": "curl -X POST $RENDER_DEPLOY_HOOK_API"
```

Then run:
```bash
npm run deploy:api
```

### Using GitHub Actions Manual Trigger

1. Go to GitHub repo → **Actions** tab
2. Select **Deploy to Render** workflow
3. Click **Run workflow** button
4. Choose branch and click **Run workflow**

---

## Docker Local Development

### Quick Start

```bash
# Create .env file with your variables
cp .env.example .env

# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Services

```bash
# Start only API + Redis
docker-compose up -d api redis

# Rebuild specific service
docker-compose build api

# Restart service
docker-compose restart api
```

---

## Deployment Workflow

### Standard Flow

```
1. Developer pushes to main branch
   ↓
2. GitHub Actions runs tests (optional)
   ↓
3. Render detects new commit (Auto-Deploy enabled)
   ↓
4. Render pulls code, builds, and deploys
   ↓
5. Health checks verify deployment
```

### With GitHub Actions

```
1. Push to main
   ↓
2. GitHub Actions:
   - Runs linter
   - Runs tests
   - Builds Docker images (optional)
   - Triggers Render deploy hook
   ↓
3. Render builds and deploys
   ↓
4. Workflow verifies health endpoint
```

---

## Monitoring Deployments

### Render Dashboard

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Select your service
3. View:
   - **Events**: Deployment history
   - **Logs**: Real-time logs
   - **Metrics**: Performance data

### GitHub Actions

1. Go to your repo → **Actions** tab
2. Click on a workflow run
3. View detailed logs for each step

### Health Checks

```bash
# Check API health
curl https://your-api.onrender.com/health

# Expected response:
{
  "status": "ok",
  "info": {
    "redis": { "status": "up" },
    "supabase": { "status": "up" }
  }
}
```

---

## Rollback

### Render

1. Go to **Deployments** in your service dashboard
2. Find the last working deployment
3. Click **Rollback to this deploy**

### Git

```bash
# Revert last commit
git revert HEAD
git push origin main

# This will trigger a new deployment with the reverted code
```

---

## Common Issues

### Build Fails on Render

**Issue**: Dependencies not installing
```bash
# Check: Is pnpm-lock.yaml committed?
git status

# Fix:
pnpm install
git add pnpm-lock.yaml
git commit -m "fix: update lockfile"
git push
```

**Issue**: TypeScript compilation errors
```bash
# Test build locally first
cd apps/api
pnpm run build

# Fix any errors, then commit
```

### Auto-Deploy Not Triggering

**Checklist**:
- [ ] Auto-Deploy is enabled in Render settings
- [ ] Correct branch selected (main)
- [ ] Push was to the correct branch
- [ ] No build errors in previous deployment

### GitHub Actions Failing

**Check**:
1. Actions tab → Failed workflow
2. Click on failed step
3. Read error message
4. Common causes:
   - Missing secrets
   - Syntax errors in workflow file
   - Test failures

---

## Environment Variables

### Updating on Render

1. Dashboard → Your Service → **Environment**
2. Add/Edit variables
3. Click **Save Changes**
4. Service automatically restarts

### Required Variables

#### API Service
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

---

## Best Practices

### Branch Strategy

```
main (production)
  ← develop (staging)
    ← feature/xxx (development)
```

### Deployment Process

1. **Development**: Work on `feature/xxx` branch
2. **Testing**: Merge to `develop` (deploy to staging)
3. **Production**: Merge to `main` (auto-deploy to production)

### Commit Messages

```bash
# Format: type(scope): message

git commit -m "feat(api): add new book endpoint"
git commit -m "fix(auth): resolve token expiration issue"
git commit -m "chore(deps): update dependencies"
```

### Testing Before Deploy

```bash
# Always run locally first
pnpm run lint
pnpm run test
pnpm run build

# If all pass, safe to deploy
git push origin main
```

---

## Next Steps

1. ✅ Enable Auto-Deploy on Render
2. ✅ Test deployment with a small commit
3. □ Set up GitHub Actions (optional)
4. □ Configure staging environment
5. □ Set up monitoring alerts
6. □ Document rollback procedures
7. □ Schedule regular dependency updates

---

## Support

### Resources
- [Render Documentation](https://render.com/docs)
- [GitHub Actions Docs](https://docs.github.com/actions)
- [Docker Docs](https://docs.docker.com)

### Troubleshooting
- Check Render logs: Dashboard → Service → Logs
- Check GitHub Actions: Repo → Actions tab
- Review deployment guide: `DEPLOYMENT_GUIDE.md`

---

**Quick Reference**:
- Render Dashboard: https://dashboard.render.com
- GitHub Actions: https://github.com/your-user/your-repo/actions
- Health Check: https://your-api.onrender.com/health
