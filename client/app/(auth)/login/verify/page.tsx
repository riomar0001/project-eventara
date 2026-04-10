'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Authentication } from '@/api/sdk.gen';
import { OTPInput } from '@/components/authentication/otp-input';
import { Button } from '@/components/ui/button';

export default function LoginVerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('otp_token');
    if (!stored) {
      router.replace('/auth/login');
      return;
    }
    setToken(stored);
  }, [router]);

  const handleVerify = useCallback(async () => {
    if (code.length !== 6 || !token) return;

    setLoading(true);
    try {
      const { error } = await Authentication.loginVerifyAuthLoginVerifyGet({
        body: { token, code }
      });

      if (error) {
        toast.error((error as { message?: string }).message ?? 'Invalid or expired code');
        setCode('');
        return;
      }

      sessionStorage.removeItem('otp_token');
      router.push('/');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [code, token, router]);

  useEffect(() => {
    if (code.length === 6) handleVerify();
  }, [code, token, handleVerify]);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">Check your email</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We sent a 6-digit code to your email address. Enter it below to continue.
        </p>
      </div>

      <div className="space-y-6">
        <OTPInput value={code} onChange={setCode} disabled={loading} />

        <Button
          variant="black"
          className="w-full"
          disabled={code.length !== 6 || loading}
          onClick={handleVerify}
        >
          {loading && <Loader2 className="animate-spin" />}
          {loading ? 'Verifying…' : 'Verify'}
        </Button>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Didn&apos;t receive a code?{' '}
        <Link href="/auth/login" className="font-medium text-foreground hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
