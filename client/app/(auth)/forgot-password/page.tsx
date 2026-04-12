'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthFormField } from '@/components/auth/shared/form-field';
import { AuthStatusCard } from '@/components/auth/shared/status-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Authentication } from '@/api/sdk.gen';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  email: z.string().min(1, 'Email is required.').email('Enter a valid email.')
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    const result = await Authentication.forgotPasswordAuthForgotPasswordPost({
      body: { email: values.email },
      throwOnError: false
    });

    if (!result.data) {
      setError('root', { message: 'Something went wrong. Please try again.' });
      return;
    }

    setSubmittedEmail(values.email);
  }

  if (submittedEmail) {
    return (
      <AuthStatusCard
        title="Check your inbox"
        description={
          <>
            If <span className="text-foreground font-medium">{submittedEmail}</span> is linked to an account, a reset link was sent. It expires in 1 hour.
          </>
        }
      >
        <Button asChild className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          Didn&apos;t receive it?{' '}
          <button type="button" onClick={() => setSubmittedEmail(null)} className="text-foreground font-medium underline-offset-4 hover:underline">
            Try again
          </button>
        </p>
      </AuthStatusCard>
    );
  }

  return (
    <Card className="gap-8 py-8">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl">Forgot your password?</CardTitle>
        <CardDescription>Enter your email and we&apos;ll send a reset link.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-40">
        <form id="forgot-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <AuthFormField
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          {errors.root && <p className="text-destructive text-sm">{errors.root.message}</p>}
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-5">
        <Button type="submit" form="forgot-form" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : 'Send reset link'}
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          <Link href="/login" className="text-foreground font-medium underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
