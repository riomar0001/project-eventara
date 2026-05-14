'use client';

import { useState } from 'react';

export type ProfileForm = {
  firstName: string;
  lastName: string;
  alias: string;
  occupation: string;
  ageGroup: string;
  gender: string;
  education: string;
  bio: string;
};

const EMPTY: ProfileForm = {
  firstName: '',
  lastName: '',
  alias: '',
  occupation: '',
  ageGroup: '',
  gender: '',
  education: '',
  bio: ''
};

export function useProfileForm() {
  const [form, setForm] = useState<ProfileForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function setField(key: keyof ProfileForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function reset() {
    setForm(EMPTY);
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // TODO: call profile update API
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
  }

  return { form, saving, saved, setField, reset, handleSubmit };
}
