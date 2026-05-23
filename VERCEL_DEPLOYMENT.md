# Vercel Deployment Guide - Organization Admin

## 📋 Prerequisites

Before deploying to Vercel, ensure:

- ✅ Repository pushed to GitHub (civic-issues-tracker/organization-admin)
- ✅ `.gitignore` properly configured (node_modules, .env files excluded)
- ✅ `package.json` with correct build script: `"build": "tsc -b && vite build"`
- ✅ `.env.example` exists as template (contains no secrets)
- ✅ Backend API deployed and accessible via HTTPS URL

---

## 🚀 Step 1: Prepare for Vercel Deployment

### 1.1 Verify Repository Structure

```bash
cd organization-admin

# Confirm .gitignore is present and complete
cat .gitignore | grep -E "node_modules|\.env"

# Result should show:
# node_modules/
# .env
# .env.local
# .env.*.local
# .env.production
```

### 1.2 Verify Build Configuration

```bash
# Ensure vite.config.ts exists and is configured
cat vite.config.ts

# Should contain:
# - React plugin
# - TailwindCSS plugin
# - Proper output configuration
```

### 1.3 Test Local Production Build

```bash
# Clean and rebuild locally first
rm -rf dist node_modules
npm install --legacy-peer-deps
npm run build

# Should complete with no errors:
# ✓ built in X.XXs
```

---

## 🔗 Step 2: Connect GitHub to Vercel

### 2.1 Create Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

### 2.2 Import Project from GitHub

1. In Vercel Dashboard, click **"Add New..."** → **"Project"**
2. Select **"Civic Issues Tracker"** organization
3. Find **"organization-admin"** repository
4. Click **"Import"**

### 2.3 Configure Project

**Root Directory**: Leave blank (or set to `.`)

**Framework Preset**: Auto-detect should show "Vite"

**Build Command**: 
```bash
npm run build
```

**Output Directory**: 
```
dist
```

**Install Command**:
```bash
npm install --legacy-peer-deps
```

---

## 🔑 Step 3: Set Environment Variables

### 3.1 In Vercel Dashboard

1. After importing, go to **"Settings"** → **"Environment Variables"**
2. Add the following variables:

```env
# Production Backend API URL
VITE_API_BASE_URL=https://your-production-api.com/api/v1
# or if using a hosted backend:
# VITE_API_BASE_URL=https://civic-issues-tracker-backend.herokuapp.com/api/v1

# App Configuration
VITE_APP_NAME=Civic Issues Tracker - Organization Admin
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=true
VITE_OFFLINE_STORAGE_KEY=organization_admin_workspace

# Logging
VITE_LOG_LEVEL=warn

# Authentication
VITE_JWT_STORAGE_KEY=access_token
VITE_JWT_REFRESH_KEY=refresh_token
VITE_TOKEN_REFRESH_THRESHOLD=300

# API Timeout (milliseconds)
VITE_API_TIMEOUT=30000
```

### 3.2 Environment-Specific Variables

**For Development (`.vercel/preview.env.json`)**:
```json
{
  "VITE_API_BASE_URL": "http://localhost:8000/api/v1",
  "VITE_LOG_LEVEL": "info"
}
```

**For Production (`.vercel/production.env.json`)**:
```json
{
  "VITE_API_BASE_URL": "https://api.civic-issues-tracker.com/api/v1",
  "VITE_LOG_LEVEL": "warn"
}
```

---

## 🔐 Step 4: Backend Configuration for Online Connection

### 4.1 Update Backend CORS Settings

On your backend (`Backend/config/settings.py`):

```python
# Allow Vercel frontend domain
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://organization-admin.vercel.app",  # Your Vercel URL
    "https://your-custom-domain.com",  # If using custom domain
]

# Allow credentials for JWT authentication
CORS_ALLOW_CREDENTIALS = True

# Allow specific methods
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

# Allow specific headers
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]
```

### 4.2 Verify Backend Deployment

Backend must be:
- ✅ Running on a public URL (not localhost)
- ✅ HTTPS enabled (SSL certificate)
- ✅ CORS configured for Vercel domain
- ✅ Database properly set up
- ✅ Email service configured (Brevo for notifications)

Example backend URLs:
- `https://api.example.com` (custom domain)
- `https://app.herokuapp.com` (Heroku)
- `https://app.render.com` (Render)
- `https://app.railway.app` (Railway)

---

## 🌐 Step 5: Deploy to Vercel

### 5.1 Automatic Deployment

Once connected to GitHub:
1. Push changes to `main` branch
2. Vercel **automatically deploys** on every push
3. Preview URL generated for pull requests

### 5.2 Manual Deployment

```bash
# Install Vercel CLI (one-time)
npm install -g vercel

# Deploy from project directory
cd organization-admin
vercel

# For production deployment
vercel --prod
```

### 5.3 Monitor Deployment

1. Go to Vercel Dashboard
2. Select project **"organization-admin"**
3. View **"Deployments"** tab
4. Watch build logs in real-time

---

## ✅ Step 6: Post-Deployment Verification

### 6.1 Test Frontend Access

```bash
# Your Vercel URL (something like):
# https://organization-admin.vercel.app

# Open in browser and verify:
# 1. Page loads without errors
# 2. No 404 errors in console
# 3. TailwindCSS styles applied correctly
```

### 6.2 Test Backend Connection

```bash
# In browser console (F12):
console.log('Testing API connection...')

# The app should:
# 1. Attempt to connect to backend
# 2. Redirect to login page (no auth yet)
# 3. Allow login with valid credentials
# 4. Fetch issues from backend API
```

### 6.3 Test API Endpoints

Use curl or Postman:

```bash
# Test backend API is accessible from Vercel
curl https://api.civic-issues-tracker.com/api/v1/auth/login/

# Response should be:
# {"detail": "Method \"GET\" not allowed."}
# (This confirms API is reachable)
```

### 6.4 Monitor Performance

In Vercel Dashboard:
- Check **"Analytics"** tab
- Monitor **"Build Performance"**
- Review **"Core Web Vitals"**

---

## 🛠️ Step 7: Custom Domain (Optional)

### 7.1 Add Custom Domain

1. Go to Vercel Project Settings → **"Domains"**
2. Enter your domain (e.g., `admin.civic-issues-tracker.com`)
3. Add DNS records as shown by Vercel
4. Wait for DNS propagation (5-48 hours)

### 7.2 Update Backend CORS

```python
CORS_ALLOWED_ORIGINS = [
    "https://admin.civic-issues-tracker.com",  # Add custom domain
]
```

---

## 🔍 Troubleshooting Deployment Issues

| Issue | Solution |
|-------|----------|
| **Build fails with "Cannot find module 'react'"** | Run `npm install --legacy-peer-deps` locally, commit package-lock.json |
| **"VITE_API_BASE_URL is undefined"** | Add env var in Vercel Settings, redeploy |
| **"Cannot connect to backend" error** | Check backend URL, verify CORS settings, ensure backend is running |
| **"401 Unauthorized" on login** | Verify backend auth endpoint, check JWT configuration |
| **Styles not loading (no CSS)** | Verify TailwindCSS plugin in vite.config.ts, check dist/assets/ in build |
| **Build takes >5 minutes** | Reduce build time by enabling code-splitting in vite.config.ts |
| **Large bundle size (>500KB)** | Implement dynamic imports, use React.lazy() for routes |

---

## 📊 Environment Variables Reference

| Variable | Development | Production | Required |
|----------|-------------|-----------|----------|
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | `https://api.example.com/api/v1` | ✅ Yes |
| `VITE_LOG_LEVEL` | `info` | `warn` | No |
| `VITE_ENABLE_OFFLINE_MODE` | `true` | `true` | No |
| `VITE_APP_VERSION` | `1.0.0` | `1.0.0` | No |

---

## 🔄 Continuous Deployment Workflow

```
Developer pushes to main branch
        ↓
GitHub receives push
        ↓
Vercel webhook triggered
        ↓
Vercel pulls latest code
        ↓
npm install --legacy-peer-deps
        ↓
npm run build (tsc -b && vite build)
        ↓
Build succeeds → dist/ folder created
        ↓
Vercel deploys dist/ to CDN
        ↓
Live at https://organization-admin.vercel.app
        ↓
Can access from anywhere online
```

---

## 📚 Example Vercel Configuration Files

### `.vercelignore`
```
# Exclude unnecessary files from deployment
.git/
.gitignore
node_modules/
.env
.env.local
.env.production
.DS_Store
.vscode/
.idea/
src/**/*.test.ts
coverage/
docs/
README.md
```

### `vercel.json` (Optional)
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "vite",
  "env": {
    "VITE_API_BASE_URL": "@api_base_url",
    "VITE_LOG_LEVEL": "@log_level"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

---

## 🎯 Quick Deployment Checklist

- [ ] `.gitignore` configured (node_modules excluded)
- [ ] `.env` files not committed (only .env.example)
- [ ] `package.json` build script correct
- [ ] Local build successful: `npm run build`
- [ ] Pushed to GitHub main branch
- [ ] Vercel project created and connected
- [ ] Environment variables set in Vercel
- [ ] Backend API URL configured for production
- [ ] Backend CORS updated with Vercel domain
- [ ] First deployment completed without errors
- [ ] Frontend loads at Vercel URL
- [ ] Login works with backend API
- [ ] API requests succeeding (check Network tab)
- [ ] No console errors (F12)

---

## 🚦 Next Steps

1. **Backend Deployment**: Deploy your Django backend to production service
2. **Database Setup**: Ensure production database is configured
3. **Email Service**: Set up Brevo for email notifications
4. **Monitoring**: Set up error tracking (Sentry, DataDog)
5. **Analytics**: Track user behavior and performance
6. **SSL Certificate**: Ensure HTTPS everywhere

---

## 📞 Support

For Vercel-specific issues:
- https://vercel.com/docs
- https://vercel.com/support

For backend connection issues:
- Check `VITE_API_BASE_URL` in Vercel Settings
- Verify backend CORS configuration
- Check browser Network tab (F12) for failed requests

---

**Ready to deploy?** Let's go! 🚀
