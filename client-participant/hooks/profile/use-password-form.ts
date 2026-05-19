'use client';

import { useState } from 'react';
import { AccountSettings } from '@/api/sdk.gen';

type PasswordForm = { current: string; next: string; confirm: string };
type ShowState = { current: boolean; next: boolean; confirm: boolean };

export function usePasswordForm() {
  const [form, setForm] = useState<PasswordForm>({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState<ShowState>({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function setValue(key: keyof PasswordForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
    if (form.next.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (form.next !== form.confirm) {
      setError('New passwords do not match.');
      return;
    }
    setSaving(true);

    const { error: apiError } = await AccountSettings.changePasswordUserChangePasswordPost({
      body: { current_password: form.current, new_password: form.next },
    });

    setSaving(false);

    if (apiError) {
      const msg = (apiError as { message?: string } | null)?.message;
      setError(msg ?? 'Failed to change password. Check your current password and try again.');
      return;
    }

    setSuccess(true);
    setForm({ current: '', next: '', confirm: '' });
  }

  return { form, show, saving, error, success, setValue, toggleShow, handleSubmit };
}
