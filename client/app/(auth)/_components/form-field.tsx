import { Input } from '@/components/ui/input';

interface FormFieldProps extends React.ComponentProps<typeof Input> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  action?: React.ReactNode;
}

export function FormField({ id, label, error, hint, action, ...inputProps }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {action}
      </div>
      <Input id={id} aria-invalid={!!error || undefined} {...inputProps} />
      {error
        ? <p className="text-destructive text-xs">{error}</p>
        : hint
          ? <p className="text-muted-foreground text-xs">{hint}</p>
          : null}
    </div>
  );
}
