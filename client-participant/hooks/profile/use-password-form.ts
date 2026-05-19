'use client';

import { useState } from 'react';
import { AccountSettings } from '@/api/sdk.gen';
import { humanizeApiError } from '@/lib/api-error';

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
      setError('Your new password needs to be at least 8 characters long.');
      return;
    }
    if (form.next !== form.confirm) {
      setError("Those passwords don't match. Please double-check and try again.");
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
  }

  return { form, show, saving, error, success, setValue, toggleShow, handleSubmit };
}
