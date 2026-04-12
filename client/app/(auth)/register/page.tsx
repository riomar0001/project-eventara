'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>Start managing your events with Eventara.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="register-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              aria-invalid={!!errors.email || undefined}
            />
            {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password || undefined}
            />
            {errors.password ? (
              <p className="text-destructive text-xs">{errors.password}</p>
            ) : (
              <p className="text-muted-foreground text-xs">At least 8 characters.</p>
            )}
          </div>
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
