'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthCard } from '../../../components/authentication/auth-card';
import { FormField } from '../../../components/authentication/form-field';

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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Verify your email</CardTitle>
          <CardDescription>
            We sent a link to <span className="text-foreground font-medium">{email}</span>. Click it to activate your account.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <p className="text-muted-foreground text-center text-sm">
            Wrong email?{' '}
            <button type="button" onClick={() => setSubmitted(false)} className="text-foreground font-medium underline-offset-4 hover:underline">
              Go back
            </button>
          </p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <AuthCard
      title="Create an account"
      description="Start managing your events with Eventara."
      formId="register-form"
      submitLabel="Create account"
      submittingLabel="Creating account…"
      isLoading={isLoading}
      onSubmit={handleSubmit}
      footer={
        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-foreground font-medium underline-offset-4 hover:underline">
            Sign in
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
        error={errors.email}
      />
      <FormField
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
    </AuthCard>
  );
}
