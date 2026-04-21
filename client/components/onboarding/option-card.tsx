import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptionCardProps {
  value: string;
  label: string;
  description?: string;
  selected: boolean;
  onSelect: (value: string) => void;
}

export function OptionCard({ value, label, description, selected, onSelect }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        'group relative flex flex-col items-center justify-center gap-0.5 rounded-lg border-2 px-2 py-2 text-center sm:rounded-xl sm:px-3 sm:py-3.5',
        'cursor-pointer transition-all duration-150 select-none',
        'hover:-translate-y-px hover:shadow-sm',
        selected ? 'border-primary bg-primary/8 shadow-primary/15 shadow-sm' : 'border-border bg-background hover:border-primary/40 hover:bg-primary/5'
      )}
    >
      {/* Checkmark badge */}
      <span
        className={cn(
          'absolute top-2 right-2 flex size-4 items-center justify-center rounded-full transition-all duration-200',
          selected ? 'bg-primary scale-100 opacity-100' : 'scale-75 opacity-0'
        )}
      >
        <Check className="size-2.5 text-black" strokeWidth={3} />
      </span>

      <span
        className={cn(
          'text-[10px] leading-tight font-semibold transition-colors duration-150 sm:text-sm',
          selected ? 'text-foreground' : 'text-foreground/70 group-hover:text-foreground'
        )}
      >
        {label}
      </span>

      {description && <span className="text-muted-foreground text-xs leading-tight">{description}</span>}
    </button>
  );
}
