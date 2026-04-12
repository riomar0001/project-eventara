'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthFormField } from '@/components/auth/form-field';
import { AuthStatusCard } from '@/components/auth/status-card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError('Email is required.');
      return;
    }
    setEmailError('');

    setIsLoading(true);
    // TODO: integrate POST /auth/forgot-password — expects { email }
    // Always returns 200 OK regardless of whether the email is registered (prevents enumeration)
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 1000);
  }

  if (submitted) {
    return (
      <AuthStatusCard
        title="Check your inbox"
        description={
          <>
            If <span className="text-foreground font-medium">{email}</span> is linked to an account, a reset link was sent. It expires in 1 hour.
          </>
        }
      >
        <Button asChild className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          Didn&apos;t receive it?{' '}
          <button type="button" onClick={() => setSubmitted(false)} className="text-foreground font-medium underline-offset-4 hover:underline">
            Try again
          </button>
        </p>
      </AuthStatusCard>
    );
  }

  return (
    <Card className="py-8 gap-8">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl">Forgot your password?</CardTitle>
        <CardDescription>Enter your email and we&apos;ll send a reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="forgot-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
          <AuthFormField
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
          />
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-5">
        <Button type="submit" form="forgot-form" className="w-full" disabled={isLoading}>
          {isLoading ? 'Sending…' : 'Send reset link'}
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
