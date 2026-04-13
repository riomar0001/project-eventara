import { forwardRef } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AuthFormFieldProps extends Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'placeholder' | 'autoComplete' | 'inputMode' | 'pattern' | 'maxLength' | 'value' | 'onChange' | 'onBlur' | 'name'
> {
  id: string;
  label: string;
  labelRight?: React.ReactNode;
  error?: string;
  hint?: string;
  inputClassName?: string;
}

export const AuthFormField = forwardRef<HTMLInputElement, AuthFormFieldProps>(function AuthFormField(
  {
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
    onBlur,
    name,
    error,
    hint,
    inputClassName
  },
  ref
) {
  return (
    <div className="flex flex-col gap-2">
      <div className={labelRight ? 'flex items-center justify-between' : undefined}>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {labelRight}
      </div>
      <Input
        ref={ref}
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={!!error || undefined}
        className={inputClassName}
      />
      {error ? (
        <p className="text-destructive flex items-center gap-1 text-xs">
          <AlertCircle size={12} className="shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          <Info size={12} className="shrink-0" />
          {hint}
        </p>
      ) : null}
    </div>
  );
});
