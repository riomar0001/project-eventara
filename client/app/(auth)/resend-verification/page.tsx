'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthCard } from '../_components/auth-card';
import { FormField } from '../_components/form-field';

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) { setEmailError('Email is required.'); return; }
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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Check your inbox</CardTitle>
          <CardDescription>
            If <span className="text-foreground font-medium">{email}</span> is associated with an unverified account, a new verification link has been sent.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <AuthCard
      title="Resend verification email"
      description="Enter your email and we'll send a new verification link."
      formId="resend-form"
      submitLabel="Send verification link"
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
