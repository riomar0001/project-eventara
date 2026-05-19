'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Auth } from '@/api/sdk.gen';
import { humanizeApiError } from '@/lib/api-error';
import { decodeTokenUser } from '@/lib/auth/token';
import { useAuthStore } from '@/store/auth-store';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;
const VERIFICATION_TOKEN_KEY = 'eventara-login-verification-token';

export function useVerifyOtp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purpose = searchParams.get('purpose') ?? 'register';
  const email = searchParams.get('email') ?? '';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const setDigit = useCallback((index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setError('');
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    setDigits((prev) => {
      const next = [...prev];
      pasted.split('').forEach((ch, i) => {
        next[i] = ch;
      });
      return next;
    });
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }
    setLoading(true);
    setError('');

    const verificationToken = sessionStorage.getItem(VERIFICATION_TOKEN_KEY);
    if (!verificationToken) {
      setError('Your session has expired. Please sign in again.');
      setLoading(false);
      router.replace('/login');
      return;
    }

    const { data, error: apiError } = await Auth.loginVerifyAuthLoginVerifyPost({
      body: { token: verificationToken, code },
    });

    setLoading(false);

    if (apiError || !data) {
      setError(humanizeApiError((apiError as { message?: string } | null)?.message, 'That code is incorrect or has expired. Please try again.'));
      return;
    }

    sessionStorage.removeItem(VERIFICATION_TOKEN_KEY);
    const user = decodeTokenUser(data.access_token);
    if (!user) {
      setError('Something went wrong signing you in. Please try again.');
      return;
    }

    useAuthStore.getState().setAuth(data.access_token, data.refresh_token, user);
    router.replace(user.doneOnboarding ? '/events' : '/onboarding');
  }

  async function resend() {
    if (countdown > 0) return;
    setResendSuccess(false);

    if (purpose === 'register') {
      await Auth.resendVerificationAuthResendVerificationPost({ body: { email } });
      setCountdown(RESEND_SECONDS);
      setResendSuccess(true);
      return;
    }

    const verificationToken = sessionStorage.getItem(VERIFICATION_TOKEN_KEY);
    if (!verificationToken) {
      router.replace('/login');
      return;
    }

    const { data } = await Auth.resendOtpAuthLoginResendOtpPost({ body: { token: verificationToken } });
    if (data?.verification_token) {
      sessionStorage.setItem(VERIFICATION_TOKEN_KEY, data.verification_token);
    }
    setCountdown(RESEND_SECONDS);
    setDigits(Array(OTP_LENGTH).fill(''));
    setError('');
    inputRefs.current[0]?.focus();
  }

  return { digits, loading, error, countdown, inputRefs, purpose, email, resendSuccess, setDigit, handleKeyDown, handlePaste, handleSubmit, resend };
}
