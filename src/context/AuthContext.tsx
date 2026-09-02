import React, { createContext, useState, useCallback, useLayoutEffect, useRef, useMemo, useEffect } from 'react';
import { privateApi } from '../features/auth/services/authService';
import { authService } from '../features/auth/services/authService';
import Toast, { type ToastType } from '../components/ui/Toast'; 
import { AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { clearNotificationsCache } from '../hooks/useNotifications';

export interface User {
  id: string;
  user_number?: string;
  email?: string;
  phone?: string;
  full_name: string;
  role_name: 'resident' | 'system_admin' | 'organization' | 'organization_admin';
  organization_name?: string;
  email_verified?: boolean;
  sms_verified?: boolean;
  is_verified?: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: { access?: string; refresh?: string; user: User }) => void;
  logout: () => Promise<void>;
  showToast: (msg: string, type: ToastType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
  });

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'info' as ToastType });

  // Use a Ref to track if we are already in the middle of a logout
  const isLoggingOut = useRef(false);
  // Track whether initial hydration has already run (prevents re-trigger loop)
  const hasHydrated = useRef(false);
  // LoginForm updates the organization label after sign-in. This ref prevents
  // that second update from clearing the just-created account cache.
  const activeAccountId = useRef<string | null>(user?.id ?? null);

  const showToast = useCallback((msg: string, type: ToastType) => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
  }, []);

  const queryClient = useQueryClient();

  const clearQueryCache = useCallback(() => {
    localStorage.removeItem('CIVIC_TRACKER_ORG_CACHE');
    queryClient.clear();
    clearNotificationsCache();
  }, [queryClient]);

  const clearAuthStorage = useCallback(() => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Clear persisted and in-memory data to prevent leakage between accounts.
    clearQueryCache();
    activeAccountId.current = null;
  }, [clearQueryCache]);

  const login = useCallback((data: { access?: string; refresh?: string; user: User }) => {
    // The ticket and performance queries are account-scoped. Clear every
    // existing cache before accepting a different account in this browser.
    if (activeAccountId.current !== data.user.id) {
      clearQueryCache();
      activeAccountId.current = data.user.id;
    }

    if (data.access) {
      setAccessToken(data.access);
      sessionStorage.setItem('accessToken', data.access);
      localStorage.setItem('accessToken', data.access);
    } else {
      setAccessToken(null);
      sessionStorage.removeItem('accessToken');
      localStorage.removeItem('accessToken');
    }

    setUser(data.user);
    sessionStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('user', JSON.stringify(data.user));

    if (data.refresh) {
      sessionStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('refreshToken', data.refresh);
    } else {
      sessionStorage.removeItem('refreshToken');
      localStorage.removeItem('refreshToken');
    }

    // Allow hydration to re-run after a fresh login
    hasHydrated.current = false;
    setIsLoading(false);
  }, [clearQueryCache]);

  const logout = useCallback(async () => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    try {
      await authService.logout();
    } catch {
      console.warn('Server logout request failed, clearing local session anyway.');
    } finally {
      setAccessToken(null);
      setUser(null);
      clearAuthStorage();

      setToast({ show: true, msg: 'Logged out successfully.', type: 'success' });
      setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
      isLoggingOut.current = false;
      setIsLoading(false);
    }
  }, [clearAuthStorage]);

  // Hydrate session exactly once on mount — no dependency on user/accessToken
  // to avoid the infinite re-render loop when a 401 clears them.
  useEffect(() => {
    // Only run hydration once per app lifecycle
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    let isMounted = true;

    // If there is no stored token at all, skip the network call entirely
    const storedToken = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    const hydrateSession = async () => {
      try {
        const profile = await authService.getProfile();
        if (!isMounted) return;

        if (profile) {
          setUser(profile);
        }
      } catch (error) {
        if (!isMounted) return;
        // Token is invalid/expired — clear everything once, no loop
        setAccessToken(null);
        setUser(null);
        clearAuthStorage();
        console.warn('Failed to hydrate auth session', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void hydrateSession();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate the organization name — only when we have a valid user AND token
  useEffect(() => {
    let isMounted = true;

    const hydrateOrganizationName = async () => {
      // Guard: don't fire if we have no token (avoids 401 after logout)
      const storedToken = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
      if (!storedToken) return;
      if (!user || user.role_name !== 'organization_admin' || user.organization_name || !user.email) {
        return;
      }

      try {
        const org = await authService.getUserOrganization(user.email);
        const organizationName = org?.name?.trim();
        if (!isMounted || !organizationName) return;

        const updatedUser = { ...user, organization_name: organizationName };
        setUser(updatedUser);
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (error) {
        console.warn('Failed to hydrate organization name for auth user', error);
      }
    };

    void hydrateOrganizationName();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Interceptors for API logic
  useLayoutEffect(() => {
    const requestIntercept = privateApi.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
        if (token && !config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseIntercept = privateApi.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const axiosError = error as AxiosError;
        const originalRequest = axiosError.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (axiosError.response?.status === 429) {
          console.warn("Security: Too many requests. Please slow down.");
        }

        // If we get a 401 and we're NOT already logging out, attempt refresh
        if (axiosError.response?.status === 401 && originalRequest && !originalRequest._retry && !isLoggingOut.current) {
          originalRequest._retry = true;
          
          try {
            const currentRefreshToken = sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');
            if (currentRefreshToken) {
              // Note: using authService directly without circular dependency issues because it's imported at the top
              const result = await authService.refreshToken({ refresh: currentRefreshToken });
              if (result.access) {
                // Update state and storage
                setAccessToken(result.access);
                if (localStorage.getItem('refreshToken')) {
                  localStorage.setItem('accessToken', result.access);
                } else {
                  sessionStorage.setItem('accessToken', result.access);
                }
                
                // Retry the original request
                originalRequest.headers['Authorization'] = `Bearer ${result.access}`;
                return privateApi(originalRequest);
              }
            }
          } catch (refreshError) {
            console.error("Token refresh failed", refreshError);
          }

          // If refresh failed or no refresh token, logout
          await logout();
        }

        throw error;
      }
    );

    return () => {
      privateApi.interceptors.request.eject(requestIntercept);
      privateApi.interceptors.response.eject(responseIntercept);
    };
  }, [logout]); 

  const contextValue = useMemo(() => ({
    user,
    accessToken,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    showToast,
  }), [user, accessToken, isLoading, login, logout, showToast]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <Toast 
        isVisible={toast.show} 
        message={toast.msg} 
        type={toast.type} 
        onClose={() => setToast(p => ({...p, show: false}))} 
      />
    </AuthContext.Provider>
  );
};

export default AuthContext;
