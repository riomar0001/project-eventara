'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AuthFormField } from '@/components/auth/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function LoginVerifyForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [codeError, setCodeError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!code) {
      setCodeError('Code is required.');
      return;
    }
    if (code.length !== 6) {
      setCodeError('Enter the full 6-digit code.');
      return;
    }
    setCodeError('');

    setIsLoading(true);
    // TODO: integrate POST /auth/login/verify — expects { token, code }
    // On 401: setCodeError('Incorrect or expired code.')
    // On 400: setCodeError('Session expired. Go back and sign in again.')
    setTimeout(() => setIsLoading(false), 1000);
  }

  function handleResend() {
    setIsResending(true);
    // TODO: re-trigger POST /auth/login with stored credentials, or navigate back to /login
    setTimeout(() => {
      setIsResending(false);
      toast.success('Code resent', { description: 'Check your inbox for a new code.' });
    }, 1000);
  }

  return (
    <Card className="gap-8 py-8">
      <CardHeader className="gap-3">
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription>We sent a 6-digit code to your inbox. It expires in 10 minutes.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-40">
        <form id="verify-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
          <input type="hidden" name="token" value={token} />
          <AuthFormField
            id="code"
            label="One-time code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            error={codeError}
            inputClassName="text-center text-lg tracking-[0.5em]"
          />
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-5">
        <Button type="submit" form="verify-form" className="w-full" disabled={isLoading}>
          {isLoading ? 'Verifying…' : 'Verify code'}
        </Button>
        <Button type="button" variant="ghost" className="w-full" disabled={isResending} onClick={handleResend}>
          {isResending ? 'Resending…' : "Didn't receive it? Resend"}
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

export default function LoginVerifyPage() {
  return (
    <Suspense>
      <LoginVerifyForm />
    </Suspense>
  );
}
