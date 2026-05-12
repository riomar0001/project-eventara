import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { type AliasStatus, normalizeAlias, useAliasAvailability } from '@/hooks/onboarding/use-alias-availability';
import { AccountSettings, Profile } from '@/api/sdk.gen';
import type { AgeGroup, EducationLevel, Gender } from '@/api/types.gen';
import { PROFILE_ALIAS_MIN_LENGTH, PROFILE_ALIAS_PATTERN, PROFILE_COMPLETION_FIELDS } from '@/constants/user/profile';
import { decodeTokenUser, rememberProfileAvatar } from '@/lib/auth/token';
import { getProfileCompletion } from '@/lib/user/profile';
import { type AuthUser, useAuthStore } from '@/store/auth-store';

export interface ProfileFormState {
  alias: string;
  firstName: string;
  lastName: string;
  ageGroup: string;
  gender: string;
  educationLevel: string;
  occupation: string;
  bio: string;
}

export type ProfileFormErrors = Partial<Record<keyof ProfileFormState, string>>;

function getInitialForm(user: AuthUser | null): ProfileFormState {
  return {
    alias: user?.alias ?? '',
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    ageGroup: user?.ageGroup ?? '',
    gender: user?.gender ?? '',
    educationLevel: user?.educationLevel ?? '',
    occupation: user?.occupation ?? '',
    bio: user?.bio ?? ''
  };
}

function normalizeOptionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function getDraftCompletion(form: ProfileFormState) {
  const completedFields = PROFILE_COMPLETION_FIELDS.filter((field) => Boolean(form[field].trim())).length;
  return Math.round((completedFields / PROFILE_COMPLETION_FIELDS.length) * 100);
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const maybeDetail = (error as { detail?: unknown }).detail;
    if (typeof maybeDetail === 'string') return maybeDetail;
  }

  return 'Something went wrong. Please try again.';
}

function validateProfileForm(form: ProfileFormState, requiresOnboardingFields: boolean) {
  const errors: ProfileFormErrors = {};
  const alias = normalizeAlias(form.alias);

  if (requiresOnboardingFields && !alias) {
    errors.alias = 'Alias is required.';
  } else if (alias && alias.length < PROFILE_ALIAS_MIN_LENGTH) {
    errors.alias = `Alias must be at least ${PROFILE_ALIAS_MIN_LENGTH} characters.`;
  } else if (alias && !PROFILE_ALIAS_PATTERN.test(alias)) {
    errors.alias = 'Lowercase letters, numbers, and underscores only.';
  }

  if (requiresOnboardingFields && !form.firstName.trim()) {
    errors.firstName = 'First name is required.';
  }

  if (requiresOnboardingFields && !form.lastName.trim()) {
    errors.lastName = 'Last name is required.';
  }

  if (requiresOnboardingFields && !form.ageGroup) {
    errors.ageGroup = 'Please select an age group.';
  }

  if (requiresOnboardingFields && !form.gender) {
    errors.gender = 'Please select a gender.';
  }

  if (requiresOnboardingFields && !form.educationLevel) {
    errors.educationLevel = 'Please select an education level.';
  }

  return errors;
}

function getAliasHint(aliasStatus: AliasStatus, isCurrentAlias: boolean) {
  if (isCurrentAlias) return 'Current alias';
  if (aliasStatus === 'taken') return 'That alias is already taken.';
  if (aliasStatus === 'available') return 'Alias is available.';
  if (aliasStatus === 'error') return 'Could not verify alias availability right now.';
  return 'Lowercase letters, numbers, and underscores only.';
}

export function useProfileSettingsForm() {
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const updateUser = useAuthStore((state) => state.updateUser);
  const setAuth = useAuthStore((state) => state.setAuth);

  const [form, setForm] = useState<ProfileFormState>(() => getInitialForm(user));
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { aliasStatus, isCurrentAlias } = useAliasAvailability(form.alias, {
    currentAlias: user?.alias ?? ''
  });

  useEffect(() => {
    setForm(getInitialForm(user));
    setErrors({});
  }, [user]);

  function setField<K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleReset() {
    setForm(getInitialForm(user));
    setErrors({});
    toast.success('Profile form reset.');
  }

  function handleProfilePictureChange(publicUrl: string) {
    if (user?.id) rememberProfileAvatar(user.id, publicUrl);
    updateUser({ image: publicUrl });
    toast.success('Profile picture updated.');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || !user) return;

    const requiresOnboardingFields = !user.doneOnboarding;
    const nextErrors = validateProfileForm(form, requiresOnboardingFields);

    if (aliasStatus === 'taken') {
      nextErrors.alias = 'That alias is already taken.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (aliasStatus === 'checking') {
      toast.info('Checking alias availability. Try saving again in a moment.');
      return;
    }

    const normalizedProfile = {
      alias: normalizeOptionalValue(normalizeAlias(form.alias)),
      firstName: normalizeOptionalValue(form.firstName),
      lastName: normalizeOptionalValue(form.lastName),
      ageGroup: form.ageGroup || undefined,
      gender: form.gender || undefined,
      educationLevel: form.educationLevel || undefined,
      occupation: normalizeOptionalValue(form.occupation),
      bio: normalizeOptionalValue(form.bio)
    } satisfies Partial<AuthUser>;

    setIsSubmitting(true);

    try {
      if (!user.doneOnboarding) {
        const result = await Profile.userOnboardingUserOnboardPost({
          body: {
            alias: normalizedProfile.alias ?? '',
            first_name: normalizedProfile.firstName ?? '',
            last_name: normalizedProfile.lastName ?? '',
            age_group: normalizedProfile.ageGroup as AgeGroup,
            gender: normalizedProfile.gender as Gender,
            education_level: normalizedProfile.educationLevel as EducationLevel,
            occupation: normalizedProfile.occupation,
            bio: normalizedProfile.bio
          },
          throwOnError: false
        });

        if (result.error || !result.data) {
          toast.error(getErrorMessage(result.error));
          return;
        }

        const nextUser = decodeTokenUser(result.data.access_token);
        if (nextUser && refreshToken) {
          setAuth(result.data.access_token, refreshToken, nextUser);
        } else {
          updateUser({
            ...normalizedProfile,
            doneOnboarding: true
          });
        }

        toast.success('Profile completed successfully.');
        return;
      }

      const result = await AccountSettings.updateProfileUserProfilePatch({
        body: {
          alias: normalizedProfile.alias ?? '',
          first_name: normalizedProfile.firstName ?? '',
          last_name: normalizedProfile.lastName ?? '',
          age_group: normalizedProfile.ageGroup as AgeGroup,
          gender: normalizedProfile.gender as Gender,
          education_level: normalizedProfile.educationLevel as EducationLevel,
          occupation: normalizedProfile.occupation,
          bio: normalizedProfile.bio
        },
        throwOnError: false
      });

      if (result.error || !result.data) {
        toast.error(getErrorMessage(result.error));
        return;
      }

      const nextUser = decodeTokenUser(result.data.access_token);
      if (nextUser && refreshToken) {
        setAuth(result.data.access_token, refreshToken, nextUser);
      } else {
        updateUser(normalizedProfile);
      }

      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    aliasHint: getAliasHint(aliasStatus, isCurrentAlias),
    aliasStatus,
    completionValue: user?.doneOnboarding ? getDraftCompletion(form) : getProfileCompletion(user),
    errors,
    form,
    handleReset,
    handleSubmit,
    handleProfilePictureChange,
    isOnboarded: Boolean(user?.doneOnboarding),
    isSubmitting,
    setField,
    user
  };
}
