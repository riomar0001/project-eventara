'use client';

import { Loader2, Mail } from 'lucide-react';
import { useVerifyOtp } from '@/hooks/auth/use-verify-otp';
import { OtpInput } from './otp-input';

export function VerifyOtpForm() {
  const { digits, loading, error, countdown, inputRefs, purpose, email, resendSuccess, setDigit, handleKeyDown, handlePaste, handleSubmit, resend } =
    useVerifyOtp();

  const isRegister = purpose === 'register';
  const filled = digits.filter(Boolean).length;

  if (isRegister) {
    return (
      <div className="border-border bg-card rounded-3xl border px-8 py-8 shadow-2xl">
        <div className="mb-7 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl">
            <Mail size={28} />
          </div>
          <h2 className="text-foreground text-[22px] font-bold tracking-[-0.025em]">Check your inbox</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-[36ch] text-[13.5px]">
            We sent a verification link to{' '}
            {email ? <span className="text-foreground font-semibold">{email}</span> : 'your email address'}. Click the link to verify your account.
          </p>
        </div>

        {resendSuccess && (
          <p className="text-primary mb-4 text-center text-[13px] font-medium">Verification email resent. Check your inbox.</p>
        )}

        <div className="border-border border-t pt-5 text-center">
          {countdown > 0 ? (
            <p className="text-muted-foreground text-[13px]">
              Resend in <span className="text-foreground font-mono font-semibold">{countdown}s</span>
            </p>
          ) : (
            <button type="button" onClick={resend} className="text-primary text-[13.5px] font-semibold transition-colors hover:underline">
              Resend verification email
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-border bg-card rounded-3xl border px-8 py-8 shadow-2xl">
      <div className="mb-7 text-center">
        <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl">✉</div>
        <h2 className="text-foreground text-[22px] font-bold tracking-[-0.025em]">Enter your code</h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-[36ch] text-[13.5px]">
          {email ? (
            <>
              We sent a 6-digit code to <span className="text-foreground font-semibold">{email}</span>.
            </>
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

        {error && <p className="text-destructive text-center text-[13px]">{error}</p>}

        <button
          type="submit"
          disabled={loading || filled < 6}
          className="bg-primary text-primary-foreground flex w-full items-center justify-center gap-2 rounded-full py-3 font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? 'Verifying…' : 'Verify and sign in'}
        </button>
      </form>

      <div className="border-border mt-6 border-t pt-5 text-center">
        {countdown > 0 ? (
          <p className="text-muted-foreground text-[13px]">
            Resend code in <span className="text-foreground font-mono font-semibold">{countdown}s</span>
          </p>
        ) : (
          <button type="button" onClick={resend} className="text-primary text-[13.5px] font-semibold transition-colors hover:underline">
            Resend code
          </button>
        )}
      </div>
    </div>
  );
}
