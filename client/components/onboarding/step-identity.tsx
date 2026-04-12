'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

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

function FieldWrapper({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium">
      {children}
    </label>
  );
}

function FieldHint({ error, hint }: { error?: string; hint?: string }) {
  if (error) return <p className="text-destructive text-xs">{error}</p>;
  if (hint) return <p className="text-muted-foreground text-xs">{hint}</p>;
  return null;
}

export function StepIdentity({ values, onChange, errors }: StepIdentityProps) {
  const [debouncedAlias, setDebouncedAlias] = useState(values.alias);

  // setState is inside the timeout callback — not synchronous in the effect body
  useEffect(() => {
    const t = setTimeout(() => setDebouncedAlias(values.alias), 500);
    return () => clearTimeout(t);
  }, [values.alias]);

  const aliasCheckable = values.alias.length >= 3 && /^[a-z0-9_]+$/.test(values.alias);

  // Derived — no setState needed for the status itself
  // TODO: when API is integrated, extend with 'available' | 'taken' from the response
  const aliasStatus: 'idle' | 'checking' = aliasCheckable && values.alias !== debouncedAlias ? 'checking' : 'idle';

  return (
    <div className="flex flex-col gap-3 sm:gap-5">
      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <FieldWrapper>
          <FieldLabel htmlFor="first_name">First name</FieldLabel>
          <Input
            id="first_name"
            placeholder="Jane"
            autoComplete="given-name"
            value={values.first_name}
            onChange={(e) => onChange({ first_name: e.target.value })}
            aria-invalid={!!errors.first_name || undefined}
            className="bg-white text-sm"
          />
          <FieldHint error={errors.first_name} />
        </FieldWrapper>

        <FieldWrapper>
          <FieldLabel htmlFor="last_name">Last name</FieldLabel>
          <Input
            id="last_name"
            placeholder="Doe"
            autoComplete="family-name"
            value={values.last_name}
            onChange={(e) => onChange({ last_name: e.target.value })}
            aria-invalid={!!errors.last_name || undefined}
            className="bg-white text-sm"
          />
          <FieldHint error={errors.last_name} />
        </FieldWrapper>
      </div>

      {/* Nickname field */}
      <FieldWrapper>
        <FieldLabel htmlFor="alias">Nickname</FieldLabel>
        <div className="relative">
          <Input
            id="alias"
            type="text"
            placeholder="jane_doe"
            autoComplete="nickname"
            value={values.alias}
            onChange={(e) => onChange({ alias: e.target.value.toLowerCase() })}
            aria-invalid={!!errors.alias || undefined}
            className="pr-9 text-sm"
          />
          <div className="absolute top-1/2 right-3 -translate-y-1/2">
            {aliasStatus === 'checking' && <Loader2 className="text-muted-foreground size-3.5 animate-spin" />}
          </div>
        </div>
        {errors.alias ? (
          <p className="text-destructive text-xs">{errors.alias}</p>
        ) : (
          <p className="text-muted-foreground text-xs">Lowercase letters, numbers, and underscores only.</p>
        )}
      </FieldWrapper>
    </div>
  );
}
