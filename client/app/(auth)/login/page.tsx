'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthFormField } from '@/components/auth/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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
    <Card className="gap-8 py-8">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl">Welcome!</CardTitle>
        <CardDescription>Sign in to continue to your account.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-40">
        <form id="login-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
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
            labelRight={
              <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground text-xs transition-colors">
                Forgot password?
              </Link>
            }
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-5">
        <Button type="submit" form="login-form" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          No account?{' '}
          <Link href="/register" className="text-foreground font-medium underline-offset-4 hover:underline">
            Create one
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
