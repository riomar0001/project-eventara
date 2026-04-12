'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Password updated</CardTitle>
          <CardDescription>Your password was reset. You can now sign in with the new one.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/login">Sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Set a new password</CardTitle>
        <CardDescription>Choose a strong password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="reset-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium">
              New password
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
          <div className="flex flex-col gap-1">
            <label htmlFor="confirm" className="text-sm font-medium">
              Confirm password
            </label>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={!!errors.confirm || undefined}
            />
            {errors.confirm && <p className="text-destructive text-xs">{errors.confirm}</p>}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
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
