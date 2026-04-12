'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

/**
 * Wraps authenticated routes. While auth state is still initializing it
 * renders nothing to avoid a flash of protected content. Once initialized,
 * unauthenticated users are redirected to /login; authenticated users see
 * their children.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (isInitialized && !user) {
      router.replace('/login');
    }
  }, [isInitialized, user, router]);

  if (!isInitialized || !user) {
    return null;
  }

  return <>{children}</>;
}
