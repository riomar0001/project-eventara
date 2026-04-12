'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthFormField } from '@/components/auth/form-field';
import { AuthStatusCard } from '@/components/auth/status-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResendVerificationPage() {
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
    // TODO: integrate POST /auth/resend-verification — expects { email }
    // Always returns 200 OK regardless of whether email exists (prevents enumeration)
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
            If <span className="text-foreground font-medium">{email}</span> is associated with an unverified account, a new verification link has been sent.
          </>
        }
      >
        <Button asChild className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </AuthStatusCard>
    );
  }

  return (
    <Card className="gap-8 py-8">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl">Resend verification email</CardTitle>
        <CardDescription>Enter your email and we&apos;ll send a new verification link.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-40">
        <form id="resend-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
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
        <Button type="submit" form="resend-form" className="w-full" disabled={isLoading}>
          {isLoading ? 'Sending…' : 'Send verification link'}
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
