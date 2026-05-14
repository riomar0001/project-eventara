'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export function useVerifyOtp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purpose = searchParams.get('purpose') ?? 'register';
  const email = searchParams.get('email') ?? '';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      setError('Enter the full 6-digit code.');
      return;
    }
    setLoading(true);
    // TODO: call verify-otp API
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    router.push(purpose === 'reset' ? '/reset-password' : '/onboarding');
  }

  async function resend() {
    if (countdown > 0) return;
    // TODO: call resend-otp API
    setCountdown(RESEND_SECONDS);
    setDigits(Array(OTP_LENGTH).fill(''));
    setError('');
    inputRefs.current[0]?.focus();
  }

  return { digits, loading, error, countdown, inputRefs, purpose, email, setDigit, handleKeyDown, handlePaste, handleSubmit, resend };
}
