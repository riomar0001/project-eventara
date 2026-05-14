'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    // TODO: call register API
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    router.push(`/verify-otp?purpose=register&email=${encodeURIComponent(form.email)}`);
  }

  return { form, errors, showPassword, showConfirm, setShowPassword, setShowConfirm, loading, setField, handleSubmit };
}
