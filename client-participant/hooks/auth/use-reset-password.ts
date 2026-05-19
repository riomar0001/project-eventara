'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@/api/sdk.gen';
import { humanizeApiError } from '@/lib/api-error';

export function useResetPassword(token: string) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Your password needs to be at least 8 characters long.');
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match. Please try again.");
      return;
    }
    setLoading(true);

    const { error: apiError } = await Auth.resetPasswordAuthResetPasswordTokenPost({
      path: { token },
      body: { new_password: password },
    });

    setLoading(false);

    if (apiError) {
      setError(humanizeApiError((apiError as { message?: string } | null)?.message, 'This reset link has expired or is no longer valid. Please request a new one.'));
      return;
    }

    setSuccess(true);
    setTimeout(() => router.replace('/login'), 2500);
  }

  return { password, setPassword, confirm, setConfirm, showPassword, setShowPassword, showConfirm, setShowConfirm, loading, error, success, handleSubmit };
}
