'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Authentication } from '@/api/sdk.gen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string()
  })
  .refine(data => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password']
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirm_password: '' }
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: FormData) {
    try {
      const { error } = await Authentication.registerUserAuthRegisterPost({
        body: { email: data.email, password: data.password }
      });

      if (error) {
        toast.error((error as { message?: string }).message ?? 'Registration failed');
        return;
      }

      toast.success('Account created! Please check your email to verify your account.');
      router.push('/auth/login');
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">Create an account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Start managing your events today</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!form.formState.errors.email}
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              aria-invalid={!!form.formState.errors.password}
              {...form.register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="confirm_password">
            Confirm password
          </label>
          <div className="relative">
            <Input
              id="confirm_password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Re-enter your password"
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
