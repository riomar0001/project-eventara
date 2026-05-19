'use client';

import { useEffect } from 'react';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useRouter } from 'next/navigation';
import { client } from '@/api/client.gen';
import { getAccessToken, useAuthStore } from '@/store/auth-store';

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    client.setConfig({ auth: () => getAccessToken() ?? undefined });
    initialize();

    let refreshPromise: Promise<boolean> | null = null;

    const id = client.instance.interceptors.response.use(
      (r) => r,
      async (error: AxiosError) => {
        const req = error.config as RetryableConfig | undefined;
        const status = error.response?.status;
        const url = req?.url ?? '';
        const headers = req?.headers as Record<string, string | undefined> | undefined;
        const hadBearer =
          typeof headers?.Authorization === 'string' &&
          headers.Authorization.startsWith('Bearer ');

        if (!req || status !== 401 || req._retry || !hadBearer || url.includes('/auth/refresh')) {
          return Promise.reject(error);
        }

        req._retry = true;

        if (!refreshPromise) {
          refreshPromise = useAuthStore
            .getState()
            .tryRefresh()
            .finally(() => { refreshPromise = null; });
        }

        const refreshed = await refreshPromise;
        if (!refreshed) {
          router.replace('/login');
          router.refresh();
          return Promise.reject(error);
        }

        const nextToken = getAccessToken();
        if (!nextToken) {
          router.replace('/login');
          router.refresh();
          return Promise.reject(error);
        }

        const h = (req.headers ?? {}) as Record<string, string | undefined>;
        h.Authorization = `Bearer ${nextToken}`;
        req.headers = h as RetryableConfig['headers'];
        return client.instance(req);
      }
    );

    return () => { client.instance.interceptors.response.eject(id); };
  }, [initialize, router]);

  return <>{children}</>;
}
