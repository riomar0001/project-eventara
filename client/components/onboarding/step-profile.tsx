'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ProfileFields } from '@/hooks/onboarding/use-onboarding-form';
import { PROFILE_BIO_MAX_LENGTH, PROFILE_OCCUPATION_MAX_LENGTH } from '@/constants/user/profile';
import { cn } from '@/lib/utils';

interface StepProfileProps {
  values: ProfileFields;
  onChange: (fields: Partial<ProfileFields>) => void;
  errors: Partial<Record<keyof ProfileFields, string>>;
}

export function StepProfile({ values, onChange, errors }: StepProfileProps) {
  const bioLength = values.bio.length;
  const bioNearLimit = bioLength > 400;

  return (
    <div className="flex flex-col gap-3 sm:gap-5">
      {/* Occupation */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="occupation" className="text-sm font-medium">
            Occupation
          </label>
          <span className="text-muted-foreground text-xs">Optional</span>
        </div>
        <Input
          id="occupation"
          placeholder="e.g. Software Engineer"
          value={values.occupation}
          maxLength={PROFILE_OCCUPATION_MAX_LENGTH}
          onChange={(e) => onChange({ occupation: e.target.value })}
          aria-invalid={!!errors.occupation || undefined}
          className="text-sm"
        />
        {errors.occupation ? (
          <p className="text-destructive text-xs">{errors.occupation}</p>
        ) : (
          <p className="text-muted-foreground text-xs">Max 150 characters.</p>
        )}
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="bio" className="text-sm font-medium">
            Bio
          </label>
          <span className={cn('text-xs tabular-nums transition-colors', bioNearLimit ? 'text-amber-500' : 'text-muted-foreground')}>
            {bioLength} / {PROFILE_BIO_MAX_LENGTH}
          </span>
        </div>
        <Textarea
          id="bio"
          placeholder="Tell others a little about yourself…"
          value={values.bio}
          maxLength={PROFILE_BIO_MAX_LENGTH}
          rows={8}
          onChange={(e) => onChange({ bio: e.target.value })}
          aria-invalid={!!errors.bio || undefined}
          className="min-h-28 text-sm"
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
