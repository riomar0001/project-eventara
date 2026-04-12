'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from '@/api/sdk.gen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';

const AGE_GROUP_LABELS: Record<string, string> = {
  child: 'Child (under 13)',
  teen: 'Teen (13–17)',
  adult: 'Adult (18–64)',
  senior: 'Senior (65+)'
};

const GENDER_LABELS: Record<string, string> = {
  male: 'Male',
  female: 'Female'
};

const EDUCATION_LABELS: Record<string, string> = {
  no_formal_education: 'No Formal Education',
  elementary_level: 'Elementary Level',
  elementary_graduate: 'Elementary Graduate',
  junior_high_school_level: 'Junior High School Level',
  junior_high_school_graduate: 'Junior High School Graduate',
  senior_high_school_level: 'Senior High School Level',
  senior_high_school_graduate: 'Senior High School Graduate',
  vocational_trade_certificate: 'Vocational / Trade Certificate',
  college_level_undergraduate: 'College Level (Undergraduate)',
  associate_degree: 'Associate Degree',
  bachelors_degree: "Bachelor's Degree",
  masters_degree: "Master's Degree",
  doctorate_degree: 'Doctorate Degree'
};

const schema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  alias: z
    .string()
    .min(3, 'Must be at least 3 characters')
    .max(100)
    .refine((v) => /^[a-z0-9_]+$/.test(v.toLowerCase()), 'Only lowercase letters, numbers, and underscores'),
  age_group: z.enum(['child', 'teen', 'adult', 'senior']).refine(
    (v) => !!v,
    'Please select an age group'
  ),
  gender: z.enum(['male', 'female']).refine((v) => v, 'Please select a gender'),
  education_level: z.enum(
    [
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
    ]
  ).refine((v) => v, 'Please select your education level'),
  occupation: z.string().max(150).optional(),
  bio: z.string().optional()
});

type FormData = z.infer<typeof schema>;

const STEPS = ['Personal Info', 'Background', 'About You'];

const STEP_FIELDS: (keyof FormData)[][] = [
  ['first_name', 'last_name', 'alias'],
  ['age_group', 'gender', 'education_level'],
  ['occupation', 'bio']
];

type AliasStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error' | 'invalid';

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const tryRefresh = useAuthStore((s) => s.tryRefresh);

  const [step, setStep] = useState(0);
  const [aliasStatus, setAliasStatus] = useState<AliasStatus>('idle');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      alias: '',
      occupation: '',
      bio: ''
    }
  });

  const { isSubmitting } = form.formState;

  const checkAlias = useCallback((value: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const trimmed = value.trim().toLowerCase();

    if (!trimmed || trimmed.length < 3) {
      setAliasStatus('idle');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      setAliasStatus('invalid');
      return;
    }

    setAliasStatus('checking');
    debounceTimer.current = setTimeout(async () => {
      try {
        const { data, error } = await User.checkAliasUserCheckAliasGet({ query: { alias: trimmed } });
        if (error || !data) {
          setAliasStatus('error');
          return;
        }
        setAliasStatus(data.available ? 'available' : 'taken');
      } catch {
        setAliasStatus('error');
      }
    }, 500);
  }, []);

  // Redirect if already onboarded or not authenticated
  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.replace('/login');
    } else if (user.doneOnboarding) {
      router.replace('/');
    }
  }, [isInitialized, user, router]);

  async function validateStep() {
    const fields = STEP_FIELDS[step];
    const valid = await form.trigger(fields);
    return valid;
  }

  async function handleNext() {
    const valid = await validateStep();
    if (!valid) return;
    if (step === 0 && aliasStatus !== 'available') return;
    setStep((s) => s + 1);
  }

  async function onSubmit(data: FormData) {
    try {
      const { error } = await User.userOnboardingUserOnboardPost({
        body: {
          first_name: data.first_name,
          last_name: data.last_name,
          alias: data.alias,
          age_group: data.age_group,
          gender: data.gender,
          education_level: data.education_level,
          occupation: data.occupation || undefined,
          bio: data.bio || undefined
        }
      });

      if (error) {
        toast.error((error as { message?: string }).message ?? 'Failed to complete onboarding.');
        return;
      }

      // Refresh token so the new done_onboarding claim is reflected in store
      const refreshed = await tryRefresh();
      if (!refreshed) {
        toast.error('Session expired. Please log in again.');
        router.replace('/login');
        return;
      }
      router.replace('/main');
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  }

  if (!isInitialized || !user || user.doneOnboarding) return null;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          Welcome! Let&apos;s set up your profile
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8 flex gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-neutral-200'}`}
          />
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Step 1: Personal Info */}
        {step === 0 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-foreground text-sm font-medium" htmlFor="first_name">
                  First name
                </label>
                <Input
                  id="first_name"
                  placeholder="Juan"
                  aria-invalid={!!form.formState.errors.first_name}
                  {...form.register('first_name')}
                />
                {form.formState.errors.first_name && (
                  <p className="text-destructive text-xs">{form.formState.errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-foreground text-sm font-medium" htmlFor="last_name">
                  Last name
                </label>
                <Input
                  id="last_name"
                  placeholder="dela Cruz"
                  aria-invalid={!!form.formState.errors.last_name}
                  {...form.register('last_name')}
                />
                {form.formState.errors.last_name && (
                  <p className="text-destructive text-xs">{form.formState.errors.last_name.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-foreground text-sm font-medium" htmlFor="alias">
                Nickname
              </label>
              <div className="relative">
                <Input
                  id="alias"
                  placeholder="e.g. juandc"
                  aria-invalid={!!form.formState.errors.alias || aliasStatus === 'taken'}
                  {...form.register('alias', {
                    onChange: (e) => checkAlias(e.target.value)
                  })}
                  className="pr-8"
                />
                <span className="absolute top-1/2 right-3 -translate-y-1/2">
                  {aliasStatus === 'checking' && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
                  {aliasStatus === 'available' && <CheckCircle2 className="size-4 text-green-500" />}
                  {(aliasStatus === 'taken' || aliasStatus === 'invalid') && <XCircle className="text-destructive size-4" />}
                </span>
              </div>
              {form.formState.errors.alias && (
                <p className="text-destructive text-xs">{form.formState.errors.alias.message}</p>
              )}
              {!form.formState.errors.alias && aliasStatus === 'invalid' && (
                <p className="text-destructive text-xs">Only lowercase letters, numbers, and underscores.</p>
              )}
              {!form.formState.errors.alias && aliasStatus === 'taken' && (
                <p className="text-destructive text-xs">This nickname is already taken.</p>
              )}
              {!form.formState.errors.alias && aliasStatus === 'available' && (
                <p className="text-xs text-green-600">Nickname is available.</p>
              )}
              <p className="text-muted-foreground text-xs">Lowercase, no spaces. This cannot be changed later.</p>
            </div>
          </>
        )}

        {/* Step 2: Background */}
        {step === 1 && (
          <>
            <div className="space-y-1.5">
              <label className="text-foreground text-sm font-medium">Age group</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(AGE_GROUP_LABELS).map(([value, label]) => {
                  const selected = form.watch('age_group') === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => form.setValue('age_group', value as FormData['age_group'], { shouldValidate: true })}
                      className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                        selected
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {form.formState.errors.age_group && (
                <p className="text-destructive text-xs">{form.formState.errors.age_group.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground text-sm font-medium">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(GENDER_LABELS).map(([value, label]) => {
                  const selected = form.watch('gender') === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => form.setValue('gender', value as FormData['gender'], { shouldValidate: true })}
                      className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                        selected
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {form.formState.errors.gender && (
                <p className="text-destructive text-xs">{form.formState.errors.gender.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground text-sm font-medium" htmlFor="education_level">
                Education level
              </label>
              <select
                id="education_level"
                className={`border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 ${
                  form.formState.errors.education_level ? 'border-destructive' : ''
                }`}
                {...form.register('education_level')}
              >
                <option value="" disabled>
                  Select your education level
                </option>
                {Object.entries(EDUCATION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {form.formState.errors.education_level && (
                <p className="text-destructive text-xs">{form.formState.errors.education_level.message}</p>
              )}
            </div>
          </>
        )}

        {/* Step 3: About You */}
        {step === 2 && (
          <>
            <div className="space-y-1.5">
              <label className="text-foreground text-sm font-medium" htmlFor="occupation">
                Occupation{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                id="occupation"
                placeholder="e.g. Event Coordinator, Student…"
                {...form.register('occupation')}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground text-sm font-medium" htmlFor="bio">
                Bio{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                id="bio"
                rows={4}
                placeholder="Tell us a little about yourself…"
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1"
                {...form.register('bio')}
              />
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}

          {step < STEPS.length - 1 ? (
            <Button type="button" className="flex-1" onClick={handleNext}>
              Continue
            </Button>
          ) : (
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isSubmitting ? 'Saving…' : 'Complete setup'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
