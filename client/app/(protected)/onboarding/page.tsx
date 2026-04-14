'use client';

import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StepAbout } from '@/components/onboarding/step-about';
import { StepIdentity } from '@/components/onboarding/step-identity';
import { StepIndicator } from '@/components/onboarding/step-indicator';
import { StepProfile } from '@/components/onboarding/step-profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useOnboardingForm } from '@/hooks/use-onboarding-form';
import { cn } from '@/lib/utils';

export default function OnboardPage() {
  const router = useRouter();
  const { aliasStatus, animKey, currentStepMeta, direction, errors, form, handleBack, handleChange, handleNext, handleSubmit, isDone, isNextDisabled, isSubmitting, step, totalSteps } =
    useOnboardingForm();

  if (isDone) {
    return (
      <Card className="gap-0 overflow-hidden py-0">
        <div
          className="flex flex-col items-center gap-4 px-6 py-8 text-center sm:gap-6 sm:px-8 sm:py-12"
          style={{ animation: 'auth-card-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both' }}
        >
          <div className="bg-primary/10 relative flex size-14 items-center justify-center rounded-2xl sm:size-20 sm:rounded-3xl">
            <Sparkles className="text-primary size-6 sm:size-9" />
            <div className="bg-primary absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full sm:size-5">
              <span className="text-[9px] font-bold text-black sm:text-[10px]">✓</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 sm:gap-2">
            <h2 className="text-base font-semibold tracking-tight sm:text-2xl">Welcome, {form.first_name}!</h2>
            <p className="text-muted-foreground mx-auto max-w-xs text-xs leading-relaxed sm:text-sm">
              Your profile is all set. You&apos;re ready to explore Eventara.
            </p>
          </div>

          <Button className="w-full" onClick={() => router.replace('/dashboard')}>
            Go to dashboard
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="gap-4 px-5 pt-5 pb-0 sm:gap-5 sm:px-8 sm:pt-7">
        <StepIndicator currentStep={step} />
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <h2 className="text-sm font-semibold tracking-tight sm:text-xl">{currentStepMeta.title}</h2>
          <p className="text-muted-foreground text-[11px] sm:text-sm">{currentStepMeta.description}</p>
        </div>
      </CardHeader>

      {/* Step content with slide animation */}
      <CardContent
        key={animKey}
        className="min-h-64 px-5 pt-3 pb-0 sm:min-h-80 sm:px-8 sm:pt-6"
        style={{
          animation: `${direction === 'forward' ? 'step-enter-forward' : 'step-enter-back'} 0.28s cubic-bezier(0.16, 1, 0.3, 1) both`
        }}
      >
        {step === 1 && (
          <StepIdentity values={{ first_name: form.first_name, last_name: form.last_name, alias: form.alias }} onChange={handleChange} errors={errors} aliasStatus={aliasStatus} />
        )}
        {step === 2 && (
          <StepAbout
            values={{ age_group: form.age_group, gender: form.gender, education_level: form.education_level }}
            onChange={handleChange}
            errors={errors}
          />
        )}
        {step === 3 && <StepProfile values={{ occupation: form.occupation, bio: form.bio }} onChange={handleChange} errors={errors} />}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 px-5 pt-4 pb-5 sm:px-8 sm:pt-6 sm:pb-7">
        <div className="flex w-full gap-2.5">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex-1" disabled={isSubmitting}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}

          {step < totalSteps ? (
            <Button onClick={handleNext} className={cn(step === 1 ? 'w-full' : 'flex-1')} disabled={isNextDisabled}>
              Continue
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Finishing up…' : 'Complete profile'}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
