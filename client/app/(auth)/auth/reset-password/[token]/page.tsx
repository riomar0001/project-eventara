'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z
  .object({
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string()
  })
  .refine(data => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password']
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { new_password: '', confirm_password: '' }
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: data.new_password })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body.message ?? body.detail ?? 'Failed to reset password.';
        if (res.status === 401) {
          toast.error('This reset link has expired. Please request a new one.');
        } else if (res.status === 400) {
          toast.error('This reset link has already been used. Please request a new one.');
        } else {
          toast.error(message);
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle className="size-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Password reset!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your password has been updated. Redirecting you to sign in…
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">Reset your password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Enter your new password below.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="new_password">
            New password
          </label>
          <div className="relative">
            <Input
              id="new_password"
              type={showNew ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              aria-invalid={!!form.formState.errors.new_password}
              {...form.register('new_password')}
            />
            <button
              type="button"
              onClick={() => setShowNew(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              tabIndex={-1}
            >
              {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {form.formState.errors.new_password && (
            <p className="text-xs text-destructive">{form.formState.errors.new_password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="confirm_password">
            Confirm new password
          </label>
          <div className="relative">
            <Input
              id="confirm_password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              aria-invalid={!!form.formState.errors.confirm_password}
              {...form.register('confirm_password')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {form.formState.errors.confirm_password && (
            <p className="text-xs text-destructive">
              {form.formState.errors.confirm_password.message}
            </p>
          )}
        </div>

        <Button type="submit" variant="black" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Remembered your password?{' '}
        <Link href="/auth/login" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
