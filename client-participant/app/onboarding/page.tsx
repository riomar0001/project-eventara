'use client';

import { ChevronRight, Loader2 } from 'lucide-react';
import { StepIndicator } from '@/components/onboarding/step-indicator';
import { StepBasicInfo, StepAboutYou, StepReview, StepComplete } from '@/components/onboarding/steps';
import { MeshBg } from '@/components/shared/mesh-bg';
import { useOnboarding, TOTAL_STEPS } from '@/hooks/onboarding/use-onboarding';

const STEP_LABELS = ['Basic info', 'About you', 'Review', 'All done!'];

export default function OnboardingPage() {
  const { step, form, loading, setField, goToStep, next, back } = useOnboarding();
  const isLastStep = step === TOTAL_STEPS - 1;
  const isReviewStep = step === 2;

  return (
    <main className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <MeshBg />
      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="from-primary to-primary/80 flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L15 8H12V14H8V8H5L10 2Z" fill="#0a1005" />
            </svg>
          </div>
          <span className="text-foreground text-lg font-bold tracking-[-0.02em]">Eventara</span>
        </div>

        <div className="mb-8">
          <StepIndicator steps={STEP_LABELS} current={step} />
        </div>

        <div className="border-border bg-card rounded-3xl border px-8 py-8 shadow-2xl">
          {step === 0 && <StepBasicInfo form={form} setField={setField} />}
          {step === 1 && <StepAboutYou form={form} setField={setField} />}
          {step === 2 && <StepReview form={form} goToStep={goToStep} />}
          {step === 3 && <StepComplete alias={form.alias} />}

          <div className={`mt-6 flex gap-3 ${step > 0 && !isLastStep ? 'justify-between' : 'justify-end'}`}>
            {step > 0 && !isLastStep && (
              <button
                onClick={back}
                className="border-border text-muted-foreground hover:border-muted-foreground hover:bg-muted/50 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all"
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              disabled={loading}
              className="bg-primary text-primary-foreground ml-auto flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isLastStep ? (
                'Explore events'
              ) : isReviewStep ? (
                loading ? (
                  'Saving…'
                ) : (
                  'Submit profile'
                )
              ) : (
                <span className="flex items-center gap-1.5">
                  Continue <ChevronRight size={14} />
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
