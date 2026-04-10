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

const schema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' }
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: FormData) {
    try {
      const { data: result, error } = await Authentication.loginAuthLoginPost({
        body: { email: data.email, password: data.password }
      });

      if (error) {
        toast.error((error as { message?: string }).message ?? 'Invalid email or password');
        return;
      }

      sessionStorage.setItem('otp_token', result!.verification_token);
      router.push('/auth/login/verify');
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">Welcome back,</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Please enter your details</p>
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
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
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

        <Button type="submit" variant="black" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        New to Eventara?{' '}
        <Link href="/auth/register" className="font-medium text-foreground hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
