'use client';

import { useEffect } from 'react';

import { useAuthStore } from '@/store/auth-store';

/**
 * Mounts once at the application root and triggers auth state hydration.
 *
 * On first render it calls `initialize()` which silently attempts to exchange
 * any persisted refresh token for a fresh access token. The `isInitialized`
 * flag in the store transitions to true when the attempt settles, allowing
 * downstream consumers to safely gate on a known auth state without risking
 * a flash-of-unauthenticated-content.
 *
 * This component does not block rendering — children are always shown
 * immediately. Route-level guards should use `isInitialized` to defer
 * redirect decisions until hydration is complete.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore(s => s.initialize);
  const isInitialized = useAuthStore(s => s.isInitialized);

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  return <>{children}</>;
}
