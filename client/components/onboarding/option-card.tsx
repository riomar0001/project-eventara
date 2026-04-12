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
        'flex flex-col items-center justify-center rounded-xl border-2 px-3 py-3 text-center transition-all duration-150',
        'hover:border-primary/50 hover:bg-primary/5',
        selected
          ? 'border-primary bg-primary/10 text-foreground'
          : 'border-border bg-background text-muted-foreground'
      )}
    >
      <span className={cn('text-sm font-medium', selected && 'text-foreground')}>{label}</span>
      {description && <span className="mt-0.5 text-xs opacity-70">{description}</span>}
    </button>
  );
}
