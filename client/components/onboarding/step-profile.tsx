'use client';

import { AuthFormField } from '@/components/auth/form-field';
import { cn } from '@/lib/utils';

export interface ProfileFields {
  occupation: string;
  bio: string;
}

interface StepProfileProps {
  values: ProfileFields;
  onChange: (fields: Partial<ProfileFields>) => void;
  errors: Partial<Record<keyof ProfileFields, string>>;
}

export function StepProfile({ values, onChange, errors }: StepProfileProps) {
  return (
    <div className="flex flex-col gap-5">
      <AuthFormField
        id="occupation"
        label="Occupation"
        placeholder="e.g. Software Engineer"
        value={values.occupation}
        onChange={(e) => onChange({ occupation: e.target.value })}
        error={errors.occupation}
        hint="Optional — max 150 characters."
      />

      {/* Bio textarea */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="bio" className="text-sm font-medium">
            Bio
          </label>
          <span className="text-muted-foreground text-xs">{values.bio.length} / 500</span>
        </div>
        <textarea
          id="bio"
          placeholder="Tell others a little about yourself…"
          value={values.bio}
          maxLength={500}
          rows={4}
          onChange={(e) => onChange({ bio: e.target.value })}
          className={cn(
            'bg-input/50 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30',
            'w-full min-w-0 resize-none rounded-xl border border-transparent px-3 py-2 text-sm',
            'transition-[color,box-shadow,background-color] outline-none',
            'focus-visible:ring-3',
            errors.bio && 'border-destructive ring-3 ring-destructive/20'
          )}
        />
        {errors.bio ? (
          <p className="text-destructive text-xs">{errors.bio}</p>
        ) : (
          <p className="text-muted-foreground text-xs">Optional — introduce yourself to the community.</p>
        )}
      </div>
    </div>
  );
}
