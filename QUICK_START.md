# 🚀 Quick Start Guide - Organization Admin + Backend

## 30-Second Setup

```bash
# 1. Start Backend (in separate terminal)
cd Backend
pip install --break-system-packages -r requirements.txt
python manage.py runserver 0.0.0.0:8000

# 2. Setup Frontend (in another terminal)
cd organization-admin
bash setup.sh

# 3. Open in Browser
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/api/v1
```

## What's Connected?

| Feature | Backend Endpoint | Status |
|---------|------------------|--------|
| Login | `POST /api/v1/auth/login/` | ✅ Connected |
| Dashboard (Queue) | `GET /api/v1/issues/` | ✅ Connected |
| Map View | `GET /api/v1/issues/` | ✅ Connected |
| Status Updates | `PATCH /api/v1/issues/{id}/` | ✅ Connected |
| Issue Release | `POST /api/v1/issues/{id}/release/` | ✅ Connected |
| Issue Escalate | `POST /api/v1/issues/{id}/escalate/` | ✅ Connected |
| Analytics | `GET /api/v1/issues/` | ✅ Connected |
| Organizations | `GET /api/v1/orgs/organizations/` | ✅ Connected |

## Key Files

**Configuration**:
- `.env` - Development settings (API URL, timeouts, etc.)
- `.env.production` - Production settings

**API Services**:
- `src/features/auth/services/authService.ts` - Authentication
- `src/features/auth/services/OrganizationService.ts` - Organizations
- `src/features/dashboard-organization-admin/services/organizationAdminIssueService.ts` - Issues

**State Management**:
- `src/context/AuthContext.tsx` - User auth state
- `src/features/dashboard-organization-admin/hooks/useOrganizationAdminIssues.ts` - Issues state

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_LOG_LEVEL=info
VITE_ENABLE_OFFLINE_MODE=true
```

## Common Tasks

### Add New API Endpoint
```typescript
// In src/features/auth/services/SomeService.ts
import { privateApi } from './authService';

export const someApi = {
  fetchData: async (id: string) => {
    const response = await privateApi.get(`/endpoint/${id}/`);
    return response.data;
  },
};
```

### Update API Base URL for Production
```bash
# Edit .env.production
VITE_API_BASE_URL=https://your-production-api.com/api/v1
```

### Test API Connection
```bash
# Verify backend is running
curl http://localhost:8000/api/v1/auth/login/
# Should return: {"detail": "Method \"GET\" not allowed."}
```

### Debug API Issues
```typescript
// Check browser console for:
// 1. Network tab - HTTP requests and responses
// 2. Application tab - localStorage/sessionStorage tokens
// 3. Console - Error messages and logs
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to backend" | Start Django: `python manage.py runserver 0.0.0.0:8000` |
| "401 Unauthorized" | Clear localStorage, re-login with valid credentials |
| "CORS error" | Check `CORS_ALLOWED_ORIGINS` in `Backend/config/settings.py` |
| "Build fails" | Run `npm install --legacy-peer-deps` |

## Documentation

- **Detailed Integration**: See `BACKEND_INTEGRATION.md`
- **Architecture Overview**: See `INTEGRATION_SUMMARY.md`
- **API Reference**: Check `Backend/README.md`

---

**Questions?** Check the documentation files or review the error messages in browser console (F12 > Console tab).
