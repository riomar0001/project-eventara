'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // Await initialization before making any routing decision.
      // The idempotency guard in initialize() makes repeated calls a no-op.
      await useAuthStore.getState().initialize();

      if (cancelled) return;

      const { accessToken, user } = useAuthStore.getState();
      const isAuthenticated = !!accessToken && !!user;
      const isOnboarded = user?.doneOnboarding ?? false;

      if (!isAuthenticated) {
        router.replace('/login');
        return;
      }

      if (!isOnboarded && !pathname.startsWith('/onboarding')) {
        router.replace('/onboarding');
        return;
      }

      if (isOnboarded && pathname.startsWith('/onboarding')) {
        router.replace('/admin/dashboard');
        return;
      }

      setIsChecking(false);
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (isChecking) return null;

  return <>{children}</>;
}
