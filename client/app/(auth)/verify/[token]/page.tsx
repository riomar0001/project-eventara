'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AuthStatusCard } from '@/components/auth/status-card';
import { Button } from '@/components/ui/button';

type VerifyState = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<VerifyState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    // TODO: integrate GET /auth/verify/{token}
    // On success: receive access_token + refresh_token, redirect to /dashboard
    // On 401: token expired → show error with resend option
    // On 400/404/409: show appropriate error message

    // Simulated loading state for UI preview
    const timer = setTimeout(() => {
      setState('success');
    }, 1200);
    return () => clearTimeout(timer);
  }, [token]);

  if (state === 'loading') {
    return <AuthStatusCard title="Verifying your email…" description="Please wait while we confirm your email address." />;
  }

  if (state === 'error') {
    return (
      <AuthStatusCard title="Verification failed" description={errorMessage || 'The verification link is invalid or has expired.'}>
        <Button asChild className="w-full">
          <Link href="/register">Back to sign up</Link>
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          Need a new link?{' '}
          <Link href="/resend-verification" className="text-foreground font-medium underline-offset-4 hover:underline">
            Resend verification email
          </Link>
        </p>
      </AuthStatusCard>
    );
  }

  return (
    <AuthStatusCard title="Email verified" description="Your email address has been verified. You can now sign in to your account.">
      <Button asChild className="w-full">
        <Link href="/login">Continue to sign in</Link>
      </Button>
    </AuthStatusCard>
  );
}
