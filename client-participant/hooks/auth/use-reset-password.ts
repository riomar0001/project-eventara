'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@/api/sdk.gen';
import { humanizeApiError } from '@/lib/api-error';

type FieldErrors = { password: string; confirm: string };

export function useResetPassword(token: string) {
  const router = useRouter();
  const [passwordRaw, setPasswordRaw] = useState('');
  const [confirmRaw, setConfirmRaw] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({ password: '', confirm: '' });
  const [success, setSuccess] = useState(false);

  function setPassword(v: string) {
    setPasswordRaw(v);
    if (errors.password) setErrors((e) => ({ ...e, password: '' }));
  }

  function setConfirm(v: string) {
    setConfirmRaw(v);
    if (errors.confirm) setErrors((e) => ({ ...e, confirm: '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const nextErrors: FieldErrors = { password: '', confirm: '' };
    if (passwordRaw.length < 8) nextErrors.password = 'Your password needs to be at least 8 characters long.';
    if (passwordRaw !== confirmRaw) nextErrors.confirm = "Those passwords don't match. Please try again.";
    if (nextErrors.password || nextErrors.confirm) {
      setErrors(nextErrors);
      return;
    }
    setLoading(true);

    const { error: apiError } = await Auth.resetPasswordAuthResetPasswordTokenPost({
      path: { token },
      body: { new_password: passwordRaw },
    });

    setLoading(false);

    if (apiError) {
      setError(humanizeApiError((apiError as { message?: string } | null)?.message, 'This reset link has expired or is no longer valid. Please request a new one.'));
      return;
    }

    setSuccess(true);
    setTimeout(() => router.replace('/login'), 2500);
  }

  return {
    password: passwordRaw,
    setPassword,
    confirm: confirmRaw,
    setConfirm,
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,
    loading,
    error,
    errors,
    success,
    handleSubmit,
  };
}
