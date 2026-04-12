'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthCard } from '../_components/auth-card';
import { FormField } from '../_components/form-field';

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
    <AuthCard
      title="Check your email"
      description="We sent a 6-digit code to your inbox. It expires in 10 minutes."
      formId="verify-form"
      submitLabel="Verify code"
      submittingLabel="Verifying…"
      isLoading={isLoading}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button type="button" variant="ghost" className="w-full" disabled={isResending} onClick={handleResend}>
            {isResending ? 'Resending…' : "Didn't receive it? Resend"}
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            <Link href="/login" className="text-foreground font-medium underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </p>
        </>
      }
    >
      <input type="hidden" name="token" value={token} />
      <FormField
        id="code"
        label="One-time code"
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        placeholder="000000"
        autoComplete="one-time-code"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        className="text-center text-lg tracking-[0.5em]"
        error={codeError}
      />
    </AuthCard>
  );
}

export default function LoginVerifyPage() {
  return (
    <Suspense>
      <LoginVerifyForm />
    </Suspense>
  );
}
