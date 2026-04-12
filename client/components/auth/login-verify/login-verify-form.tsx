'use client';

import { useState, useEffect } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { OtpInput, OTP_LENGTH } from '@/components/auth/login-verify/otp-input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Authentication } from '@/api/sdk.gen';
import { decodeTokenUser } from '@/lib/token';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

const EXPIRY_SECONDS = 10 * 60;

function getOrCreateExpiry(token: string): number {
  const key = `otp-expiry:${token}`;
  const stored = sessionStorage.getItem(key);
  if (stored) {
    const expiry = Number(stored);
    if (!isNaN(expiry)) return expiry;
  }
  const expiry = Date.now() + EXPIRY_SECONDS * 1000;
  sessionStorage.setItem(key, String(expiry));
  return expiry;
}

function secondsUntil(expiry: number): number {
  return Math.max(0, Math.floor((expiry - Date.now()) / 1000));
}

export function LoginVerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const setAuth = useAuthStore((s) => s.setAuth);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [rootError, setRootError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() => {
    if (typeof window === 'undefined' || !token) return null;
    return secondsUntil(getOrCreateExpiry(token));
  });
  const [shake, setShake] = useState(false);

  // Tick the timer every second against the persisted expiry timestamp.
  useEffect(() => {
    if (!token) return;
    const expiry = getOrCreateExpiry(token);
    const id = setInterval(() => {
      const remaining = secondsUntil(expiry);
      setSecondsLeft(remaining);
      if (remaining <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [token]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleDigitsChange = (next: string[]) => {
    setDigits(next);
    setError(null);
  };

  const handleSubmit = async () => {
    const code = digits.join('');
    if (code.length < OTP_LENGTH) {
      setError('Enter all 6 digits.');
      triggerShake();
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setRootError(null);

    const result = await Authentication.loginVerifyAuthLoginVerifyPost({
      body: { token, code },
      throwOnError: false
    });

    setIsSubmitting(false);

    if (!result.data) {
      const status = (result as { response?: { status?: number } }).response?.status;

      if (status === 401) {
        setError('Incorrect or expired code.');
        setDigits(Array(OTP_LENGTH).fill(''));
        setFocusedIndex(0);
        triggerShake();
        return;
      }

      if (status === 400 || status === 404) {
        setRootError('Session expired. Please sign in again.');
        return;
      }

      setRootError('Something went wrong. Please try again.');
      return;
    }

    const user = decodeTokenUser(result.data.access_token);
    if (!user) {
      setRootError('Something went wrong. Please try again.');
      return;
    }

    setAuth(result.data.access_token, result.data.refresh_token, user);
    router.replace('/dashboard');
  };

  const filled = digits.every((d) => d !== '');
  const timerReady = secondsLeft !== null;
  const expired = secondsLeft !== null && secondsLeft <= 0;
  const urgentTime = secondsLeft !== null && secondsLeft <= 60 && secondsLeft > 0;
  const mm = secondsLeft !== null ? String(Math.floor(secondsLeft / 60)).padStart(2, '0') : '--';
  const ss = secondsLeft !== null ? String(secondsLeft % 60).padStart(2, '0') : '--';

  return (
    <Card className="flex flex-col items-center gap-8 px-8 py-10">
      {/* Icon */}

      {/* Heading */}
      <div className="flex flex-col items-center gap-2 text-center">
        <Mail size={50} className="text-primary" />
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="text-muted-foreground max-w-xs text-sm">We sent a 6-digit code to your email. Enter it below to continue.</p>
      </div>

      {/* OTP input + feedback */}
      <div className="flex flex-col items-center gap-4">
        <div style={shake ? { animation: 'otp-shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both' } : undefined}>
          <OtpInput value={digits} onChange={handleDigitsChange} focusedIndex={focusedIndex} onFocusChange={setFocusedIndex} hasError={!!error} />
        </div>

        {error && <p className="text-destructive text-sm font-medium">{error}</p>}
        {rootError && <p className="text-destructive text-sm font-medium">{rootError}</p>}

        {!rootError && timerReady && (
          <div className="flex items-center gap-1.5 text-xs">
            {expired ? (
              <span className="text-destructive font-medium">Code expired</span>
            ) : (
              <>
                <span className={cn('font-medium tabular-nums', urgentTime ? 'text-destructive' : 'text-muted-foreground')}>
                  {mm}:{ss}
                </span>
                <span className="text-muted-foreground">remaining</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex w-full max-w-xs flex-col gap-4">
        <Button onClick={handleSubmit} className="h-11 w-full text-base font-medium" disabled={isSubmitting || !filled || !timerReady || expired}>
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Verifying…
            </>
          ) : (
            'Verify code'
          )}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          <Link href="/login" className="text-foreground font-medium underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes otp-shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-6px); }
          40%, 60% { transform: translateX(6px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </Card>
  );
}
