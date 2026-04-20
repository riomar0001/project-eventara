'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthFormField } from '@/components/auth/auth-form-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Authentication } from '@/api/sdk.gen';

const schema = z
  .object({
    email: z.string().min(1, 'Email is required.').email('Enter a valid email.'),
    password: z.string().min(1, 'Password is required.').min(8, 'Must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
    terms: z.literal(true, { message: 'You must accept the terms to continue.' })
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword']
  });

type FormValues = z.infer<typeof schema>;

interface RegisterFormProps {
  onSuccess: (email: string) => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    const result = await Authentication.registerUserAuthRegisterPost({
      body: {
        email: values.email,
        password: values.password,
        accepted_terms_and_privacy_policy: values.terms
      },
      throwOnError: false
    });

    if (!result.data) {
      const status = (result as { response?: { status?: number } }).response?.status;
      if (status === 409) {
        setError('email', { message: 'Email is already registered.' });
      } else {
        setError('root', { message: 'Something went wrong. Please try again.' });
      }
      return;
    }

    onSuccess(values.email);
  }

  return (
    <Card className="gap-8 py-8">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Start managing your events with Eventara.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-40">
        <form id="register-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
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
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            hint="At least 8 characters."
            error={errors.password?.message}
            {...register('password')}
          />
          <AuthFormField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Controller
            control={control}
            name="terms"
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-3">
                  <Checkbox id="terms" checked={!!field.value} onCheckedChange={field.onChange} onBlur={field.onBlur} className="mt-0.5" />
                  <label htmlFor="terms" className="text-muted-foreground cursor-pointer text-sm leading-snug">
                    I agree to the{' '}
                    <Link href="/terms" className="text-foreground font-medium underline-offset-4 hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-foreground font-medium underline-offset-4 hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {errors.terms && <p className="text-destructive text-xs">{errors.terms.message}</p>}
              </div>
            )}
          />

          {errors.root && <p className="text-destructive text-sm">{errors.root.message}</p>}
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-5">
        <Button type="submit" form="register-form" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Creating account…
            </>
          ) : (
            'Create account'
          )}
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-foreground font-medium underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
