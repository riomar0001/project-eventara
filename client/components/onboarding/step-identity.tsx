'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { User } from '@/api/sdk.gen';
import { cn } from '@/lib/utils';

export interface IdentityFields {
  first_name: string;
  last_name: string;
  alias: string;
}

export type AliasStatus = 'idle' | 'checking' | 'available' | 'taken';

interface StepIdentityProps {
  values: IdentityFields;
  onChange: (fields: Partial<IdentityFields>) => void;
  errors: Partial<Record<keyof IdentityFields, string>>;
  onAliasStatus?: (status: AliasStatus) => void;
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

export function StepIdentity({ values, onChange, errors, onAliasStatus }: StepIdentityProps) {
  // The debounced alias is set inside a setTimeout callback — never synchronously in an effect body.
  const [debouncedAlias, setDebouncedAlias] = useState('');
  // apiResult tracks what the server said about the last checked alias.
  const [apiResult, setApiResult] = useState<'idle' | 'available' | 'taken'>('idle');
  // checkedFor records which alias apiResult belongs to, so stale results are never shown.
  const [checkedFor, setCheckedFor] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const aliasCheckable = values.alias.length >= 3 && /^[a-z0-9_]+$/.test(values.alias);

  // Derive aliasStatus — no setState needed, so no synchronous setState in effects.
  const aliasStatus: AliasStatus = !aliasCheckable ? 'idle' : values.alias !== debouncedAlias || debouncedAlias !== checkedFor ? 'checking' : apiResult;

  // Notify the parent whenever the derived status changes.
  useEffect(() => {
    onAliasStatus?.(aliasStatus);
  }, [aliasStatus, onAliasStatus]);

  // Debounce: update debouncedAlias 500 ms after the user stops typing.
  // setState is only called inside the timeout callback, not in the effect body.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedAlias(values.alias), 500);
    return () => clearTimeout(t);
  }, [values.alias]);

  // API call: fires when debouncedAlias settles on a valid, checkable alias.
  // setState is only called inside the .then() callback, not in the effect body.
  useEffect(() => {
    if (!aliasCheckable || !debouncedAlias) return;

    let cancelled = false;
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    User.checkAliasUserCheckAliasGet({
      query: { alias: debouncedAlias },
      throwOnError: false
    }).then((result) => {
      if (cancelled) return;
      const next = result.data ? (result.data.available ? 'available' : 'taken') : 'idle';
      setApiResult(next);
      setCheckedFor(debouncedAlias);
    });

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [debouncedAlias, aliasCheckable]);

  const aliasIcon = (() => {
    if (aliasStatus === 'checking') return <Loader2 className="text-muted-foreground size-3.5 animate-spin" />;
    if (aliasStatus === 'available') return <CheckCircle2 className="size-3.5 text-lime-600" />;
    if (aliasStatus === 'taken') return <XCircle className="text-destructive size-3.5" />;
    return null;
  })();

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
            aria-invalid={!!errors.alias || aliasStatus === 'taken' || undefined}
            className={cn('pr-9 text-sm', aliasStatus === 'available' && 'border-lime-600 ring-3 ring-lime-600/20')}
          />
          <div className="absolute top-1/2 right-3 -translate-y-1/2">{aliasIcon}</div>
        </div>
        {errors.alias ? (
          <p className="text-destructive text-xs">{errors.alias}</p>
        ) : aliasStatus === 'taken' ? (
          <p className="text-destructive text-xs">That nickname is already taken.</p>
        ) : aliasStatus === 'available' ? (
          <p className="text-xs text-lime-600">Nickname is available!</p>
        ) : (
          <p className="text-muted-foreground text-xs">Lowercase letters, numbers, and underscores only.</p>
        )}
      </FieldWrapper>
    </div>
  );
}
