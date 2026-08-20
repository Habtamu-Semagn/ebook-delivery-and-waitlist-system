# Deployment Guide - Ebook System with CI/CD

This guide covers deploying your ebook system with Docker containerization and automated CI/CD pipelines.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Docker Deployment](#docker-deployment)
- [CI/CD with GitHub Actions](#cicd-with-github-actions)
- [Platform-Specific Guides](#platform-specific-guides)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Components
1. **Frontend (Web)** - TanStack Router + React (Vite)
2. **Backend (API)** - NestJS + BullMQ
3. **Database** - Supabase (PostgreSQL + Storage)
4. **Cache/Queue** - Redis (BullMQ)
5. **External Services** - Stripe, Firebase Auth, Resend Email

### Deployment Options
- **Docker + Docker Compose** (Local/Self-hosted)
- **Render.com** (PaaS with GitHub Auto-deploy)
- **Railway.app** (PaaS with GitHub Auto-deploy)
- **AWS/GCP/Azure** (Cloud-native)

---

## Docker Deployment

### 1. Create Dockerfiles

#### Backend Dockerfile

Create `apps/api/Dockerfile`:
```dockerfile
# Multi-stage build for optimized image size
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared-types ./packages/shared-types

# Build application
WORKDIR /app/apps/api
RUN pnpm run build

# Production stage
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/shared-types ./packages/shared-types

WORKDIR /app/apps/api

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main.js"]
```

#### Frontend Dockerfile

Create `apps/web/Dockerfile`:
```dockerfile
# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/web ./apps/web
COPY packages/shared-types ./packages/shared-types

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

# Build application
WORKDIR /app/apps/web
RUN pnpm run build

# Production stage with nginx
FROM nginx:alpine

# Copy nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Create Nginx Configuration

Create `apps/web/nginx.conf`:
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Disable caching for index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
}
```

### 3. Docker Compose Setup

Create `docker-compose.yml` in root:
```yaml
version: '3.8'

services:
  # Redis for BullMQ
  redis:
    image: redis:7-alpine
    container_name: ebook-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: ebook-api
    restart: unless-stopped
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - PORT=3002
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
      - FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - RESEND_API_KEY=${RESEND_API_KEY}
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Frontend Web
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      args:
        - VITE_API_URL=${VITE_API_URL}
        - VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
        - VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}
        - VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
        - VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}
        - VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}
        - VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}
    container_name: ebook-web
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - api

volumes:
  redis-data:
    driver: local
```

### 4. Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Remove volumes (clears Redis data)
docker-compose down -v
```

---

## CI/CD with GitHub Actions

### 1. Create GitHub Actions Workflows

Create `.github/workflows/ci.yml`:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # Lint and Test
  test:
    name: Test & Lint
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint API
        run: cd apps/api && pnpm run lint

      - name: Test API
        run: cd apps/api && pnpm run test
        env:
          NODE_ENV: test

  # Build Docker Images
  build:
    name: Build Docker Images
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push API image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/api/Dockerfile
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/ebook-api:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/ebook-api:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push Web image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/web/Dockerfile
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/ebook-web:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/ebook-web:${{ github.sha }}
          build-args: |
            VITE_API_URL=${{ secrets.VITE_API_URL }}
            VITE_FIREBASE_API_KEY=${{ secrets.VITE_FIREBASE_API_KEY }}
            VITE_FIREBASE_AUTH_DOMAIN=${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
            VITE_FIREBASE_PROJECT_ID=${{ secrets.VITE_FIREBASE_PROJECT_ID }}
            VITE_FIREBASE_STORAGE_BUCKET=${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
            VITE_FIREBASE_MESSAGING_SENDER_ID=${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
            VITE_FIREBASE_APP_ID=${{ secrets.VITE_FIREBASE_APP_ID }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Deploy to Production
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - name: Trigger Render Deployment
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_API }}"
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_WEB }}"
```

### 2. Create Render Deploy Hook Workflow

Create `.github/workflows/deploy-render.yml`:
```yaml
name: Deploy to Render

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-api:
    name: Deploy API to Render
    runs-on: ubuntu-latest
    
    steps:
      - name: Trigger Render API Deploy
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_API }}"
      
      - name: Wait for deployment
        run: sleep 60
      
      - name: Health check
        run: |
          curl -f ${{ secrets.API_URL }}/health || exit 1

  deploy-web:
    name: Deploy Web to Render
    runs-on: ubuntu-latest
    needs: deploy-api
    
    steps:
      - name: Trigger Render Web Deploy
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_WEB }}"
```

### 3. Required GitHub Secrets

Go to **GitHub Repository → Settings → Secrets and variables → Actions** and add:

```
# Docker Hub (optional, if using Docker images)
DOCKERHUB_USERNAME=your-username
DOCKERHUB_TOKEN=your-access-token

# Render Deploy Hooks
RENDER_DEPLOY_HOOK_API=https://api.render.com/deploy/srv-xxxxx
RENDER_DEPLOY_HOOK_WEB=https://api.render.com/deploy/srv-yyyyy

# API URL for health checks
API_URL=https://your-api.onrender.com

# Frontend Environment Variables
VITE_API_URL=https://your-api.onrender.com
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## Platform-Specific Guides

### Render.com with Auto-Deploy

#### 1. Configure Render for API

1. **Go to** [Render Dashboard](https://dashboard.render.com)
2. **Create New → Web Service**
3. **Connect GitHub Repository**
4. **Configure Service**:
   - **Name**: `ebook-api`
   - **Region**: Choose closest to users
   - **Branch**: `main`
   - **Root Directory**: `apps/api`
   - **Runtime**: `Node`
   - **Build Command**: 
     ```bash
     cd ../.. && pnpm install --frozen-lockfile && cd apps/api && pnpm run build
     ```
   - **Start Command**: 
     ```bash
     node dist/main.js
     ```
   - **Plan**: Free (or paid for production)

5. **Enable Auto-Deploy**:
   - Settings → Build & Deploy
   - ✅ Auto-Deploy: Yes
   - This will automatically deploy on every push to `main`

6. **Add Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=3002
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-key
   FIREBASE_PROJECT_ID=your-project
   FIREBASE_PRIVATE_KEY=your-key
   FIREBASE_CLIENT_EMAIL=your-email
   STRIPE_SECRET_KEY=sk_live_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   RESEND_API_KEY=re_xxx
   REDIS_HOST=redis-host (from Render Redis addon)
   REDIS_PORT=6379
   ```

7. **Add Redis**:
   - Dashboard → Add Redis
   - Link to your web service
   - Redis URL auto-populated in env vars

8. **Get Deploy Hook**:
   - Settings → Deploy Hook
   - Copy URL (for GitHub Actions)

#### 2. Configure Render for Web

1. **Create New → Static Site**
2. **Connect GitHub Repository**
3. **Configure**:
   - **Name**: `ebook-web`
   - **Branch**: `main`
   - **Root Directory**: `apps/web`
   - **Build Command**:
     ```bash
     cd ../.. && pnpm install --frozen-lockfile && cd apps/web && pnpm run build
     ```
   - **Publish Directory**: `apps/web/dist`

4. **Enable Auto-Deploy**: Settings → Build & Deploy → Auto-Deploy: Yes

5. **Add Environment Variables**:
   ```env
   VITE_API_URL=https://your-api.onrender.com
   VITE_FIREBASE_API_KEY=xxx
   VITE_FIREBASE_AUTH_DOMAIN=xxx
   VITE_FIREBASE_PROJECT_ID=xxx
   VITE_FIREBASE_STORAGE_BUCKET=xxx
   VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
   VITE_FIREBASE_APP_ID=xxx
   ```

6. **Configure Redirects** (Create `apps/web/public/_redirects`):
   ```
   /*    /index.html   200
   ```

#### 3. Update Current Render Deployment to Use CI/CD

Since you already have a deployment on Render:

1. **Go to your API service on Render Dashboard**
2. **Settings → Build & Deploy**
3. **Enable Auto-Deploy**:
   - Toggle "Auto-Deploy" to **Yes**
   - Choose branch: `main`
4. **Optional - Get Deploy Hook**:
   - Settings → Deploy Hook
   - Copy the webhook URL
   - Add to GitHub Secrets as `RENDER_DEPLOY_HOOK_API`

Now every push to `main` will automatically trigger a deployment!

#### 4. Manual Deploy Hook

You can also trigger deployments manually:
```bash
# Trigger API deployment
curl -X POST "https://api.render.com/deploy/srv-xxxxx?key=your-key"

# Trigger Web deployment
curl -X POST "https://api.render.com/deploy/srv-yyyyy?key=your-key"
```

### Railway.app with Auto-Deploy

#### 1. Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

#### 2. Deploy API
```bash
cd apps/api
railway init
railway up
```

#### 3. Add Environment Variables
```bash
railway variables set NODE_ENV=production
railway variables set PORT=3002
# ... add all other env vars
```

#### 4. Enable Auto-Deploy
- Railway automatically deploys on git push to connected repo
- Connect via: Project Settings → Connect Repo → Select GitHub repo

#### 5. Add Redis
```bash
railway add redis
```

---

## Environment Configuration

### Production Environment Files

Create `.env.production` in root:
```env
# API
NODE_ENV=production
PORT=3002

# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=

# Auth
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=

# Cache/Queue
REDIS_HOST=
REDIS_PORT=6379

# Frontend
VITE_API_URL=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Managing Secrets

**Never commit secrets to git!**

Use one of these methods:

1. **Environment Variables** (Recommended for CI/CD)
   - GitHub Secrets
   - Render Environment Variables
   - Railway Variables

2. **Secret Management Services**
   - AWS Secrets Manager
   - Google Cloud Secret Manager
   - HashiCorp Vault

3. **Local Development**
   - `.env.local` (gitignored)
   - `dotenv` package

---

## Deployment Checklist

### Pre-Deploy
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Firebase project configured
- [ ] Stripe webhooks configured
- [ ] Supabase RLS policies enabled
- [ ] Redis/BullMQ configured

### During Deploy
- [ ] Build completes successfully
- [ ] Health checks pass
- [ ] API responds correctly
- [ ] Frontend loads
- [ ] Authentication works
- [ ] Payment flow works

### Post-Deploy
- [ ] Monitor logs for errors
- [ ] Check Sentry for exceptions
- [ ] Verify Stripe webhooks
- [ ] Test critical user flows
- [ ] Monitor performance metrics

---

## Monitoring & Logging

### Sentry Integration (Error Tracking)

Already configured in your app:

```typescript
// apps/api/src/instrument.ts
// apps/web/instrument.server.mjs
```

Add these to your environment:
```env
SENTRY_DSN=https://xxx@xxx.sentry.io/xxx
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### Health Checks

Your API already has health endpoints:
- `GET /health` - Overall health
- `GET /health/redis` - Redis connectivity
- `GET /health/supabase` - Database connectivity

Monitor these with:
- **UptimeRobot** (free: 50 monitors)
- **Better Uptime** (free: 10 monitors)
- **Render Health Checks** (built-in)

### Logging

Use structured logging:
```typescript
// Use NestJS Logger
import { Logger } from '@nestjs/common';

const logger = new Logger('ServiceName');
logger.log('Info message');
logger.error('Error message', trace);
logger.warn('Warning message');
logger.debug('Debug message');
```

---

## Scaling Strategies

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
services:
  api:
    deploy:
      replicas: 3
    # Add load balancer here
```

### Vertical Scaling
- Upgrade Render/Railway plan
- Increase container resources
- Optimize queries and caching

### Database Scaling
- Connection pooling (pg-bouncer)
- Read replicas
- Upgrade Supabase plan

---

## Rollback Strategy

### Render
1. Go to Dashboard → Deployments
2. Find previous successful deployment
3. Click "Rollback"

### Docker
```bash
# Use specific image tag
docker pull username/ebook-api:previous-sha
docker-compose up -d
```

### Railway
```bash
railway rollback
```

---

## Cost Optimization

### Free Tier Limits

| Service | Free Tier | Upgrade Cost |
|---------|-----------|--------------|
| Render (API) | 750 hrs/mo | $7/mo |
| Render (Web) | 100 GB/mo | Free |
| Supabase | 500 MB DB, 1 GB storage | $25/mo |
| Railway | $5 credit | $5/mo usage |
| Redis | Included | $5-20/mo |
| Sentry | 5k errors/mo | $26/mo |

### Tips
- Use Redis caching to reduce DB calls
- Optimize images before upload
- Enable compression (gzip/brotli)
- Use CDN for static assets
- Monitor usage dashboards

---

## Troubleshooting

### Build Failures

**Issue**: `pnpm-lock.yaml is out of date`
```bash
# Solution
pnpm install
git add pnpm-lock.yaml
git commit -m "fix: update lockfile"
git push
```

**Issue**: TypeScript errors in build
```bash
# Solution: Check types locally first
pnpm run build

# Fix type errors, then commit
```

### Runtime Errors

**Issue**: Container starts but crashes
```bash
# Check logs
docker-compose logs api

# Common causes:
# - Missing environment variables
# - Database connection failure
# - Redis connection failure
```

**Issue**: CORS errors
```typescript
// apps/api/src/main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

### Database Issues

**Issue**: Migrations not applied
```bash
# Run manually
npx supabase db push

# Or via API startup (already configured)
```

**Issue**: RLS policies blocking requests
```sql
-- Check policies in Supabase dashboard
-- Ensure service_role key is used for admin operations
```

---

## Security Best Practices

### Environment Security
- Never commit `.env` files
- Rotate secrets regularly
- Use different keys for staging/production
- Enable 2FA on all accounts

### Application Security
- Keep dependencies updated
- Enable HTTPS only
- Configure security headers
- Rate limiting enabled
- Input validation
- SQL injection prevention (use ORMs)
- XSS prevention

### Infrastructure Security
- Restrict database access (whitelist IPs)
- Use VPC/private networks
- Enable firewall rules
- Regular security audits
- Backup encryption

---

## Backup Strategy

### Database Backups
- Supabase: Automatic daily backups (free tier)
- Manual exports: `pg_dump` via Supabase CLI
- Store in S3/Google Cloud Storage

### File Storage Backups
- Supabase Storage: Replicated automatically
- Consider additional backup to cloud storage

### Configuration Backups
- Environment variables documented
- Infrastructure as Code (IaC) in git
- Docker configurations versioned

---

## Additional Resources

### Documentation
- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Docker Docs](https://docs.docker.com)
- [GitHub Actions](https://docs.github.com/actions)
- [Supabase Docs](https://supabase.com/docs)

### Monitoring Tools
- [Sentry](https://sentry.io)
- [DataDog](https://www.datadoghq.com)
- [New Relic](https://newrelic.com)
- [UptimeRobot](https://uptimerobot.com)

### Community
- [Render Community](https://community.render.com)
- [NestJS Discord](https://discord.gg/nestjs)
- [Supabase Discord](https://discord.supabase.com)

---

## Quick Command Reference

```bash
# Docker
docker-compose up -d                    # Start services
docker-compose logs -f api              # View API logs
docker-compose restart api              # Restart API
docker-compose down                     # Stop all services
docker-compose build --no-cache         # Rebuild from scratch

# Git
git push origin main                    # Trigger auto-deploy
git tag v1.0.0 && git push --tags       # Tag release

# Render CLI
render deploy                           # Manual deploy
render logs -f                          # Stream logs

# Railway CLI
railway up                              # Deploy
railway logs                            # View logs
railway variables                       # List env vars

# Health Checks
curl https://your-api.onrender.com/health
curl https://your-web.onrender.com
```

---

## Next Steps

1. ✅ Set up GitHub repository
2. ✅ Configure GitHub Secrets
3. ✅ Enable Auto-Deploy on Render
4. ✅ Test CI/CD pipeline (push to main)
5. □ Set up monitoring (Sentry, UptimeRobot)
6. □ Configure custom domain
7. □ Set up staging environment
8. □ Document runbooks for common issues
9. □ Schedule regular security audits
10. □ Plan capacity and scaling strategy

---

**Last Updated**: 2026-01-20
**Maintained By**: Development Team
