import { Navigate, createBrowserRouter } from 'react-router-dom'
import LoginPage from '../features/auth/pages/LoginPage'
import SignupPage from '../features/auth/pages/SignupPage' 
import ProtectedRoute from '../features/auth/ProtectedAuth'     
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage'
import OrganizationAdminDashboardLayout from '../features/dashboard-organization-admin/OrganizationAdminDashboardLayout'
import OrganizationAdminDashboardPage from '../features/dashboard-organization-admin/pages/OrganizationAdminDashboardPage'
import OrganizationAdminIssuesPage from '../features/dashboard-organization-admin/pages/OrganizationAdminIssuesPage'
import OrganizationAdminAnalyticsPage from '../features/dashboard-organization-admin/pages/OrganizationAdminAnalyticsPage'
import OrganizationAdminAlertsPage from '../features/dashboard-organization-admin/pages/OrganizationAdminAlertsPage'

const router = createBrowserRouter([
  // --- PUBLIC AUTH SECTION ---
  {
    path: '/',
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> }, 
      { path: 'login', element: <LoginPage /> },   
      { path: 'signup', element: <SignupPage /> }, 
      { path: 'reset-password', element: <ResetPasswordPage /> }                                                    
    ]
  },

  // --- ORGANIZATION ADMIN DASHBOARD ---
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['organization_admin']}>
        <OrganizationAdminDashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="queue" replace />,
      },
      {
        path: 'queue',
        element: <OrganizationAdminDashboardPage />,
      },
      {
        path: 'map',
        element: <OrganizationAdminIssuesPage />,
      },
      {
        path: 'resolved',
        element: <OrganizationAdminAnalyticsPage />,
      },
      {
        path: 'notifications',
        element: <OrganizationAdminAlertsPage />,
      },
    ],
  },

  // --- 404 CATCH-ALL ---
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]);

export default router;