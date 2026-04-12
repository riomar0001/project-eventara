'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { Authentication } from '@/api/sdk.gen';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type VerifyState = 'loading' | 'success' | 'expired' | 'already_verified' | 'invalid';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [state, setState] = useState<VerifyState>('loading');

  useEffect(() => {
    if (!token) { setState('invalid'); return; }

    Authentication.verifyEmailAuthVerifyTokenGet({ path: { token }, throwOnError: false })
      .then(({ data, error }) => {
        if (data) {
          setAuth(data.access_token, data.refresh_token);
          setState('success');
          setTimeout(() => router.replace('/dashboard'), 1800);
          return;
        }
        const status = error?.response?.status;
        if (status === 401) setState('expired');
        else if (status === 409) setState('already_verified');
        else setState('invalid');
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

/* ── Shared icon cluster ───────────────────────────────────────────────── */

type IconVariant = 'primary' | 'success' | 'destructive' | 'warning';

function IconCluster({ icon: Icon, variant, spin = false }: {
  icon: React.ElementType;
  variant: IconVariant;
  spin?: boolean;
}) {
  const colors: Record<IconVariant, { ring: string; mid: string; inner: string; icon: string }> = {
    primary:     { ring: 'bg-primary/10',     mid: 'bg-primary/10',     inner: 'bg-primary/15 border-primary/25',     icon: 'text-primary' },
    success:     { ring: 'bg-primary/12',     mid: 'bg-primary/10',     inner: 'bg-primary/15 border-primary/30',     icon: 'text-primary' },
    destructive: { ring: 'bg-destructive/10', mid: 'bg-destructive/8',  inner: 'bg-destructive/12 border-destructive/25', icon: 'text-destructive' },
    warning:     { ring: 'bg-amber-400/10',   mid: 'bg-amber-400/8',    inner: 'bg-amber-400/12 border-amber-400/25', icon: 'text-amber-500' },
  };
  const c = colors[variant];

  return (
    <div className="relative flex items-center justify-center">
      <div className={`absolute h-24 w-24 rounded-full ${c.ring}`}
        style={{ animation: 'ping 2.5s cubic-bezier(0,0,0.2,1) infinite' }} />
      <div className={`absolute h-18 w-18 rounded-full ${c.mid}`} />
      <div className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 ${c.inner}`}>
        <Icon className={`h-6 w-6 ${c.icon} ${spin ? 'animate-spin' : ''}`} strokeWidth={1.5} />
      </div>
    </div>
  );
}

/* ── States ────────────────────────────────────────────────────────────── */

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-5 px-8 py-12">
      <IconCluster icon={Loader2} variant="primary" spin />
      <div className="space-y-1.5 text-center">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">Verifying your email</h2>
        <p className="text-muted-foreground text-sm">Hang tight, this only takes a moment.</p>
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center gap-5 px-8 py-12" style={{ animation: 'step-enter-forward 0.3s ease both' }}>
      <IconCluster icon={CheckCircle2} variant="success" />
      <div className="space-y-1.5 text-center">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">Email verified</h2>
        <p className="text-muted-foreground text-sm">You&apos;re all set. Redirecting to your dashboard…</p>
      </div>
      <div className="border-border bg-muted flex w-full items-center justify-between rounded-xl border px-4 py-3">
        <span className="text-muted-foreground text-sm">Taking you to dashboard</span>
        <div className="flex items-center gap-1.5">
          <span className="bg-primary/20 h-1.5 w-1.5 rounded-full" style={{ animation: 'ping 1s ease infinite' }} />
          <ArrowRight className="text-primary h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function ExpiredState() {
  return (
    <>
      <div className="flex flex-col items-center gap-5 px-8 pb-6 pt-10" style={{ animation: 'step-enter-forward 0.3s ease both' }}>
        <IconCluster icon={AlertTriangle} variant="warning" />
        <div className="space-y-1.5 text-center">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">Link expired</h2>
          <p className="text-muted-foreground text-sm">This verification link has expired. Request a new one to continue.</p>
        </div>
      </div>
      <div className="border-border border-t" />
      <div className="flex flex-col gap-3 px-8 py-6">
        <Button asChild className="w-full">
          <Link href="/resend-verification">Resend verification email</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/register">Back to sign up</Link>
        </Button>
      </div>
    </>
  );
}

function AlreadyVerifiedState() {
  return (
    <>
      <div className="flex flex-col items-center gap-5 px-8 pb-6 pt-10" style={{ animation: 'step-enter-forward 0.3s ease both' }}>
        <IconCluster icon={CheckCircle2} variant="success" />
        <div className="space-y-1.5 text-center">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">Already verified</h2>
          <p className="text-muted-foreground text-sm">Your email address is already confirmed. You can sign in to your account.</p>
        </div>
      </div>
      <div className="border-border border-t" />
      <div className="px-8 py-6">
        <Button asChild className="w-full">
          <Link href="/login">Continue to sign in</Link>
        </Button>
      </div>
    </>
  );
}

function InvalidState() {
  return (
    <>
      <div className="flex flex-col items-center gap-5 px-8 pb-6 pt-10" style={{ animation: 'step-enter-forward 0.3s ease both' }}>
        <IconCluster icon={XCircle} variant="destructive" />
        <div className="space-y-1.5 text-center">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">Invalid link</h2>
          <p className="text-muted-foreground text-sm">This verification link is invalid or no longer exists.</p>
        </div>
      </div>
      <div className="border-border border-t" />
      <div className="flex flex-col gap-3 px-8 py-6">
        <Button asChild className="w-full">
          <Link href="/register">Back to sign up</Link>
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          Have an account?{' '}
          <Link href="/login" className="text-foreground font-medium underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}
