'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Profile } from '@/api/sdk.gen';
import { humanizeApiError } from '@/lib/api-error';
import type { AgeGroup, Gender, EducationLevel } from '@/api/types.gen';
import { decodeTokenUser } from '@/lib/auth/token';
import { useAuthStore } from '@/store/auth-store';

export type OnboardingForm = {
  firstName: string;
  lastName: string;
  alias: string;
  occupation: string;
  ageGroup: string;
  gender: string;
  educationLevel: string;
  bio: string;
};

const INITIAL: OnboardingForm = {
  firstName: '',
  lastName: '',
  alias: '',
  occupation: '',
  ageGroup: '',
  gender: '',
  educationLevel: '',
  bio: ''
};

export const TOTAL_STEPS = 4;
const REVIEW_STEP = 2;

export function useOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingForm>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function setField<K extends keyof OnboardingForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function goToStep(n: number) {
    setStep(n);
  }

  async function next() {
    if (step === REVIEW_STEP) {
      setLoading(true);
      setSubmitError('');

      const { data, error: apiError } = await Profile.userOnboardingUserOnboardPost({
        body: {
          alias: form.alias,
          first_name: form.firstName,
          last_name: form.lastName,
          age_group: form.ageGroup as AgeGroup,
          gender: form.gender as Gender,
          education_level: form.educationLevel as EducationLevel,
          occupation: form.occupation || null,
          bio: form.bio || null,
        },
      });

      setLoading(false);

      if (apiError || !data) {
        setSubmitError(humanizeApiError((apiError as { message?: string } | null)?.message, "Couldn't save your profile. Please try again."));
        return;
      }

      const freshUser = decodeTokenUser(data.access_token);
      if (freshUser) {
        const store = useAuthStore.getState();
        if (store.refreshToken) {
          store.setAuth(data.access_token, store.refreshToken, { ...store.user, ...freshUser });
        }
      }

      setStep((s) => s + 1);
      return;
    }

    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }

    router.push('/events');
  }

  function back() {
    setStep((s) => s - 1);
  }

  return { step, form, loading, submitError, setField, goToStep, next, back };
}
