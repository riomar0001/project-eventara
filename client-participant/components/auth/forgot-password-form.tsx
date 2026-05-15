'use client';

import { CheckCircle2, Loader2, MailOpen } from 'lucide-react';
import Link from 'next/link';
import { useForgotPassword } from '@/hooks/auth/use-forgot-password';

const INPUT =
  'w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none';

export function ForgotPasswordForm() {
  const { email, setEmail, loading, submitted, error, handleSubmit } = useForgotPassword();

  if (submitted) {
    return (
      <div className="border-border bg-card rounded-3xl border px-8 py-10 text-center shadow-2xl">
        <div className="bg-primary/10 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
          <MailOpen size={30} className="text-primary" />
        </div>
        <h2 className="text-foreground text-[22px] font-bold tracking-[-0.025em]">Check your inbox</h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-[34ch] text-[13.5px]">
          We sent a 6-digit code to <span className="text-foreground font-semibold">{email}</span>.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={`/verify-otp?purpose=reset&email=${encodeURIComponent(email)}`}
            className="bg-primary text-primary-foreground flex w-full items-center justify-center rounded-full py-3 font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5"
          >
            Enter code
          </Link>
          <Link
            href="/login"
            className="border-border text-muted-foreground hover:border-muted-foreground flex w-full items-center justify-center rounded-full border py-3 text-sm font-semibold transition-all"
          >
            Back to sign in
          </Link>
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5">
          <CheckCircle2 size={13} className="text-primary" />
          <span className="text-muted-foreground text-[12px]">Didn&apos;t receive it? Check your spam folder.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border bg-card rounded-3xl border px-8 py-8 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-foreground text-[22px] font-bold tracking-[-0.025em]">Forgot your password?</h2>
        <p className="text-muted-foreground mt-1 text-sm">Enter your email and we&apos;ll send you a reset code.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-muted-foreground mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase">Email address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@eventara.io" className={INPUT} />
          {error && <p className="text-destructive mt-1 text-[12px]">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground mt-1 flex w-full items-center justify-center gap-2 rounded-full py-3 font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? 'Sending…' : 'Send reset code'}
        </button>
      </form>

      <div className="border-border mt-6 border-t pt-5 text-center">
        <Link href="/login" className="text-muted-foreground text-[13.5px] font-semibold transition-colors hover:underline">
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
