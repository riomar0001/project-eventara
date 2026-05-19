'use client';

import { useState } from 'react';
import { Auth } from '@/api/sdk.gen';

export function useForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address to continue.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("That doesn't look like a valid email address.");
      return;
    }
    setLoading(true);
    await Auth.forgotPasswordAuthForgotPasswordPost({ body: { email } });
    setLoading(false);
    setSubmitted(true);
  }

  return { email, setEmail, loading, submitted, error, handleSubmit };
}
