'use client';

import { useState } from 'react';
import { AccountSettings } from '@/api/sdk.gen';
import { humanizeApiError } from '@/lib/api-error';

type PasswordForm = { current: string; next: string; confirm: string };
type ShowState = { current: boolean; next: boolean; confirm: boolean };
type FieldErrors = { current: string; next: string; confirm: string };

export function usePasswordForm() {
  const [form, setForm] = useState<PasswordForm>({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState<ShowState>({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({ current: '', next: '', confirm: '' });
  const [success, setSuccess] = useState(false);

  function setValue(key: keyof PasswordForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
    setError('');
    setSuccess(false);
  }

  function toggleShow(key: keyof ShowState) {
    setShow((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    const nextErrors: FieldErrors = { current: '', next: '', confirm: '' };
    if (form.next.length < 8) nextErrors.next = 'Your new password needs to be at least 8 characters long.';
    if (form.next !== form.confirm) nextErrors.confirm = "Those passwords don't match. Please double-check and try again.";
    if (nextErrors.next || nextErrors.confirm) {
      setErrors(nextErrors);
      return;
    }
    setSaving(true);

    const { error: apiError } = await AccountSettings.changePasswordUserChangePasswordPost({
      body: { current_password: form.current, new_password: form.next },
    });

    setSaving(false);

    if (apiError) {
      setError(humanizeApiError((apiError as { message?: string } | null)?.message, "Couldn't update your password. Make sure your current password is correct and try again."));
      return;
    }

    setSuccess(true);
    setForm({ current: '', next: '', confirm: '' });
    setErrors({ current: '', next: '', confirm: '' });
  }

  return { form, show, saving, error, errors, success, setValue, toggleShow, handleSubmit };
}
