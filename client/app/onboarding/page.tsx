'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StepIndicator } from '@/components/onboarding/step-indicator';
import { StepIdentity, type IdentityFields } from '@/components/onboarding/step-identity';
import { StepAbout, type AboutFields } from '@/components/onboarding/step-about';
import { StepProfile, type ProfileFields } from '@/components/onboarding/step-profile';
import { ONBOARDING_STEPS } from '@/constants/onboarding';

const TOTAL_STEPS = ONBOARDING_STEPS.length;

interface FormState extends IdentityFields, AboutFields, ProfileFields {}

const INITIAL_FORM: FormState = {
  first_name: '',
  last_name: '',
  alias: '',
  age_group: '',
  gender: '',
  education_level: '',
  occupation: '',
  bio: ''
};

type StepErrors = Partial<Record<keyof FormState, string>>;

function validateStep(step: number, form: FormState): StepErrors {
  const errors: StepErrors = {};

  if (step === 1) {
    if (!form.first_name.trim()) errors.first_name = 'First name is required.';
    if (!form.last_name.trim()) errors.last_name = 'Last name is required.';
    if (!form.alias.trim()) {
      errors.alias = 'Username is required.';
    } else if (form.alias.length < 3) {
      errors.alias = 'Must be at least 3 characters.';
    } else if (!/^[a-z0-9_]+$/.test(form.alias)) {
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

export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<StepErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const currentMeta = ONBOARDING_STEPS[step - 1];

  function handleChange(fields: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...fields }));
    // Clear errors for changed fields
    const cleared = Object.keys(fields).reduce<StepErrors>((acc, key) => {
      acc[key as keyof FormState] = undefined;
      return acc;
    }, {});
    setErrors((prev) => ({ ...prev, ...cleared }));
  }

  function handleNext() {
    const stepErrors = validateStep(step, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function handleBack() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleSubmit() {
    setIsSubmitting(true);
    // TODO: integrate POST /user/onboard — expects { alias, first_name, last_name, age_group, gender, education_level, occupation, bio }
    setTimeout(() => {
      setIsSubmitting(false);
      setIsDone(true);
    }, 1000);
  }

  if (isDone) {
    return (
      <Card className="py-10 gap-6">
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="text-primary size-8" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Welcome, {form.first_name}!</h2>
            <p className="text-muted-foreground text-sm">
              Your profile is all set. Let&apos;s explore Eventara.
            </p>
          </div>
          <Button className="mt-2 w-full" onClick={() => (window.location.href = '/dashboard')}>
            Go to dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="py-8 gap-6">
      <CardHeader className="gap-4">
        <StepIndicator currentStep={step} />
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xl">{currentMeta.title}</CardTitle>
          <CardDescription>{currentMeta.description}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="min-h-auto">
        {step === 1 && (
          <StepIdentity
            values={{ first_name: form.first_name, last_name: form.last_name, alias: form.alias }}
            onChange={handleChange}
            errors={errors}
          />
        )}
        {step === 2 && (
          <StepAbout
            values={{ age_group: form.age_group, gender: form.gender, education_level: form.education_level }}
            onChange={handleChange}
            errors={errors}
          />
        )}
        {step === 3 && (
          <StepProfile
            values={{ occupation: form.occupation, bio: form.bio }}
            onChange={handleChange}
            errors={errors}
          />
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <div className="flex w-full gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex-1" disabled={isSubmitting}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}

          {step < TOTAL_STEPS ? (
            <Button onClick={handleNext} className={step === 1 ? 'w-full' : 'flex-1'}>
              Next
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Finishing up…' : 'Complete profile'}
            </Button>
          )}
        </div>

        <p className="text-muted-foreground text-center text-xs">
          Step {step} of {TOTAL_STEPS}
        </p>
      </CardFooter>
    </Card>
  );
}
