'use client';

import { useState } from 'react';

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
    // TODO: call change-password API
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSuccess(true);
    setForm({ current: '', next: '', confirm: '' });
  }

  return { form, show, saving, error, success, setValue, toggleShow, handleSubmit };
}
