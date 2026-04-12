'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Resend verification email</CardTitle>
        <CardDescription>Enter your email and we&apos;ll send a new verification link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="resend-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!emailError || undefined}
            />
            {emailError && <p className="text-destructive text-xs">{emailError}</p>}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
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
