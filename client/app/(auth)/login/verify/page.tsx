'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

function LoginVerifyForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [codeError, setCodeError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!code) { setCodeError('Code is required.'); return; }
    if (code.length !== 6) { setCodeError('Enter the full 6-digit code.'); return; }
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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Check your email</CardTitle>
        <CardDescription>We sent a 6-digit code to your inbox. It expires in 10 minutes.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="verify-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          <div className="flex flex-col gap-1">
            <label htmlFor="code" className="text-sm font-medium">
              One-time code
            </label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="text-center tracking-[0.5em] text-lg"
              aria-invalid={!!codeError || undefined}
            />
            {codeError && <p className="text-destructive text-xs">{codeError}</p>}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
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
