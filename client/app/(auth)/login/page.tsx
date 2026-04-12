'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Authentication } from '@/api/sdk.gen';

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
      router.push('/login/verify');
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-foreground text-[1.75rem] font-bold tracking-tight">Welcome back,</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">Please enter your details</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-foreground text-sm font-medium" htmlFor="email">
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
          {form.formState.errors.email && <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-foreground text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground text-xs">
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
              onClick={() => setShowPassword((s) => !s)}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {form.formState.errors.password && <p className="text-destructive text-xs">{form.formState.errors.password.message}</p>}
        </div>

        <Button type="submit" variant="default" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-sm">
        New to Eventara?{' '}
        <Link href="/register" className="text-foreground font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
