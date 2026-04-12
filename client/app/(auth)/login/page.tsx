'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AuthCard } from '../../../components/authentication/auth-card';
import { FormField } from '../../../components/authentication/form-field';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const next = { email: '', password: '' };
    if (!email.trim()) next.email = 'Email is required.';
    if (!password) next.password = 'Password is required.';
    setErrors(next);
    if (next.email || next.password) return;

    setIsLoading(true);
    // TODO: integrate POST /auth/login — expects { email, password }
    // On success: receive verification_token, redirect to /login/verify?token=<verification_token>
    // On 401: setErrors({ ...next, email: 'Invalid email or password.' })
    // On 423: setErrors({ ...next, email: 'Account locked. Try again later.' })
    setTimeout(() => setIsLoading(false), 1000);
  }

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to continue to your account."
      formId="login-form"
      submitLabel="Sign in"
      submittingLabel="Signing in…"
      isLoading={isLoading}
      onSubmit={handleSubmit}
      footer={
        <p className="text-muted-foreground text-center text-sm">
          No account?{' '}
          <Link href="/register" className="text-foreground font-medium underline-offset-4 hover:underline">
            Create one
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
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        action={
          <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground text-xs transition-colors">
            Forgot password?
          </Link>
        }
      />
    </AuthCard>
  );
}
