'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthCard } from '../../../components/authentication/auth-card';
import { FormField } from '../../../components/authentication/form-field';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) { setEmailError('Email is required.'); return; }
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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Check your inbox</CardTitle>
          <CardDescription>
            If <span className="text-foreground font-medium">{email}</span> is linked to an account, a reset link was sent. It expires in 1 hour.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            Didn&apos;t receive it?{' '}
            <button type="button" onClick={() => setSubmitted(false)} className="text-foreground font-medium underline-offset-4 hover:underline">
              Try again
            </button>
          </p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your email and we'll send a reset link."
      formId="forgot-form"
      submitLabel="Send reset link"
      submittingLabel="Sending…"
      isLoading={isLoading}
      onSubmit={handleSubmit}
      footer={
        <p className="text-muted-foreground text-center text-sm">
          <Link href="/login" className="text-foreground font-medium underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      <FormField
        id="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={emailError}
      />
    </AuthCard>
  );
}
