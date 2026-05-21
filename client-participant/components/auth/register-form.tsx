'use client';

import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRegisterForm } from '@/hooks/auth/use-register-form';

const INPUT =
  'w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none';

const labelCls = 'mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground';
const errorCls = 'mt-1 text-[12px] text-destructive';

export function RegisterForm() {
  const { form, errors, showPassword, showConfirm, setShowPassword, setShowConfirm, loading, setField, handleSubmit } = useRegisterForm();

  return (
    <div className="border-border bg-card rounded-3xl border px-8 py-8 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-foreground text-[22px] font-bold tracking-[-0.025em]">Create an account</h2>
        <p className="text-muted-foreground mt-1 text-sm">Join the Davao DeFi community.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" className={INPUT} value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="you@eventara.io" />
          {errors.email && <p className={errorCls}>{errors.email}</p>}
        </div>

        <div>
          <label className={labelCls}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className={`${INPUT} pr-11`}
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              placeholder="Min. 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:bg-muted absolute top-1/2 right-3.5 -translate-y-1/2 rounded-lg p-1 transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className={errorCls}>{errors.password}</p>}
        </div>

        <div>
          <label className={labelCls}>Confirm password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              className={`${INPUT} pr-11`}
              value={form.confirm}
              onChange={(e) => setField('confirm', e.target.value)}
              placeholder="Repeat your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="text-muted-foreground hover:bg-muted absolute top-1/2 right-3.5 -translate-y-1/2 rounded-lg p-1 transition-colors"
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirm && <p className={errorCls}>{errors.confirm}</p>}
        </div>

        <p className="text-muted-foreground text-[12px] leading-relaxed">
          By creating an account you agree to our <span className="text-primary cursor-pointer transition-colors hover:underline">Terms of Service</span> and{' '}
          <span className="text-primary cursor-pointer transition-colors hover:underline">Privacy Policy</span>.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground mt-1 flex w-full items-center justify-center gap-2 rounded-full py-3 font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="border-border mt-6 border-t pt-5 text-center">
        <p className="text-muted-foreground text-[13.5px]">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold transition-colors hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
