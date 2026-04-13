'use client';

import { useEffect } from 'react';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useRouter } from 'next/navigation';
import { client } from '@/api/client.gen';
import { getAccessToken, useAuthStore } from '@/store/auth-store';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    // Point the SDK's Axios client to the store's token getter so every
    // authenticated request automatically carries the current Bearer token.
    client.setConfig({ auth: () => getAccessToken() ?? undefined });
    initialize();

    let refreshPromise: Promise<boolean> | null = null;

    const interceptorId = client.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as RetryableRequestConfig | undefined;
        const status = error.response?.status;
        const requestUrl = originalRequest?.url ?? '';
        const authHeader = originalRequest?.headers as Record<string, string | undefined> | undefined;
        const hadBearerToken = typeof authHeader?.Authorization === 'string' && authHeader.Authorization.startsWith('Bearer ');

        if (!originalRequest || status !== 401 || originalRequest._retry || !hadBearerToken || requestUrl.includes('/auth/refresh')) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (!refreshPromise) {
          refreshPromise = useAuthStore
            .getState()
            .tryRefresh()
            .finally(() => {
              refreshPromise = null;
            });
        }

        const refreshed = await refreshPromise;

        if (!refreshed) {
          router.replace('/login');
          router.refresh();
          return Promise.reject(error);
        }

        const nextAccessToken = getAccessToken();
        if (!nextAccessToken) {
          router.replace('/login');
          router.refresh();
          return Promise.reject(error);
        }

        const retryHeaders = (originalRequest.headers ?? {}) as Record<string, string | undefined>;
        retryHeaders.Authorization = `Bearer ${nextAccessToken}`;
        originalRequest.headers = retryHeaders as RetryableRequestConfig['headers'];

        return client.instance(originalRequest);
      }
    );

    return () => {
      client.instance.interceptors.response.eject(interceptorId);
    };
  }, [initialize, router]);

  return <>{children}</>;
}
