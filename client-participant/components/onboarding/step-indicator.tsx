import { CheckCircle2 } from 'lucide-react';

type Props = { steps: string[]; current: number };

export function StepIndicator({ steps, current }: Props) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
              i <= current ? 'bg-primary text-primary-foreground' : 'border-border text-muted-foreground border'
            }`}
          >
            {i < current ? <CheckCircle2 size={13} /> : i + 1}
          </div>
          <span className={`text-foreground text-[12.5px] font-medium transition-opacity ${i === current ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
          {i < steps.length - 1 && <div className="bg-border mx-1 h-px w-8" />}
        </div>
      ))}
    </div>
  );
}
