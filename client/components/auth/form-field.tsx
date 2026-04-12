import { Input } from '@/components/ui/input';

interface AuthFormFieldProps extends Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'placeholder' | 'autoComplete' | 'inputMode' | 'pattern' | 'maxLength'
> {
  id: string;
  label: string;
  labelRight?: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  hint?: string;
  inputClassName?: string;
}

export function AuthFormField({
  id,
  label,
  labelRight,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  pattern,
  maxLength,
  value,
  onChange,
  error,
  hint,
  inputClassName
}: AuthFormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className={labelRight ? 'flex items-center justify-between' : undefined}>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {labelRight}
      </div>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        aria-invalid={!!error || undefined}
        className={inputClassName}
      />
      {error ? <p className="text-destructive text-xs">{error}</p> : hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}
