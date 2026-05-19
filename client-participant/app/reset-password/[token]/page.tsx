'use client';

import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useResetPassword } from '@/hooks/auth/use-reset-password';
import { MeshBg } from '@/components/shared/mesh-bg';

const INPUT =
  'w-full rounded-xl border border-border bg-background px-4 py-3 pr-11 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none';

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const { password, setPassword, confirm, setConfirm, showPassword, setShowPassword, showConfirm, setShowConfirm, loading, error, success, handleSubmit } =
    useResetPassword(params.token);

  return (
    <main className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <MeshBg />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="from-primary to-primary/80 flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L15 8H12V14H8V8H5L10 2Z" fill="#0a1005" />
            </svg>
          </div>
          <span className="text-foreground text-lg font-bold tracking-[-0.02em]">Eventara</span>
        </div>

        <div className="border-border bg-card rounded-3xl border px-8 py-8 shadow-2xl">
          {success ? (
            <div className="py-4 text-center">
              <div className="bg-primary/10 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
                <CheckCircle2 size={32} className="text-primary" />
              </div>
              <h2 className="text-foreground text-[22px] font-bold tracking-[-0.025em]">Password updated!</h2>
              <p className="text-muted-foreground mt-2 text-[13.5px]">Redirecting you to sign in…</p>
              <Link
                href="/login"
                className="bg-primary text-primary-foreground mt-6 inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow)] transition-all hover:-translate-y-0.5"
              >
                Sign in now
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h2 className="text-foreground text-[22px] font-bold tracking-[-0.025em]">Set new password</h2>
                <p className="text-muted-foreground mt-1 text-[13.5px]">Choose a strong password for your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-muted-foreground mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase">New password</label>
                  <div className="relative">
                    <input
                      className={INPUT}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3.5 -translate-y-1/2 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase">Confirm password</label>
                  <div className="relative">
                    <input
                      className={INPUT}
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat your new password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3.5 -translate-y-1/2 transition-colors"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-destructive text-[13px]">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-primary-foreground flex w-full items-center justify-center gap-2 rounded-full py-3 font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>

              <div className="border-border mt-6 border-t pt-5 text-center">
                <Link href="/login" className="text-muted-foreground hover:text-foreground text-[13px] font-medium transition-colors">
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
