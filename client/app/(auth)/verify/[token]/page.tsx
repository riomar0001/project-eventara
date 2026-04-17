'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LoadingState, SuccessState, ExpiredState, AlreadyVerifiedState, InvalidState } from '@/components/auth/verify/verify-email-states';
import { Card } from '@/components/ui/card';
import { Authentication } from '@/api/sdk.gen';
import { decodeTokenUser } from '@/lib/auth/token';
import { useAuthStore } from '@/store/auth-store';

type VerifyState = 'loading' | 'success' | 'expired' | 'already_verified' | 'invalid';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [state, setState] = useState<VerifyState>(!token ? 'invalid' : 'loading');

  useEffect(() => {
    if (!token) return;

    Authentication.verifyEmailAuthVerifyTokenGet({ path: { token }, throwOnError: false }).then((result) => {
      if (result.data) {
        const user = decodeTokenUser(result.data.access_token);

        console.log(user);

        if (!user) {
          setState('invalid');
          return;
        }

        setAuth(result.data.access_token, result.data.refresh_token, user);
        setState('success');
        setTimeout(() => router.replace('/admin/dashboard'), 1800);
        return;
      }
      const status = (result as { response?: { status?: number } }).response?.status;

      if (status === 401) {
        setState('expired');
        return;
      }

      if (status === 409) {
        setState('already_verified');
        return;
      }

      setState('invalid');
    });
  }, [token, router, setAuth]);

  return (
    <Card className="gap-0 overflow-hidden py-0" style={{ animation: 'auth-card-in 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>
      {state === 'loading' && <LoadingState />}
      {state === 'success' && <SuccessState />}
      {state === 'expired' && <ExpiredState />}
      {state === 'already_verified' && <AlreadyVerifiedState />}
      {state === 'invalid' && <InvalidState />}
    </Card>
  );
}

