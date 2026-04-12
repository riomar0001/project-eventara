import { CheckCircle2, XCircle, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { IconCluster } from '@/components/auth/verify/icon-cluster';
import { Button } from '@/components/ui/button';

export function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-10 px-8 py-12">
      <IconCluster icon={Loader2} variant="primary" spin />
      <div className="space-y-3 text-center">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">Verifying your email</h2>
        <p className="text-muted-foreground text-sm">Hang tight, this only takes a moment.</p>
      </div>
    </div>
  );
}

export function SuccessState() {
  return (
    <div className="flex flex-col items-center gap-10 px-8 py-12" style={{ animation: 'step-enter-forward 0.3s ease both' }}>
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

export function ExpiredState() {
  return (
    <>
      <div className="flex flex-col items-center gap-10 px-8 pt-10 pb-6" style={{ animation: 'step-enter-forward 0.3s ease both' }}>
        <IconCluster icon={AlertTriangle} variant="warning" />
        <div className="space-y-1.5 text-center">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">Link expired</h2>
          <p className="text-muted-foreground text-sm">This verification link has expired. Request a new one to continue.</p>
        </div>
      </div>
      <div className="border-border" />
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

export function AlreadyVerifiedState() {
  return (
    <>
      <div className="flex flex-col items-center gap-10 px-8 pt-10 pb-6" style={{ animation: 'step-enter-forward 0.3s ease both' }}>
        <IconCluster icon={CheckCircle2} variant="success" />
        <div className="space-y-1.5 text-center">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">Already verified</h2>
          <p className="text-muted-foreground text-sm">Your email address is already confirmed. You can sign in to your account.</p>
        </div>
      </div>
      <div className="border-border" />
      <div className="px-8 py-6">
        <Button asChild className="w-full">
          <Link href="/login">Continue to sign in</Link>
        </Button>
      </div>
    </>
  );
}

export function InvalidState() {
  return (
    <>
      <div className="flex flex-col items-center gap-10 px-8 pt-10 pb-6" style={{ animation: 'step-enter-forward 0.3s ease both' }}>
        <IconCluster icon={XCircle} variant="destructive" />
        <div className="space-y-1.5 text-center">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">Invalid link</h2>
          <p className="text-muted-foreground text-sm">This verification link is invalid or no longer exists.</p>
        </div>
      </div>
      <div className="border-border" />
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
