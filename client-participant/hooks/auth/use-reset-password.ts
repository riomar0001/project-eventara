'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@/api/sdk.gen';

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
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);

    const { error: apiError } = await Auth.resetPasswordAuthResetPasswordTokenPost({
      path: { token },
      body: { new_password: password },
    });

    setLoading(false);

    if (apiError) {
      const msg = (apiError as { message?: string } | null)?.message;
      setError(msg ?? 'Reset failed. The link may have expired. Request a new one.');
      return;
    }

    setSuccess(true);
    setTimeout(() => router.replace('/login'), 2500);
  }

  return { password, setPassword, confirm, setConfirm, showPassword, setShowPassword, showConfirm, setShowConfirm, loading, error, success, handleSubmit };
}
