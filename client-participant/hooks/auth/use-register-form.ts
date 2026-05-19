'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@/api/sdk.gen';
import { validateRegisterForm } from '@/lib/validators';
import type { RegisterErrors } from '@/lib/validators';

type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirm: string;
};

const EMPTY: RegisterForm = { firstName: '', lastName: '', email: '', password: '', confirm: '' };

export function useRegisterForm() {
  const router = useRouter();
  const [form, setFormState] = useState<RegisterForm>(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [loading, setLoading] = useState(false);

  function setField(key: keyof RegisterForm, value: string) {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateRegisterForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);

    const { error: apiError } = await Auth.registerUserAuthRegisterPost({
      body: {
        email: form.email,
        password: form.password,
        accepted_terms_and_privacy_policy: true,
      },
    });

    setLoading(false);

    if (apiError) {
      const msg = (apiError as { message?: string } | null)?.message;
      setErrors({ email: msg ?? 'Registration failed. This email may already be in use.' });
      return;
    }

    router.push(`/verify-otp?purpose=register&email=${encodeURIComponent(form.email)}`);
  }

  return { form, errors, showPassword, showConfirm, setShowPassword, setShowConfirm, loading, setField, handleSubmit };
}
