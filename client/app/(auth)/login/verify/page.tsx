'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthFormField } from '@/components/auth/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Authentication } from '@/api/sdk.gen';
import { decodeTokenUser } from '@/lib/token';
import { useAuthStore } from '@/store/auth-store';

const schema = z.object({
  code: z.string().min(1, 'Code is required.').length(6, 'Enter the full 6-digit code.').regex(/^\d+$/, 'Code must be numeric.')
});

type FormValues = z.infer<typeof schema>;

function LoginVerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    const result = await Authentication.loginVerifyAuthLoginVerifyPost({
      body: { token, code: values.code },
      throwOnError: false
    });

    if (!result.data) {
      const status = (result as { response?: { status?: number } }).response?.status;
      if (status === 401) {
        setError('code', { message: 'Incorrect or expired code.' });
      } else if (status === 400 || status === 404) {
        setError('root', { message: 'Session expired. Please sign in again.' });
      } else {
        setError('root', { message: 'Something went wrong. Please try again.' });
      }
      return;
    }

    const user = decodeTokenUser(result.data.access_token);
    if (!user) {
      setError('root', { message: 'Something went wrong. Please try again.' });
      return;
    }

    setAuth(result.data.access_token, result.data.refresh_token, user);
    router.replace('/dashboard');
  }

  return (
    <Card className="gap-8 py-8">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription>We sent a 6-digit code to your inbox. It expires in 10 minutes.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-40">
        <form id="verify-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <AuthFormField
            id="code"
            label="One-time code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            autoComplete="one-time-code"
            error={errors.code?.message}
            inputClassName="text-center text-lg tracking-[0.5em]"
            {...register('code', {
              onChange: (e) => {
                const digits = e.target.value.replace(/\D/g, '');
                setValue('code', digits, { shouldValidate: false });
              }
            })}
          />
          {errors.root && <p className="text-destructive text-sm">{errors.root.message}</p>}
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-5">
        <Button type="submit" form="verify-form" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying…' : 'Verify code'}
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

export default function LoginVerifyPage() {
  return (
    <Suspense>
      <LoginVerifyForm />
    </Suspense>
  );
}
