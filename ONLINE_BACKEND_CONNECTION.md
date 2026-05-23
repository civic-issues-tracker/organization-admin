# Online Backend Connection Guide

## 🌐 Overview

This guide explains how to connect your Vercel-deployed frontend to a production backend running online.

---

## 📍 Backend Deployment Options

### Option A: Render.com (Recommended for Django)

**Why Render?**
- Free tier available for Django
- Automatic deployments from GitHub
- Built-in PostgreSQL database
- HTTPS by default
- Easy environment variables

**Setup Steps:**

1. **Push Backend to GitHub**
```bash
cd Backend
git init
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Create Render Account**
   - Visit https://render.com
   - Sign up with GitHub
   - Authorize Render

3. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Configure:
     - **Name**: `civic-issues-tracker-api`
     - **Region**: Choose closest to users
     - **Branch**: `main`
     - **Build Command**: `pip install -r requirements.txt && python manage.py migrate`
     - **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`

4. **Add Environment Variables**
   - In Render dashboard:
   - **ALLOWED_HOSTS**: `your-app.onrender.com`
   - **DEBUG**: `False`
   - **DATABASE_URL**: (Auto-provided)
   - **SECRET_KEY**: Generate strong key

5. **Deploy**
   - Render automatically deploys on GitHub push
   - Backend URL: `https://civic-issues-tracker-api.onrender.com`

**Update Frontend CORS:**
```env
VITE_API_BASE_URL=https://civic-issues-tracker-api.onrender.com/api/v1
```

---

### Option B: Heroku (Classic)

**Setup:**

1. **Create Heroku Account**
   - Visit https://www.heroku.com
   - Sign up

2. **Install Heroku CLI**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
heroku login
```

3. **Create Procfile**
```bash
cd Backend
echo "web: gunicorn config.wsgi:application --bind 0.0.0.0:\$PORT" > Procfile
```

4. **Create Heroku App**
```bash
heroku create civic-issues-tracker-api
```

5. **Add Database**
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

6. **Set Environment Variables**
```bash
heroku config:set SECRET_KEY="your-secret-key"
heroku config:set DEBUG="False"
heroku config:set ALLOWED_HOSTS="civic-issues-tracker-api.herokuapp.com"
```

7. **Deploy**
```bash
git push heroku main
```

**Backend URL**: `https://civic-issues-tracker-api.herokuapp.com`

---

### Option C: Railway.app (New & Modern)

**Setup:**

1. **Create Railway Account**
   - Visit https://railway.app
   - Login with GitHub

2. **Create New Project**
   - Click "Create New Project"
   - Select "Deploy from GitHub"
   - Connect your Backend repository

3. **Configure Service**
   - Select "Python" as detected language
   - Railway auto-configures Django
   - Add PostgreSQL plugin

4. **Set Variables**
   - `DATABASE_URL` (auto-provided)
   - `SECRET_KEY`
   - `DEBUG=False`
   - `ALLOWED_HOSTS=your-app.railway.app`

5. **Deploy**
   - Push to GitHub
   - Railway auto-deploys

**Backend URL**: `https://your-app.railway.app`

---

### Option D: AWS/DigitalOcean/Azure (Self-Hosted)

**What You Need:**
- Virtual Private Server (VPS)
- Domain name (optional)
- SSL certificate (Let's Encrypt - free)
- Docker (recommended)

**Setup Example (DigitalOcean):**

1. **Create Droplet**
   - OS: Ubuntu 22.04
   - Size: $5/month
   - Region: Pick one

2. **SSH into Droplet**
```bash
ssh root@your-ip-address
```

3. **Install Dependencies**
```bash
apt update && apt upgrade -y
apt install -y python3 python3-pip postgresql nginx gunicorn
```

4. **Clone Backend**
```bash
git clone https://github.com/civic-issues-tracker/Backend.git
cd Backend
pip install -r requirements.txt
```

5. **Configure Gunicorn**
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

6. **Setup Nginx Reverse Proxy**
```bash
cat > /etc/nginx/sites-available/default << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

nginx -s reload
```

7. **Enable SSL (Let's Encrypt)**
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

**Backend URL**: `https://your-domain.com`

---

## 🔗 Connecting Vercel Frontend to Online Backend

### Step 1: Deploy Backend First

- Choose one of the options above
- Get public HTTPS URL (e.g., `https://api.example.com`)
- Verify it's responding: `curl https://api.example.com/api/v1/auth/login/`

### Step 2: Configure Frontend for Production

**Update `.env.production`:**
```env
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_LOG_LEVEL=warn
VITE_ENABLE_OFFLINE_MODE=true
```

### Step 3: Update Backend CORS

**In Backend/config/settings.py:**
```python
import os

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",       # Local dev
    "http://localhost:5173",       # Local Vite
    "https://organization-admin.vercel.app",  # Vercel production
    "https://your-custom-domain.com",  # If using custom domain
]

# Allow all methods and headers for CORS
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS", 
    "PATCH",
    "POST",
    "PUT",
]
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

### Step 4: Deploy Frontend to Vercel

1. **Push Frontend Changes**
```bash
cd organization-admin
git add .
git commit -m "Configure production backend URL"
git push origin main
```

2. **Vercel Auto-Deploys**
   - Check Vercel Dashboard
   - Wait for build to complete
   - New environment variable used in build

3. **Test Connection**
   - Open https://organization-admin.vercel.app
   - Open browser DevTools (F12)
   - Go to Network tab
   - Login with valid credentials
   - Should see API requests going to your backend
   - Watch for CORS errors (if any)

---

## 🧪 Testing Online Connection

### Test 1: Check Backend is Reachable

```bash
curl -I https://your-backend-url.com/api/v1/auth/login/

# Should return 405 (Method Not Allowed)
# This means the server is reachable but expects POST
```

### Test 2: Check Frontend Loads

```bash
# Open in browser
https://organization-admin.vercel.app

# Check console (F12 → Console tab)
# Should NOT see:
# - "Cannot connect to backend"
# - CORS errors
# - "Failed to fetch"
```

### Test 3: Test Login

```
1. Go to login page
2. Enter test credentials
3. Click Login
4. Watch Network tab (F12 → Network)
5. Should see POST request to /api/v1/auth/login/
6. Response should be 200 with access token
7. Should redirect to dashboard
```

### Test 4: Check API Requests

```
After login:
1. Go to Dashboard/Queue
2. Watch Network tab
3. Should see request to /api/v1/issues/
4. Should receive list of issues from backend
5. No CORS errors
```

---

## ⚠️ Common Connection Issues & Fixes

### Issue 1: "Cannot connect to backend" Error

**Cause**: Frontend can't reach backend URL

**Fix**:
```bash
# 1. Verify backend is online
curl https://your-backend-url.com/api/v1/auth/login/

# 2. Check Vercel env var
# Dashboard → Settings → Environment Variables
# Ensure VITE_API_BASE_URL is correct

# 3. Redeploy frontend
git push origin main  # Triggers redeploy

# 4. Clear browser cache
# DevTools → Application → Clear Site Data
```

### Issue 2: CORS Error

**Error message**: "Access to XMLHttpRequest has been blocked by CORS policy"

**Cause**: Backend CORS not configured for Vercel domain

**Fix**:
```python
# In Backend/config/settings.py
CORS_ALLOWED_ORIGINS = [
    "https://organization-admin.vercel.app",  # Add Vercel URL
]

# Restart backend server
```

### Issue 3: 401 Unauthorized on Login

**Cause**: JWT configuration mismatch or invalid credentials

**Fix**:
```bash
# 1. Verify user exists in backend database
python manage.py shell
>>> from apps.accounts.models import User
>>> User.objects.all()

# 2. Test login with valid credentials
# 3. Check backend logs for auth errors
```

### Issue 4: API Returns Errors (5xx Status)

**Cause**: Backend server error

**Fix**:
```bash
# 1. Check backend logs
# Use provider's logging (Render, Heroku, etc.)

# 2. Verify database connection
python manage.py migrate

# 3. Check environment variables are set correctly
```

### Issue 5: Build Fails on Vercel

**Cause**: Missing dependencies or build errors

**Fix**:
```bash
# 1. Test build locally
npm run build

# 2. If build fails, fix errors locally

# 3. Commit and push
git push origin main

# 4. Watch Vercel build logs
```

---

## 📊 Architecture After Deployment

```
┌─────────────────────────────────────────────────────────┐
│                      INTERNET                            │
└─────────────────────────────────────────────────────────┘
           ↑                                    ↑
           │                                    │
           │ HTTPS                              │ HTTPS
           │                                    │
           ↓                                    ↓
┌──────────────────────┐             ┌──────────────────────┐
│   Vercel CDN         │             │  Backend Server      │
│  (Frontend)          │             │  (Django API)        │
│                      │             │                      │
│ organization-admin   │             │ your-backend-url     │
│ .vercel.app          │             │ .herokuapp.com       │
│                      │             │ .onrender.com        │
│ - React App          │             │ - Django REST API    │
│ - TailwindCSS        │             │ - PostgreSQL DB      │
│ - Leaflet Maps       │◄────────────┤ - JWT Auth           │
│ - Recharts Analytics │             │ - Business Logic     │
│                      │             │                      │
└──────────────────────┘             └──────────────────────┘
           ↑                                    ↑
           │                                    │
           └─────────────────────┬──────────────┘
                                 │
                        ┌────────▼─────────┐
                        │   User Browser   │
                        └──────────────────┘
```

---

## ✅ Deployment Verification Checklist

- [ ] Backend deployed and accessible
- [ ] Backend URL is HTTPS
- [ ] Backend returns responses (tested with curl)
- [ ] Backend CORS configured for Vercel domain
- [ ] Frontend environment variables set in Vercel
- [ ] Frontend build successful
- [ ] Frontend loads at Vercel URL
- [ ] Frontend console has no errors
- [ ] Login works with valid credentials
- [ ] Dashboard loads issues from backend
- [ ] All API requests (Network tab) returning 200/201
- [ ] Map visualization loads locations
- [ ] Analytics charts display data
- [ ] Offline mode works (localStorage fallback)

---

## 🚀 Production Optimization

### Enable GZIP Compression
```python
# Backend - settings.py
MIDDLEWARE = [
    'django.middleware.gzip.GZipMiddleware',
    # ... other middleware
]
```

### Enable Caching
```python
# Backend - settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

### Setup Error Tracking
```python
# Backend - settings.py
import sentry_sdk
sentry_sdk.init(
    dsn="YOUR_SENTRY_DSN",
    traces_sample_rate=0.1,
    environment="production"
)
```

### Frontend Error Tracking
```typescript
// Frontend - main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: "production",
  tracesSampleRate: 0.1,
});
```

---

## 📚 Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Django Deployment**: https://docs.djangoproject.com/en/4.2/howto/deployment/
- **CORS Guide**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- **JWT Best Practices**: https://tools.ietf.org/html/rfc7519
- **Render Docs**: https://render.com/docs
- **Heroku Docs**: https://devcenter.heroku.com

---

**Your app is now running online! 🎉**
