'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

/**
 * Wraps authenticated routes. While auth state is still initializing it
 * renders nothing to avoid a flash of protected content. Once initialized:
 * - Unauthenticated users are redirected to /login
 * - Authenticated users who haven't completed onboarding go to /onboarding
 * - Everyone else sees their children
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.replace('/login');
    } else if (!user.doneOnboarding) {
      router.replace('/onboarding');
    }
  }, [isInitialized, user, router]);

  if (!isInitialized || !user || !user.doneOnboarding) {
    return null;
  }

  return <>{children}</>;
}
