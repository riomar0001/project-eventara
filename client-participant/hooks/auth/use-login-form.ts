'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type FormState = { email: string; password: string };

export function useLoginForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function setField(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    // TODO: call Auth API
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    router.push('/events');
  }

  return { form, setField, showPassword, setShowPassword, loading, error, handleSubmit };
}
