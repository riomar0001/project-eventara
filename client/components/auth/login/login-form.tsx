'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthFormField } from '@/components/auth/auth-form-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Authentication } from '@/api/sdk.gen';

const schema = z.object({
  email: z.string().min(1, 'Email is required.').email('Enter a valid email.'),
  password: z.string().min(1, 'Password is required.')
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    const result = await Authentication.loginAuthLoginPost({
      body: { email: values.email, password: values.password },
      throwOnError: false
    });

    if (!result.data) {
      const status = (result as { response?: { status?: number } }).response?.status;
      if (status === 401) {
        setError('email', { message: 'Invalid email or password.' });
      } else if (status === 403) {
        setError('email', { message: 'Email not verified. Check your inbox or resend the link.' });
      } else if (status === 423) {
        setError('root', { message: 'Account temporarily locked due to too many failed attempts. Try again later.' });
      } else if (status === 429) {
        setError('root', { message: 'Too many requests. Please wait before trying again.' });
      } else {
        setError('root', { message: 'Something went wrong. Please try again.' });
      }
      return;
    }

    const url = new URL('/login/verify', window.location.origin);
    url.searchParams.set('token', result.data.verification_token);
    if (result.data.debug_otp) url.searchParams.set('debug_otp', result.data.debug_otp);
    router.push(url.pathname + url.search);
  }

  return (
    <Card className="gap-8 py-8">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to continue to your account.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-40">
        <form id="login-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <AuthFormField
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <AuthFormField
            id="password"
            label="Password"
            labelRight={
              <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground text-xs transition-colors">
                Forgot password?
              </Link>
            }
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          {errors.root && <p className="text-destructive text-sm">{errors.root.message}</p>}
          {errors.email?.message?.includes('not verified') && (
            <p className="text-muted-foreground -mt-4 text-sm">
              <Link href="/resend-verification" className="text-foreground font-medium underline-offset-4 hover:underline">
                Resend verification email
              </Link>
            </p>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-5">
        <Button type="submit" form="login-form" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          No account?{' '}
          <Link href="/register" className="text-foreground font-medium underline-offset-4 hover:underline">
            Create one
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
