'use client';

import { useEffect } from 'react';
import { client } from '@/api/client.gen';
import { getAccessToken } from '@/store/auth-store';
import { useAuthStore } from '@/store/auth-store';

/**
 * Mounts once at the application root and:
 * 1. Registers an axios request interceptor that attaches the current
 *    Bearer token to every SDK request automatically.
 * 2. Triggers auth state hydration via `initialize()`.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    const requestId = client.instance.interceptors.request.use((config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const responseId = client.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error?.response?.status === 401) {
          const store = useAuthStore.getState();
          // Only clear if we actually had a session — avoids wiping state
          // on endpoints that are expected to return 401 (login, etc.)
          if (store.accessToken) {
            store.clearAuth();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      client.instance.interceptors.request.eject(requestId);
      client.instance.interceptors.response.eject(responseId);
    };
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  return <>{children}</>;
}
