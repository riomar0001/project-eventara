'use client';

import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRegisterForm } from '@/hooks/auth/use-register-form';

const INPUT =
  'w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none';

const labelCls = 'mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground';
const errorCls = 'mt-1 text-[12px] text-destructive';

export function RegisterForm() {
  const { form, errors, showPassword, showConfirm, setShowPassword, setShowConfirm, loading, setField, handleSubmit } = useRegisterForm();

  return (
    <div className="rounded-3xl border border-border bg-card px-8 py-8 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-[22px] font-bold tracking-[-0.025em] text-foreground">Create an account</h2>
        <p className="mt-1 text-sm text-muted-foreground">Join the Davao DeFi community.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>First name</label>
            <input className={INPUT} value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} placeholder="Alex" />
            {errors.firstName && <p className={errorCls}>{errors.firstName}</p>}
          </div>
          <div>
            <label className={labelCls}>Last name</label>
            <input className={INPUT} value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} placeholder="Rivera" />
            {errors.lastName && <p className={errorCls}>{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className={labelCls}>Email</label>
          <input type="email" className={INPUT} value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="you@eventara.io" />
          {errors.email && <p className={errorCls}>{errors.email}</p>}
        </div>

        <div>
          <label className={labelCls}>Password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} className={`${INPUT} pr-11`} value={form.password} onChange={(e) => setField('password', e.target.value)} placeholder="Min. 8 characters" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted">
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className={errorCls}>{errors.password}</p>}
        </div>

        <div>
          <label className={labelCls}>Confirm password</label>
          <div className="relative">
            <input type={showConfirm ? 'text' : 'password'} className={`${INPUT} pr-11`} value={form.confirm} onChange={(e) => setField('confirm', e.target.value)} placeholder="Repeat your password" />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted">
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirm && <p className={errorCls}>{errors.confirm}</p>}
        </div>

        <p className="text-[12px] leading-relaxed text-muted-foreground">
          By creating an account you agree to our{' '}
          <span className="cursor-pointer text-primary transition-colors hover:underline">Terms of Service</span>
          {' '}and{' '}
          <span className="cursor-pointer text-primary transition-colors hover:underline">Privacy Policy</span>.
        </p>

        <button type="submit" disabled={loading}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60">
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="mt-6 border-t border-border pt-5 text-center">
        <p className="text-[13.5px] text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary transition-colors hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
