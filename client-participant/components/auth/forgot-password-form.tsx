'use client';

import Link from 'next/link';
import { CheckCircle2, Loader2, MailOpen } from 'lucide-react';
import { useForgotPassword } from '@/hooks/auth/use-forgot-password';

const INPUT =
  'w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none';

export function ForgotPasswordForm() {
  const { email, setEmail, loading, submitted, error, handleSubmit } = useForgotPassword();

  if (submitted) {
    return (
      <div className="rounded-3xl border border-border bg-card px-8 py-10 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <MailOpen size={30} className="text-primary" />
        </div>
        <h2 className="text-[22px] font-bold tracking-[-0.025em] text-foreground">Check your inbox</h2>
        <p className="mx-auto mt-2 max-w-[34ch] text-[13.5px] text-muted-foreground">
          We sent a 6-digit code to{' '}
          <span className="font-semibold text-foreground">{email}</span>.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link href={`/verify-otp?purpose=reset&email=${encodeURIComponent(email)}`}
            className="flex w-full items-center justify-center rounded-full bg-primary py-3 font-semibold text-primary-foreground shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5">
            Enter code
          </Link>
          <Link href="/login"
            className="flex w-full items-center justify-center rounded-full border border-border py-3 text-sm font-semibold text-muted-foreground transition-all hover:border-muted-foreground">
            Back to sign in
          </Link>
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5">
          <CheckCircle2 size={13} className="text-primary" />
          <span className="text-[12px] text-muted-foreground">Didn&apos;t receive it? Check your spam folder.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card px-8 py-8 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-[22px] font-bold tracking-[-0.025em] text-foreground">Forgot your password?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset code.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">Email address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@eventara.io" className={INPUT} />
          {error && <p className="mt-1 text-[12px] text-destructive">{error}</p>}
        </div>

        <button type="submit" disabled={loading}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60">
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? 'Sending…' : 'Send reset code'}
        </button>
      </form>

      <div className="mt-6 border-t border-border pt-5 text-center">
        <Link href="/login" className="text-[13.5px] font-semibold text-muted-foreground transition-colors hover:underline">← Back to sign in</Link>
      </div>
    </div>
  );
}
