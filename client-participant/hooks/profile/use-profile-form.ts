'use client';

import { useState, useEffect } from 'react';
import { AccountSettings } from '@/api/sdk.gen';
import { humanizeApiError } from '@/lib/api-error';
import type { AgeGroup, Gender, EducationLevel } from '@/api/types.gen';
import { decodeTokenUser } from '@/lib/auth/token';
import { useAuthStore } from '@/store/auth-store';

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

function formFromUser(user: ReturnType<typeof useAuthStore.getState>['user']): ProfileForm {
  return {
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    alias: user?.alias ?? '',
    occupation: user?.occupation ?? '',
    ageGroup: user?.ageGroup ?? '',
    gender: user?.gender ?? '',
    education: user?.educationLevel ?? '',
    bio: user?.bio ?? '',
  };
}

export function useProfileForm() {
  const user = useAuthStore((s) => s.user);
  const [form, setFormState] = useState<ProfileForm>(() => formFromUser(user));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormState(formFromUser(user));
  }, [user]);

  function setField(key: keyof ProfileForm, value: string) {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setError('');
  }

  function reset() {
    setFormState(formFromUser(user));
    setSaved(false);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const { data, error: apiError } = await AccountSettings.updateProfileUserProfilePatch({
      body: {
        alias: form.alias,
        first_name: form.firstName,
        last_name: form.lastName,
        age_group: form.ageGroup as AgeGroup,
        gender: form.gender as Gender,
        education_level: form.education as EducationLevel,
        occupation: form.occupation || null,
        bio: form.bio || null,
      },
    });

    setSaving(false);

    if (apiError || !data) {
      setError(humanizeApiError((apiError as { message?: string } | null)?.message, "Couldn't save your profile. Please try again."));
      return;
    }

    const freshUser = decodeTokenUser(data.access_token);
    if (freshUser) {
      const store = useAuthStore.getState();
      if (store.refreshToken) {
        store.setAuth(data.access_token, store.refreshToken, { ...store.user, ...freshUser });
      }
    }

    setSaved(true);
  }

  return { form, saving, saved, error, setField, reset, handleSubmit };
}
