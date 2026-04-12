'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthCard } from '../../../../components/authentication/auth-card';
import { FormField } from '../../../../components/authentication/form-field';

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
    <AuthCard
      title="Set a new password"
      description="Choose a strong password for your account."
      formId="reset-form"
      submitLabel="Update password"
      submittingLabel="Updating…"
      isLoading={isLoading}
      onSubmit={handleSubmit}
      footer={
        <p className="text-muted-foreground text-center text-sm">
          Link expired?{' '}
          <Link href="/forgot-password" className="text-foreground font-medium underline-offset-4 hover:underline">
            Request a new one
          </Link>
        </p>
      }
    >
      <input type="hidden" name="token" value={token} />
      <FormField
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
      <FormField
        id="confirm"
        label="Confirm password"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
      />
    </AuthCard>
  );
}
