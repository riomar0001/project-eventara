'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthFormField } from '@/components/auth/shared/form-field';
import { AuthStatusCard } from '@/components/auth/shared/status-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Authentication } from '@/api/sdk.gen';
import { Loader2 } from 'lucide-react';

const schema = z
  .object({
    password: z.string().min(8, 'Must be at least 8 characters.'),
    confirm: z.string().min(1, 'Please confirm your password.')
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match.',
    path: ['confirm']
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    const result = await Authentication.resetPasswordAuthResetPasswordTokenPost({
      body: { new_password: values.password },
      path: { token },
      throwOnError: false
    });

    if (!result.data) {
      const status = (result as { response?: { status?: number } }).response?.status;
      if (status === 401) {
        setError('root', { message: 'This reset link has expired. Please request a new one.' });
      } else if (status === 400) {
        setError('root', { message: 'This reset link has already been used.' });
      } else if (status === 404) {
        setError('root', { message: 'Account not found.' });
      } else {
        setError('root', { message: 'Something went wrong. Please try again.' });
      }
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <AuthStatusCard title="Password updated" description="Your password was reset. You can now sign in with the new one.">
        <Button asChild className="w-full">
          <Link href="/login">Sign in</Link>
        </Button>
      </AuthStatusCard>
    );
  }

  return (
    <Card className="gap-8 py-8">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl">Set a new password</CardTitle>
        <CardDescription>Choose a strong password for your account.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-40">
        <form id="reset-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <AuthFormField
            id="password"
            label="New password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            hint="At least 8 characters."
            error={errors.password?.message}
            {...register('password')}
          />
          <AuthFormField
            id="confirm"
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.confirm?.message}
            {...register('confirm')}
          />
          {errors.root && <p className="text-destructive text-sm">{errors.root.message}</p>}
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-5">
        <Button type="submit" form="reset-form" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Updating…</> : 'Update password'}
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          Link expired?{' '}
          <Link href="/forgot-password" className="text-foreground font-medium underline-offset-4 hover:underline">
            Request a new one
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
