'use client';

import { useEffect } from 'react';
import { client } from '@/api/client.gen';
import { getAccessToken, useAuthStore } from '@/store/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    // Point the SDK's Axios client to the store's token getter so every
    // authenticated request automatically carries the current Bearer token.
    client.setConfig({ auth: getAccessToken });
    initialize();
  }, [initialize]);

  return <>{children}</>;
}
