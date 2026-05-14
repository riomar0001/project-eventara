'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type OnboardingForm = {
  firstName: string;
  lastName: string;
  alias: string;
  occupation: string;
  ageGroup: string;
  gender: string;
  bio: string;
};

const INITIAL: OnboardingForm = {
  firstName: '',
  lastName: '',
  alias: '',
  occupation: '',
  ageGroup: '',
  gender: '',
  bio: ''
};

export const TOTAL_STEPS = 4;
const REVIEW_STEP = 2;

export function useOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingForm>(INITIAL);
  const [loading, setLoading] = useState(false);

  function setField<K extends keyof OnboardingForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function goToStep(n: number) {
    setStep(n);
  }

  async function next() {
    if (step === REVIEW_STEP) {
      setLoading(true);
      // TODO: call profile create API
      await new Promise((r) => setTimeout(r, 800));
      setLoading(false);
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

  return { step, form, loading, setField, goToStep, next, back };
}
