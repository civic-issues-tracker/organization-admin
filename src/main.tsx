import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx';
import { LocationProvider } from './context/LocationContext.tsx';
import '../src/public/locales/i18n.ts';
import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient, type Persister } from '@tanstack/react-query-persist-client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, 
      retry: 1,
      staleTime: 1000 * 60 * 5, 
      gcTime: 1000 * 60 * 15,
    },
  },
});

const localStoragePersister: Persister = {
  persistClient: async (client) => {
    localStorage.setItem('CIVIC_TRACKER_ORG_CACHE', JSON.stringify(client));
  },
  restoreClient: async () => {
    const cache = localStorage.getItem('CIVIC_TRACKER_ORG_CACHE');
    return cache ? JSON.parse(cache) : undefined;
  },
  removeClient: async () => {
    localStorage.removeItem('CIVIC_TRACKER_ORG_CACHE');
  },
};

persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // Keep the offline storage backup valid for 24 hours
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <AuthProvider>
        <LocationProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </LocationProvider>
      </AuthProvider>
  </StrictMode>,
)
