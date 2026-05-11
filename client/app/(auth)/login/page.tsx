'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/login/login-form';
import { useAuthStore } from '@/store/auth-store';

export default function LoginPage() {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      await useAuthStore.getState().initialize();

      if (cancelled) return;

      const { accessToken, user } = useAuthStore.getState();

      if (!!accessToken && !!user && user.doneOnboarding) {
        router.replace('/dashboard');
        return;
      }

      setIsChecking(false);
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (isChecking) return null;

  return <LoginForm />;
}
