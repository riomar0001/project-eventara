'use client';

import { AlertCircle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { FieldHint } from '@/components/system/forms/field-hint';
import { Input } from '@/components/ui/input';
import type { AliasStatus } from '@/hooks/onboarding/use-alias-availability';
import type { IdentityFields } from '@/hooks/onboarding/use-onboarding-form';
import { cn } from '@/lib/utils';

interface StepIdentityProps {
  values: IdentityFields;
  onChange: (fields: Partial<IdentityFields>) => void;
  errors: Partial<Record<keyof IdentityFields, string>>;
  aliasStatus: AliasStatus;
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

export function StepIdentity({ values, onChange, errors, aliasStatus }: StepIdentityProps) {
  const aliasIcon = (() => {
    if (aliasStatus === 'checking') return <Loader2 className="text-muted-foreground size-3.5 animate-spin" />;
    if (aliasStatus === 'available') return <CheckCircle2 className="size-3.5 text-lime-600" />;
    if (aliasStatus === 'taken') return <XCircle className="text-destructive size-3.5" />;
    if (aliasStatus === 'error') return <AlertCircle className="size-3.5 text-amber-600" />;
    return null;
  })();

  return (
    <div className="flex flex-col gap-3 sm:gap-5">
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
        <FieldHint
          error={errors.alias}
          hint={
            aliasStatus === 'taken'
              ? 'That nickname is already taken.'
              : aliasStatus === 'available'
                ? 'Nickname is available!'
                : aliasStatus === 'error'
                  ? 'Could not verify nickname availability right now.'
                  : 'Lowercase letters, numbers, and underscores only.'
          }
          hintClassName={aliasStatus === 'available' ? 'text-lime-600' : undefined}
        />
      </FieldWrapper>
    </div>
  );
}
