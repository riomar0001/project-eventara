import { Check } from 'lucide-react';
import { ONBOARDING_STEPS } from '@/constants/onboarding/onboarding';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex w-full items-center">
      {ONBOARDING_STEPS.map((s, idx) => {
        const isDone = currentStep > s.step;
        const isActive = currentStep === s.step;

        return (
          <div key={s.step} className="flex flex-1 items-center last:flex-none">
            {/* Node */}
            <div className="flex flex-col items-center gap-1 sm:gap-1.5">
              <div
                className={cn(
                  'flex size-4 items-center justify-center rounded-full text-[9px] font-bold transition-all duration-300 sm:size-7 sm:text-xs',
                  isDone && 'bg-primary text-black',
                  isActive && 'bg-primary/15 text-primary ring-primary/40 ring-2',
                  !isDone && !isActive && 'bg-muted text-muted-foreground'
                )}
              >
                {isDone ? <Check className="size-2 sm:size-3" strokeWidth={3} /> : s.step}
              </div>
              <span
                className={cn(
                  'text-[9px] font-medium whitespace-nowrap transition-colors duration-200 sm:text-[11px]',
                  isActive ? 'text-primary-foreground' : isDone ? 'text-primary-foreground' : 'text-muted-foreground'
                )}
              >
                {s.title}
              </span>
            </div>

            {/* Connector line */}
            {idx < ONBOARDING_STEPS.length - 1 && (
              <div className="bg-muted relative mx-1 mb-3 h-px flex-1 overflow-hidden sm:mx-2 sm:mb-5">
                <div className="bg-primary absolute inset-y-0 left-0 transition-all duration-500 ease-out" style={{ width: isDone ? '100%' : '0%' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
