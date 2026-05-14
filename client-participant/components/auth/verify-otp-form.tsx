'use client';

import { Loader2 } from 'lucide-react';
import { OtpInput } from './otp-input';
import { useVerifyOtp } from '@/hooks/auth/use-verify-otp';

export function VerifyOtpForm() {
  const { digits, loading, error, countdown, inputRefs, purpose, email, setDigit, handleKeyDown, handlePaste, handleSubmit, resend } = useVerifyOtp();

  const isReset = purpose === 'reset';
  const filled = digits.filter(Boolean).length;

  return (
    <div className="rounded-3xl border border-border bg-card px-8 py-8 shadow-2xl">
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary">✉</div>
        <h2 className="text-[22px] font-bold tracking-[-0.025em] text-foreground">{isReset ? 'Enter reset code' : 'Verify your email'}</h2>
        <p className="mx-auto mt-2 max-w-[36ch] text-[13.5px] text-muted-foreground">
          {email ? (
            <>We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>.</>
          ) : (
            'Enter the 6-digit code from your email.'
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <OtpInput digits={digits} inputRefs={inputRefs} onChange={setDigit} onKeyDown={handleKeyDown} onPaste={handlePaste} />

        <div className="flex justify-center gap-1.5">
          {digits.map((d, i) => (
            <div key={i} className={`h-1 w-5 rounded-full transition-all ${d ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>

        {error && <p className="text-center text-[13px] text-destructive">{error}</p>}

        <button type="submit" disabled={loading || filled < 6}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50">
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? 'Verifying…' : isReset ? 'Reset password' : 'Verify email'}
        </button>
      </form>

      <div className="mt-6 border-t border-border pt-5 text-center">
        {countdown > 0 ? (
          <p className="text-[13px] text-muted-foreground">Resend code in <span className="font-mono font-semibold text-foreground">{countdown}s</span></p>
        ) : (
          <button type="button" onClick={resend} className="text-[13.5px] font-semibold text-primary transition-colors hover:underline">
            Resend code
          </button>
        )}
      </div>
    </div>
  );
}
