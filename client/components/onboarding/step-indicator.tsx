import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ONBOARDING_STEPS } from '@/constants/onboarding';

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {ONBOARDING_STEPS.map((s, idx) => {
        const isDone = currentStep > s.step;
        const isActive = currentStep === s.step;

        return (
          <div key={s.step} className="flex items-center">
            {/* Circle */}
            <div
              className={cn(
                'flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-300',
                isDone && 'border-primary bg-primary text-black',
                isActive && 'border-primary bg-primary/10 text-primary',
                !isDone && !isActive && 'border-border bg-background text-muted-foreground'
              )}
            >
              {isDone ? <Check className="size-3.5" strokeWidth={2.5} /> : s.step}
            </div>

            {/* Connector line (not after last step) */}
            {idx < ONBOARDING_STEPS.length - 1 && (
              <div className="relative mx-1 h-0.5 w-12 overflow-hidden rounded-full bg-border">
                <div
                  className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                  style={{ width: isDone ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
