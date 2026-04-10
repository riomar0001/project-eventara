'use client';

import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

import { Authentication } from '@/api/sdk.gen';
import { Button } from '@/components/ui/button';

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
        const { error } = await Authentication.verifyEmailAuthVerifyTokenGet({
          path: { token }
        });

        if (error) {
          setErrorMessage(
            (error as { message?: string }).message ?? 'This link is invalid or has expired.'
          );
          setStatus('error');
          return;
        }

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
      setCountdown(c => {
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
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Verifying your email…
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">This will only take a moment.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="size-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Email verified!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Redirecting you to the dashboard in {countdown}…
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="size-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Verification failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
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
