'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AuthFormField } from '@/components/auth/form-field';
import { AuthStatusCard } from '@/components/auth/status-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({ password: '', confirm: '' });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const next = { password: '', confirm: '' };
    if (!password) next.password = 'Password is required.';
    else if (password.length < 8) next.password = 'Must be at least 8 characters.';
    if (!confirm) next.confirm = 'Please confirm your password.';
    else if (password && password !== confirm) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (next.password || next.confirm) return;

    setIsLoading(true);
    // TODO: integrate POST /auth/reset-password/{token} — expects { new_password }
    // On 401: setErrors({ ...next, password: 'Reset link has expired.' })
    // On 400: setErrors({ ...next, password: 'This link has already been used.' })
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
    }, 1000);
  }

  if (success) {
    return (
      <AuthStatusCard title="Password updated" description="Your password was reset. You can now sign in with the new one.">
        <Button asChild className="w-full">
          <Link href="/login">Sign in</Link>
        </Button>
      </AuthStatusCard>
    );
  }

  return (
    <Card className="gap-8 py-8">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl">Set a new password</CardTitle>
        <CardDescription>Choose a strong password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="reset-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
          <input type="hidden" name="token" value={token} />
          <AuthFormField
            id="password"
            label="New password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint="At least 8 characters."
          />
          <AuthFormField
            id="confirm"
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
          />
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-5">
        <Button type="submit" form="reset-form" className="w-full" disabled={isLoading}>
          {isLoading ? 'Updating…' : 'Update password'}
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          Link expired?{' '}
          <Link href="/forgot-password" className="text-foreground font-medium underline-offset-4 hover:underline">
            Request a new one
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
