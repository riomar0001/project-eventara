'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Mail, RotateCcw, Save, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User as UserApi } from '@/api/sdk.gen';
import type { AgeGroup, EducationLevel, Gender } from '@/api/types.gen';
import { getProfileCompletion, humanizeProfileValue } from '@/lib/auth-user';
import { decodeTokenUser } from '@/lib/token';
import { type AuthUser, useAuthStore } from '@/store/auth-store';

const ageGroupOptions: AgeGroup[] = ['child', 'teen', 'adult', 'senior'];
const genderOptions: Gender[] = ['male', 'female'];
const educationOptions: EducationLevel[] = [
  'no_formal_education',
  'elementary_level',
  'elementary_graduate',
  'junior_high_school_level',
  'junior_high_school_graduate',
  'senior_high_school_level',
  'senior_high_school_graduate',
  'vocational_trade_certificate',
  'college_level_undergraduate',
  'associate_degree',
  'bachelors_degree',
  'masters_degree',
  'doctorate_degree'
];

type ProfileFormState = {
  alias: string;
  firstName: string;
  lastName: string;
  ageGroup: string;
  gender: string;
  educationLevel: string;
  occupation: string;
  bio: string;
};

type FormErrors = Partial<Record<keyof ProfileFormState, string>>;
type AliasStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

const aliasPattern = /^[a-z0-9_]+$/;

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

function normalizeAlias(value: string) {
  return value.trim().toLowerCase();
}

function normalizeOptionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function getDraftCompletion(form: ProfileFormState) {
  const trackedFields = [form.alias, form.firstName, form.lastName, form.occupation, form.bio, form.ageGroup, form.gender, form.educationLevel];
  const completedFields = trackedFields.filter((field) => Boolean(field.trim())).length;
  return Math.round((completedFields / trackedFields.length) * 100);
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const maybeDetail = (error as { detail?: unknown }).detail;
    if (typeof maybeDetail === 'string') return maybeDetail;
  }

  return 'Something went wrong. Please try again.';
}

function validateForm(form: ProfileFormState, requiresOnboardingFields: boolean) {
  const errors: FormErrors = {};
  const alias = normalizeAlias(form.alias);

  if (requiresOnboardingFields && !alias) {
    errors.alias = 'Alias is required.';
  } else if (alias && alias.length < 3) {
    errors.alias = 'Alias must be at least 3 characters.';
  } else if (alias && !aliasPattern.test(alias)) {
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

function FieldHint({ error, hint }: { error?: string; hint?: string }) {
  if (error) return <p className="text-destructive text-xs">{error}</p>;
  if (hint) return <p className="text-muted-foreground text-xs">{hint}</p>;
  return null;
}

export default function ProfileSettingsPage() {
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const updateUser = useAuthStore((state) => state.updateUser);
  const setAuth = useAuthStore((state) => state.setAuth);

  const initialForm = getInitialForm(user);
  const currentAlias = normalizeAlias(user?.alias ?? '');

  const [form, setForm] = useState<ProfileFormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [debouncedAlias, setDebouncedAlias] = useState(currentAlias);
  const [aliasStatus, setAliasStatus] = useState<AliasStatus>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setForm(initialForm);
    setErrors({});
    setDebouncedAlias(currentAlias);
    setAliasStatus('idle');
  }, [
    currentAlias,
    initialForm.ageGroup,
    initialForm.alias,
    initialForm.bio,
    initialForm.educationLevel,
    initialForm.firstName,
    initialForm.gender,
    initialForm.lastName,
    initialForm.occupation
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedAlias(normalizeAlias(form.alias));
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [form.alias]);

  useEffect(() => {
    const alias = debouncedAlias;

    if (!alias || alias === currentAlias) {
      setAliasStatus('idle');
      return;
    }

    if (alias.length < 3 || !aliasPattern.test(alias)) {
      setAliasStatus('idle');
      return;
    }

    let cancelled = false;
    setAliasStatus('checking');

    UserApi.checkAliasUserCheckAliasGet({
      query: { alias },
      throwOnError: false
    }).then((result) => {
      if (cancelled) return;

      if (!result.data) {
        setAliasStatus('error');
        return;
      }

      setAliasStatus(result.data.available ? 'available' : 'taken');
    });

    return () => {
      cancelled = true;
    };
  }, [currentAlias, debouncedAlias]);

  function setField<K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleReset() {
    setForm(initialForm);
    setErrors({});
    toast.success('Profile form reset.');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || !user) return;

    const requiresOnboardingFields = !user.doneOnboarding;
    const nextErrors = validateForm(form, requiresOnboardingFields);

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
    };

    setIsSubmitting(true);

    try {
      if (!user.doneOnboarding) {
        const result = await UserApi.userOnboardingUserOnboardPost({
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

      updateUser(normalizedProfile);
      toast.success('Profile updated in this session. A server update endpoint is not available yet.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const profileCompletion = user ? getProfileCompletion(user) : 0;
  const draftCompletion = getDraftCompletion(form);
  const aliasIsUnchanged = normalizeAlias(form.alias) === currentAlias;

  const aliasHint =
    errors.alias ||
    (aliasIsUnchanged && currentAlias
      ? 'Current alias'
      : aliasStatus === 'taken'
        ? 'That alias is already taken.'
        : aliasStatus === 'available'
          ? 'Alias is available.'
          : aliasStatus === 'error'
            ? 'Could not verify alias availability right now.'
            : 'Lowercase letters, numbers, and underscores only.');

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-neutral-50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium">{user?.doneOnboarding ? 'Profile settings' : 'Complete your profile'}</p>
            <p className="text-muted-foreground max-w-2xl text-sm">
              {user?.doneOnboarding
                ? 'Alias validation is wired to the live API. Profile edits are still stored in the current session until the backend exposes an update-profile endpoint.'
                : 'Finishing this form will call the onboarding API and write your profile to the server.'}
            </p>
          </div>

          <div className="min-w-52 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profile completion</span>
              <span className="font-medium">{user?.doneOnboarding ? draftCompletion : profileCompletion}%</span>
            </div>
            <Progress value={user?.doneOnboarding ? draftCompletion : profileCompletion} />
          </div>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input id="email" value={user?.email ?? ''} className="pl-9" readOnly />
            </div>
            <FieldHint hint="Your email is managed through account security and cannot be edited here." />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="alias">
              Alias
            </label>
            <div className="relative">
              <Input
                id="alias"
                value={form.alias}
                onChange={(event) => setField('alias', event.target.value.toLowerCase())}
                placeholder="jane_doe"
                autoComplete="nickname"
                className="pr-9"
              />
              <div className="absolute top-1/2 right-3 -translate-y-1/2">
                {aliasStatus === 'checking' ? (
                  <Loader2 className="text-muted-foreground size-4 animate-spin" />
                ) : aliasStatus === 'available' ? (
                  <CheckCircle2 className="size-4 text-lime-600" />
                ) : aliasStatus === 'taken' ? (
                  <XCircle className="text-destructive size-4" />
                ) : aliasStatus === 'error' ? (
                  <AlertCircle className="size-4 text-amber-600" />
                ) : null}
              </div>
            </div>
            <FieldHint error={errors.alias} hint={aliasHint} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="occupation">
              Occupation
            </label>
            <Input id="occupation" value={form.occupation} onChange={(event) => setField('occupation', event.target.value)} placeholder="Event coordinator" />
            <FieldHint error={errors.occupation} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="first-name">
              First name
            </label>
            <Input id="first-name" value={form.firstName} onChange={(event) => setField('firstName', event.target.value)} autoComplete="given-name" />
            <FieldHint error={errors.firstName} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="last-name">
              Last name
            </label>
            <Input id="last-name" value={form.lastName} onChange={(event) => setField('lastName', event.target.value)} autoComplete="family-name" />
            <FieldHint error={errors.lastName} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Age group</label>
            <Select value={form.ageGroup} onValueChange={(value) => setField('ageGroup', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select age group" />
              </SelectTrigger>
              <SelectContent>
                {ageGroupOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {humanizeProfileValue(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldHint error={errors.ageGroup} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Gender</label>
            <Select value={form.gender} onValueChange={(value) => setField('gender', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {humanizeProfileValue(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldHint error={errors.gender} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Education</label>
            <Select value={form.educationLevel} onValueChange={(value) => setField('educationLevel', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select education" />
              </SelectTrigger>
              <SelectContent>
                {educationOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {humanizeProfileValue(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldHint error={errors.educationLevel} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="bio">
              Bio
            </label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(event) => setField('bio', event.target.value)}
              placeholder="Tell people a little about yourself"
              rows={5}
            />
            <FieldHint error={errors.bio} hint="A short intro helps your profile feel complete." />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
          <Button type="submit" disabled={isSubmitting || aliasStatus === 'checking'}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {user?.doneOnboarding ? 'Save changes' : 'Complete profile'}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
}
