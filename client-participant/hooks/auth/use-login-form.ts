'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@/api/sdk.gen';

const VERIFICATION_TOKEN_KEY = 'eventara-login-verification-token';

export function useLoginForm() {
  const router = useRouter();
  const [form, setFormState] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function setField(key: 'email' | 'password', value: string) {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error: apiError } = await Auth.loginAuthLoginPost({
      body: { email: form.email, password: form.password },
    });

    setLoading(false);

    if (apiError || !data) {
      const msg = (apiError as { message?: string } | null)?.message;
      setError(msg ?? 'Invalid email or password.');
      return;
    }

    sessionStorage.setItem(VERIFICATION_TOKEN_KEY, data.verification_token);
    router.push(`/verify-otp?purpose=login&email=${encodeURIComponent(form.email)}`);
  }

  return { form, setField, showPassword, setShowPassword, loading, error, handleSubmit };
}
