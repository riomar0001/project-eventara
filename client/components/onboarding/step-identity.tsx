'use client';

import { useState, useEffect } from 'react';
import { AtSign, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { AuthFormField } from '@/components/auth/form-field';
import { cn } from '@/lib/utils';

export interface IdentityFields {
  first_name: string;
  last_name: string;
  alias: string;
}

interface StepIdentityProps {
  values: IdentityFields;
  onChange: (fields: Partial<IdentityFields>) => void;
  errors: Partial<Record<keyof IdentityFields, string>>;
}

type AliasStatus = 'idle' | 'checking' | 'available' | 'taken';

export function StepIdentity({ values, onChange, errors }: StepIdentityProps) {
  const [aliasStatus, setAliasStatus] = useState<AliasStatus>('idle');

  // Debounce alias check simulation (no API yet)
  useEffect(() => {
    if (!values.alias || values.alias.length < 3) {
      setAliasStatus('idle');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(values.alias)) {
      setAliasStatus('idle');
      return;
    }
    setAliasStatus('checking');
    const t = setTimeout(() => {
      // TODO: integrate GET /user/check-alias?alias={alias}
      setAliasStatus('idle');
    }, 600);
    return () => clearTimeout(t);
  }, [values.alias]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <AuthFormField
          id="first_name"
          label="First name"
          placeholder="Jane"
          autoComplete="given-name"
          value={values.first_name}
          onChange={(e) => onChange({ first_name: e.target.value })}
          error={errors.first_name}
        />
        <AuthFormField
          id="last_name"
          label="Last name"
          placeholder="Doe"
          autoComplete="family-name"
          value={values.last_name}
          onChange={(e) => onChange({ last_name: e.target.value })}
          error={errors.last_name}
        />
      </div>

      {/* Alias field with status indicator */}
      <div className="flex flex-col gap-2">
        <label htmlFor="alias" className="text-sm font-medium">
          Nickname
        </label>
        <div className="relative">
          <AtSign className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            id="alias"
            type="text"
            placeholder="jane_doe"
            autoComplete="nickname"
            value={values.alias}
            onChange={(e) => onChange({ alias: e.target.value.toLowerCase() })}
            aria-invalid={!!errors.alias || undefined}
            className={cn(
              'bg-input/50 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30',
              'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
              'h-9 w-full min-w-0 rounded-xl border border-transparent pl-9 pr-9 py-1 text-sm',
              'transition-[color,box-shadow,background-color] outline-none',
              'focus-visible:ring-3',
              aliasStatus === 'available' && 'border-primary/50'
            )}
          />
          {/* Status icon */}
          <div className="absolute top-1/2 right-3 -translate-y-1/2">
            {aliasStatus === 'checking' && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
            {aliasStatus === 'available' && <CheckCircle2 className="text-primary size-4" />}
            {aliasStatus === 'taken' && <XCircle className="text-destructive size-4" />}
          </div>
        </div>
        {errors.alias ? (
          <p className="text-destructive text-xs">{errors.alias}</p>
        ) : (
          <p className="text-muted-foreground text-xs">Lowercase letters, numbers, and underscores only.</p>
        )}
        {aliasStatus === 'taken' && !errors.alias && (
          <p className="text-destructive text-xs">This username is already taken.</p>
        )}
      </div>
    </div>
  );
}
