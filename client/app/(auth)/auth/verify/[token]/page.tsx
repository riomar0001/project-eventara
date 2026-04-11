'use client';

import { use, useEffect, useState } from 'react';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Authentication } from '@/api/sdk.gen';
import { useAuthStore } from '@/store/auth-store';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    async function verify() {
      try {
        const { data, error } = await Authentication.verifyEmailAuthVerifyTokenGet({
          path: { token }
        });

        if (error || !data) {
          setErrorMessage((error as { message?: string }).message ?? 'This link is invalid or has expired.');
          setStatus('error');
          return;
        }

        useAuthStore.getState().setAuth(data.access_token, data.refresh_token);
        setStatus('success');
      } catch {
        setErrorMessage('Something went wrong. Please try again.');
        setStatus('error');
      }
    }

    verify();
  }, [token]);

  useEffect(() => {
    if (status !== 'success') return;

    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, router]);

  return (
    <div className="w-full max-w-sm text-center">
      {status === 'loading' && (
        <>
          <div className="bg-primary/10 mx-auto mb-5 flex size-16 items-center justify-center rounded-full">
            <Loader2 className="text-primary size-8 animate-spin" />
          </div>
          <h1 className="text-foreground text-xl font-bold tracking-tight">Verifying your email…</h1>
          <p className="text-muted-foreground mt-2 text-sm">This will only take a moment.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="bg-primary/10 mx-auto mb-5 flex size-16 items-center justify-center rounded-full">
            <CheckCircle className="text-primary size-8" />
          </div>
          <h1 className="text-foreground text-xl font-bold tracking-tight">Email verified!</h1>
          <p className="text-muted-foreground mt-2 text-sm">Redirecting you to the dashboard in {countdown}…</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="bg-destructive/10 mx-auto mb-5 flex size-16 items-center justify-center rounded-full">
            <XCircle className="text-destructive size-8" />
          </div>
          <h1 className="text-foreground text-xl font-bold tracking-tight">Verification failed</h1>
          <p className="text-muted-foreground mt-2 text-sm">{errorMessage}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button variant="black" asChild>
              <Link href="/auth/resend-verification">Resend verification email</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/login">Back to sign in</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
