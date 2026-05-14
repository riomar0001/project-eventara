'use client';

import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useLoginForm } from '@/hooks/auth/use-login-form';

const INPUT =
  'w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none';

export function LoginForm() {
  const { form, setField, showPassword, setShowPassword, loading, error, handleSubmit } = useLoginForm();

  return (
    <div className="border-border bg-card rounded-3xl border px-8 py-8 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-foreground text-[22px] font-bold tracking-tight">Sign in</h2>
        <p className="text-muted-foreground mt-1 text-sm">Welcome back to the community.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-muted-foreground mb-1.5 block font-mono text-[11px] tracking-[0.14em] uppercase">Email</label>
          <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} required placeholder="you@eventara.io" className={INPUT} />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">Password</label>
            <Link href="/forgot-password" className="text-primary font-mono text-[11px] transition-colors hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              required
              placeholder="••••••••"
              className={`${INPUT} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:bg-muted absolute top-1/2 right-3.5 -translate-y-1/2 rounded-lg p-1 transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && <p className="text-destructive text-[13px]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground mt-1 flex w-full items-center justify-center gap-2 rounded-full py-3 font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="border-border mt-6 border-t pt-5 text-center">
        <p className="text-muted-foreground text-[13.5px]">
          New to Eventara?{' '}
          <Link href="/register" className="text-primary font-semibold transition-colors hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
