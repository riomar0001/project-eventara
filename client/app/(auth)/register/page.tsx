'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthFormField } from '@/components/auth/form-field';
import { AuthStatusCard } from '@/components/auth/status-card';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const next = { email: '', password: '' };
    if (!email.trim()) next.email = 'Email is required.';
    if (!password) next.password = 'Password is required.';
    else if (password.length < 8) next.password = 'Must be at least 8 characters.';
    setErrors(next);
    if (next.email || next.password) return;

    setIsLoading(true);
    // TODO: integrate POST /auth/register — expects { email, password }
    // On 409: setErrors({ ...next, email: 'Email is already registered.' })
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 1000);
  }

  if (submitted) {
    return (
      <AuthStatusCard
        title="Verify your email"
        description={
          <>
            We sent a link to <span className="text-foreground font-medium">{email}</span>. Click it to activate your account.
          </>
        }
      >
        <p className="text-muted-foreground text-center text-sm">
          Wrong email?{' '}
          <button type="button" onClick={() => setSubmitted(false)} className="text-foreground font-medium underline-offset-4 hover:underline">
            Go back
          </button>
        </p>
      </AuthStatusCard>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>Start managing your events with Eventara.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="register-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthFormField
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <AuthFormField
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint="At least 8 characters."
          />
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button type="submit" form="register-form" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account…' : 'Create account'}
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
