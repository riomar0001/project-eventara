import { cn } from '@/lib/utils';

interface FieldHintProps {
  error?: string;
  hint?: string;
  errorClassName?: string;
  hintClassName?: string;
}

export function FieldHint({ error, hint, errorClassName, hintClassName }: FieldHintProps) {
  if (error) {
    return <p className={cn('text-destructive text-xs', errorClassName)}>{error}</p>;
  }

  if (hint) {
    return <p className={cn('text-muted-foreground text-xs', hintClassName)}>{hint}</p>;
  }

  return null;
}

