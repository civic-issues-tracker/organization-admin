# Backend Integration Guide - Organization Admin

## Overview
The organization-admin frontend is now fully integrated with the Django backend API. All API requests go through the configured backend endpoints.

## Environment Configuration

### Development Setup
Create a `.env` file in the organization-admin root directory:

```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:8000/api/v1

# App Configuration
VITE_APP_NAME=Civic Issues Tracker - Organization Admin
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=true
VITE_OFFLINE_STORAGE_KEY=organization_admin_workspace

# Logging
VITE_LOG_LEVEL=info

# Authentication
VITE_JWT_STORAGE_KEY=access_token
VITE_JWT_REFRESH_KEY=refresh_token
VITE_TOKEN_REFRESH_THRESHOLD=300

# API Timeout (in milliseconds)
VITE_API_TIMEOUT=30000
```

### Production Setup
The `.env.production` file contains production-ready configuration. Update the `VITE_API_BASE_URL` with your production API endpoint.

## Backend API Endpoints

### Authentication Endpoints
- **POST** `/api/v1/auth/login/` - User login
- **POST** `/api/v1/auth/logout/` - User logout
- **POST** `/api/v1/auth/register/resident/` - Resident registration
- **POST** `/api/v1/auth/verify-otp/` - OTP verification
- **POST** `/api/v1/auth/forgot-password/` - Forgot password request
- **POST** `/api/v1/auth/reset-password/` - Reset password
- **GET** `/api/v1/auth/profile/` - Get user profile

### Organization Endpoints
- **GET** `/api/v1/orgs/organizations/` - List all organizations
- **POST** `/api/v1/orgs/organizations/` - Create organization (System Admin)
- **GET** `/api/v1/orgs/organizations/inactive/` - List inactive organizations
- **GET** `/api/v1/orgs/organizations/{id}/` - Get organization detail
- **PATCH** `/api/v1/orgs/organizations/{id}/` - Update organization
- **DELETE** `/api/v1/orgs/organizations/{id}/` - Soft delete organization
- **POST** `/api/v1/orgs/organizations/{id}/activate/` - Reactivate organization

### Category Endpoints
- **GET** `/api/v1/orgs/categories/` - List all categories
- **POST** `/api/v1/orgs/categories/` - Create category (System Admin)
- **GET** `/api/v1/orgs/categories/{id}/` - Get category detail
- **PATCH** `/api/v1/orgs/categories/{id}/` - Update category

### Issue Endpoints
- **GET** `/api/v1/issues/` - List all issues
- **PATCH** `/api/v1/issues/{id}/` - Update issue (status, internal notes)
- **POST** `/api/v1/issues/{id}/release/` - Release issue back to queue
- **POST** `/api/v1/issues/{id}/escalate/` - Escalate issue

## API Services

### Authentication Service
Located in: `src/features/auth/services/authService.ts`

Handles:
- User registration (resident, system admin, organization admin)
- Login/logout
- OTP verification
- Password reset
- Token management

### Organization Service
Located in: `src/features/auth/services/OrganizationService.ts`

Handles:
- Organization CRUD operations
- Organization activation/deactivation
- Category-organization linking

### Issue Service
Located in: `src/features/dashboard-organization-admin/services/organizationAdminIssueService.ts`

Handles:
- Fetching issues assigned to organization admin
- Updating issue status
- Updating internal notes
- Releasing issues
- Escalating issues

## API Client Setup

The application uses Axios with two client instances:

```typescript
// Public Client (for login/register)
export const publicApi = axios.create({
  baseURL: `${VITE_API_BASE_URL}`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Private Client (for authenticated requests)
export const privateApi = axios.create({
  baseURL: `${VITE_API_BASE_URL}`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
```

The `privateApi` client automatically includes the JWT access token in request headers via AuthContext interceptors.

## Authentication Flow

1. User logs in via `/api/v1/auth/login/`
2. Backend returns `access` token and `refresh` token
3. AuthContext stores tokens in sessionStorage/localStorage
4. Token is automatically included in all subsequent API requests
5. On token expiry, refresh token is used to get new access token
6. User role is normalized and validated for access control

## Error Handling & Fallback

The application includes automatic fallback to local storage (workspace) when:
- Backend is unavailable
- Network error occurs
- API response fails

This enables offline mode and data persistence. The `useOrganizationAdminIssues` hook automatically handles:
- Loading issues from API
- Falling back to cached/local data on error
- Showing appropriate error messages to users

## Running Locally

### Backend
```bash
cd Backend
python manage.py runserver 0.0.0.0:8000
```

### Frontend (Organization Admin)
```bash
cd organization-admin
npm install
npm run dev
```

The app will be available at `http://localhost:5173` by default (Vite dev server).

## CORS Configuration

The backend has CORS enabled to allow requests from:
- `localhost:5173` (dev server)
- `localhost:3000` (alternative dev)
- Production domain(s) - configured in `Backend/config/settings.py`

## Troubleshooting

### "Cannot connect to backend" error
1. Ensure backend is running: `python manage.py runserver`
2. Verify `VITE_API_BASE_URL` matches backend URL
3. Check browser console for CORS errors
4. Verify network connectivity

### "Unauthorized" (401) error
1. Clear browser localStorage/sessionStorage
2. Re-login with valid credentials
3. Check token expiry and refresh mechanism

### "Method not allowed" error
1. Verify the HTTP method (GET/POST/PATCH/DELETE)
2. Check API endpoint path matches backend URLs
3. Review request payload structure

## Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview  # Preview production build locally
```

The production build outputs to `dist/` directory and is optimized for deployment.

## Performance Notes

- Initial bundle size: ~220KB gzipped
- Consider code-splitting for large feature modules
- Use dynamic imports for route-based code splitting
- Leverage React.lazy() for component optimization

## Security

- JWT tokens stored securely in sessionStorage (cleared on browser close)
- HTTPS enforced in production
- CORS headers properly configured
- API requests use withCredentials for cookie-based auth support
