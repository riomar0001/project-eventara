import { useState } from 'react';
import { toast } from 'sonner';
import { User } from '@/api/sdk.gen';
import type { AgeGroup, EducationLevel, Gender } from '@/api/types.gen';
import { ONBOARDING_STEPS } from '@/constants/onboarding';
import { PROFILE_ALIAS_MIN_LENGTH, PROFILE_ALIAS_PATTERN } from '@/constants/profile';
import { useAliasAvailability } from '@/hooks/use-alias-availability';
import { decodeTokenUser } from '@/lib/token';
import { useAuthStore } from '@/store/auth-store';

export interface IdentityFields {
  first_name: string;
  last_name: string;
  alias: string;
}

export interface AboutFields {
  age_group: string;
  gender: string;
  education_level: string;
}

export interface ProfileFields {
  occupation: string;
  bio: string;
}

export interface OnboardingFormState extends IdentityFields, AboutFields, ProfileFields {}

export type OnboardingStepErrors = Partial<Record<keyof OnboardingFormState, string>>;

const INITIAL_FORM: OnboardingFormState = {
  first_name: '',
  last_name: '',
  alias: '',
  age_group: '',
  gender: '',
  education_level: '',
  occupation: '',
  bio: ''
};

const TOTAL_STEPS = ONBOARDING_STEPS.length;

function validateStep(step: number, form: OnboardingFormState) {
  const errors: OnboardingStepErrors = {};

  if (step === 1) {
    if (!form.first_name.trim()) errors.first_name = 'First name is required.';
    if (!form.last_name.trim()) errors.last_name = 'Last name is required.';

    if (!form.alias.trim()) {
      errors.alias = 'Nickname is required.';
    } else if (form.alias.length < PROFILE_ALIAS_MIN_LENGTH) {
      errors.alias = `Must be at least ${PROFILE_ALIAS_MIN_LENGTH} characters.`;
    } else if (!PROFILE_ALIAS_PATTERN.test(form.alias)) {
      errors.alias = 'Lowercase letters, numbers, and underscores only.';
    }
  }

  if (step === 2) {
    if (!form.age_group) errors.age_group = 'Please select an age group.';
    if (!form.gender) errors.gender = 'Please select a gender.';
    if (!form.education_level) errors.education_level = 'Please select an education level.';
  }

  return errors;
}

export function useOnboardingForm() {
  const [step, setStep] = useState(1);
  const [animKey, setAnimKey] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [form, setForm] = useState<OnboardingFormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<OnboardingStepErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const { refreshToken, setAuth } = useAuthStore();
  const { aliasStatus } = useAliasAvailability(form.alias);

  function handleChange(fields: Partial<OnboardingFormState>) {
    setForm((current) => ({ ...current, ...fields }));

    const clearedErrors = Object.keys(fields).reduce<OnboardingStepErrors>((current, key) => {
      current[key as keyof OnboardingFormState] = undefined;
      return current;
    }, {});

    setErrors((current) => ({ ...current, ...clearedErrors }));
  }

  function handleNext() {
    const nextErrors = validateStep(step, form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setDirection('forward');
    setAnimKey((current) => current + 1);
    setStep((current) => Math.min(current + 1, TOTAL_STEPS));
  }

  function handleBack() {
    setErrors({});
    setDirection('back');
    setAnimKey((current) => current + 1);
    setStep((current) => Math.max(current - 1, 1));
  }

  async function handleSubmit() {
    setIsSubmitting(true);

    const result = await User.userOnboardingUserOnboardPost({
      body: {
        alias: form.alias,
        first_name: form.first_name,
        last_name: form.last_name,
        age_group: form.age_group as AgeGroup,
        gender: form.gender as Gender,
        education_level: form.education_level as EducationLevel,
        occupation: form.occupation || undefined,
        bio: form.bio || undefined
      },
      throwOnError: false
    });

    setIsSubmitting(false);

    if (result.error || !result.data) {
      const status = (result as { response?: { status?: number } }).response?.status;

      if (status === 409) {
        toast.error('That nickname is already taken. Go back and choose another.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }

      return;
    }

    const newUser = decodeTokenUser(result.data.access_token);
    if (newUser && refreshToken) {
      setAuth(result.data.access_token, refreshToken, newUser);
    }

    setIsDone(true);
  }

  return {
    aliasStatus,
    animKey,
    currentStepMeta: ONBOARDING_STEPS[step - 1],
    direction,
    errors,
    form,
    handleBack,
    handleChange,
    handleNext,
    handleSubmit,
    isDone,
    isNextDisabled: step === 1 && (aliasStatus === 'checking' || aliasStatus === 'taken'),
    isSubmitting,
    step,
    totalSteps: TOTAL_STEPS
  };
}
