'use client';

import { Fragment, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Check, CheckCircle2, Loader2, Sparkles, User2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@/api/sdk.gen';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

// ─── Label maps ───────────────────────────────────────────────────────────────

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

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  alias: z
    .string()
    .min(3, 'Must be at least 3 characters')
    .max(100)
    .refine((v) => /^[a-z0-9_]+$/.test(v.toLowerCase()), 'Only lowercase letters, numbers, and underscores'),
  age_group: z.enum(['child', 'teen', 'adult', 'senior']).refine((v) => !!v, 'Please select an age group'),
  gender: z.enum(['male', 'female']).refine((v) => !!v, 'Please select a gender'),
  education_level: z
    .enum([
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
    ])
    .refine((v) => !!v, 'Please select your education level'),
  occupation: z.string().max(150).optional(),
  bio: z.string().max(500).optional()
});

type FormData = z.infer<typeof schema>;

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = ['Personal Info', 'Background', 'About You'] as const;

const STEP_META = [
  {
    icon: User2,
    title: "Let's set up your profile",
    description: 'Your name and a unique nickname for the Eventara community.'
  },
  {
    icon: BookOpen,
    title: 'A bit of background',
    description: 'Helps us tailor your experience.'
  },
  {
    icon: Sparkles,
    title: 'Almost there',
    description: 'Optional details to introduce yourself.'
  }
] as const;

const STEP_FIELDS: (keyof FormData)[][] = [
  ['first_name', 'last_name', 'alias'],
  ['age_group', 'gender', 'education_level'],
  ['occupation', 'bio']
];

type AliasStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error' | 'invalid';

// ─── Page ─────────────────────────────────────────────────────────────────────

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
    defaultValues: { first_name: '', last_name: '', alias: '', occupation: '', bio: '' }
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

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) router.replace('/login');
    else if (user.doneOnboarding) router.replace('/');
  }, [isInitialized, user, router]);

  async function handleNext() {
    const valid = await form.trigger(STEP_FIELDS[step]);
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

  const { icon: StepIcon, title, description } = STEP_META[step];
  const aliasFieldError =
    form.formState.errors.alias?.message ??
    (aliasStatus === 'invalid' ? 'Only lowercase letters, numbers, and underscores.' : undefined) ??
    (aliasStatus === 'taken' ? 'This nickname is already taken.' : undefined);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {/* ── Header band ──────────────────────────────────────────────────────── */}
      <div className="bg-primary px-7 pt-6 pb-5">
        {/* Stepper */}
        <div className="mb-5 flex items-center">
          {STEPS.map((label, i) => (
            <Fragment key={label}>
              {/* Connector line */}
              {i > 0 && (
                <div className={cn('mx-2 h-px flex-1 transition-colors duration-300', i <= step ? 'bg-primary-foreground/50' : 'bg-primary-foreground/20')} />
              )}

              {/* Step node */}
              <div className="flex flex-col items-center gap-1">
                {/* Circle */}
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300',
                    // completed
                    i < step && 'bg-primary-foreground text-white',
                    // active — larger ring to draw the eye
                    i === step && 'bg-primary-foreground ring-primary-foreground/30 ring-offset-primary text-white ring-2 ring-offset-1',
                    // inactive — outlined only; considered inactive UI element per WCAG 1.4.3
                    i > step && 'border-primary-foreground/40 text-primary-foreground/50 border-[1.5px]'
                  )}
                >
                  {i < step ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-[10px] font-semibold tracking-wide whitespace-nowrap',
                    i <= step ? 'text-primary-foreground' : 'text-primary-foreground/50'
                  )}
                >
                  {label}
                </span>
              </div>
            </Fragment>
          ))}
        </div>

        {/* Step title */}
        <div className="flex items-center gap-3">
          <div className="bg-primary-foreground/15 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
            <StepIcon className="text-primary-foreground size-4" />
          </div>
          <div>
            <h1 className="text-primary-foreground text-[17px] leading-tight font-semibold">{title}</h1>
            <p className="text-primary-foreground mt-0.5 text-xs">{description}</p>
          </div>
        </div>
      </div>

      {/* ── Form body ─────────────────────────────────────────────────────────── */}
      <div className="px-7 py-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* ─── Step 1: Personal Info ─── */}
          {step === 0 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field id="first_name" label="First name" error={form.formState.errors.first_name?.message}>
                  <Input id="first_name" placeholder="Juan" aria-invalid={!!form.formState.errors.first_name} {...form.register('first_name')} />
                </Field>

                <Field id="last_name" label="Last name" error={form.formState.errors.last_name?.message}>
                  <Input id="last_name" placeholder="dela Cruz" aria-invalid={!!form.formState.errors.last_name} {...form.register('last_name')} />
                </Field>
              </div>

              <Field id="alias" label="Nickname" error={aliasFieldError} hint="Lowercase, no spaces. This cannot be changed later.">
                <div className="relative">
                  <Input
                    id="alias"
                    placeholder="e.g. juandc"
                    aria-invalid={!!form.formState.errors.alias || aliasStatus === 'taken' || aliasStatus === 'invalid'}
                    {...form.register('alias', { onChange: (e) => checkAlias(e.target.value) })}
                    className="pr-8"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                    {aliasStatus === 'checking' && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
                    {aliasStatus === 'available' && <CheckCircle2 className="text-primary-foreground size-4" />}
                    {(aliasStatus === 'taken' || aliasStatus === 'invalid') && <XCircle className="text-destructive size-4" />}
                  </span>
                </div>
                {!aliasFieldError && aliasStatus === 'available' && <p className="text-primary-foreground text-xs font-medium">Nickname is available.</p>}
              </Field>
            </>
          )}

          {/* ─── Step 2: Background ─── */}
          {step === 1 &&
            (() => {
              const watchedAgeGroup = form.watch('age_group');
              const watchedGender = form.watch('gender');
              const watchedEducation = form.watch('education_level');

              return (
                <>
                  <Field label="Age group" error={form.formState.errors.age_group?.message}>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(AGE_GROUP_LABELS).map(([value, label]) => (
                        <OptionButton
                          key={value}
                          selected={watchedAgeGroup === value}
                          onClick={() =>
                            form.setValue('age_group', value as FormData['age_group'], {
                              shouldValidate: true
                            })
                          }
                        >
                          {label}
                        </OptionButton>
                      ))}
                    </div>
                  </Field>

                  <Field label="Gender" error={form.formState.errors.gender?.message}>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(GENDER_LABELS).map(([value, label]) => (
                        <OptionButton
                          key={value}
                          selected={watchedGender === value}
                          onClick={() =>
                            form.setValue('gender', value as FormData['gender'], {
                              shouldValidate: true
                            })
                          }
                        >
                          {label}
                        </OptionButton>
                      ))}
                    </div>
                  </Field>

                  <Field label="Education level" error={form.formState.errors.education_level?.message}>
                    <div
                      className={cn(
                        'bg-input/50 max-h-[204px] overflow-y-auto rounded-xl border p-1.5',
                        form.formState.errors.education_level ? 'border-destructive' : 'border-transparent'
                      )}
                    >
                      {Object.entries(EDUCATION_LABELS).map(([value, label]) => {
                        const selected = watchedEducation === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => form.setValue('education_level', value as FormData['education_level'], { shouldValidate: true })}
                            className={cn(
                              'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                              selected
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'hover:bg-primary/10 hover:text-primary-foreground font-medium text-neutral-700'
                            )}
                          >
                            <span>{label}</span>
                            {selected && <Check className="size-3.5 shrink-0" strokeWidth={3} />}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </>
              );
            })()}

          {/* ─── Step 3: About You ─── */}
          {step === 2 && (
            <>
              <Field
                id="occupation"
                label={
                  <>
                    Occupation <span className="text-muted-foreground font-normal">(optional)</span>
                  </>
                }
              >
                <Input id="occupation" placeholder="e.g. Event Coordinator, Student…" {...form.register('occupation')} />
              </Field>

              <Field
                id="bio"
                label={
                  <>
                    Bio <span className="text-muted-foreground font-normal">(optional)</span>
                  </>
                }
              >
                <textarea
                  id="bio"
                  rows={4}
                  placeholder="Tell us a little about yourself…"
                  className={cn(
                    // Match the Input component's visual style exactly
                    'bg-input/50 placeholder:text-muted-foreground',
                    'focus-visible:border-ring focus-visible:ring-ring/30',
                    'w-full resize-none rounded-xl border border-transparent',
                    'px-3 py-2 text-sm outline-none',
                    'transition-[color,box-shadow,background-color] focus-visible:ring-3'
                  )}
                  {...form.register('bio')}
                />
              </Field>
            </>
          )}

          {/* ── Navigation ── */}
          <div className="flex gap-3 pt-1">
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
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ id, label, error, hint, children }: { id?: string; label: ReactNode; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
      </label>
      {children}
      {error && <p className="text-destructive text-xs font-medium">{error}</p>}
      {!error && hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

function OptionButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-all',
        selected
          ? 'border-primary bg-primary text-primary-foreground font-semibold'
          : 'hover:border-primary/40 hover:bg-primary/5 hover:text-primary-foreground border-neutral-200 bg-white font-medium text-neutral-700'
      )}
    >
      <span>{children}</span>
      {selected && <Check className="size-3.5 shrink-0" strokeWidth={3} />}
    </button>
  );
}
