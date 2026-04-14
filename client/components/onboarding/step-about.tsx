'use client';

import { ChevronDown } from 'lucide-react';
import type { AboutFields } from '@/hooks/use-onboarding-form';
import { OptionCard } from './option-card';
import { PROFILE_AGE_GROUP_OPTIONS, PROFILE_EDUCATION_LEVEL_OPTIONS, PROFILE_GENDER_OPTIONS } from '@/constants/profile';
import { cn } from '@/lib/utils';

interface StepAboutProps {
  values: AboutFields;
  onChange: (fields: Partial<AboutFields>) => void;
  errors: Partial<Record<keyof AboutFields, string>>;
}

export function StepAbout({ values, onChange, errors }: StepAboutProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-5">
      {/* Age group */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Age group</span>
        <div className="grid grid-cols-4 gap-2">
          {PROFILE_AGE_GROUP_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              description={opt.description}
              selected={values.age_group === opt.value}
              onSelect={(v) => onChange({ age_group: v })}
            />
          ))}
        </div>
        {errors.age_group && <p className="text-destructive text-xs">{errors.age_group}</p>}
      </div>

      {/* Gender */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Gender</span>
        <div className="grid grid-cols-2 gap-2">
          {PROFILE_GENDER_OPTIONS.map((opt) => (
            <OptionCard key={opt.value} value={opt.value} label={opt.label} selected={values.gender === opt.value} onSelect={(v) => onChange({ gender: v })} />
          ))}
        </div>
        {errors.gender && <p className="text-destructive text-xs">{errors.gender}</p>}
      </div>

      {/* Education level */}
      <div className="flex flex-col gap-2">
        <label htmlFor="education_level" className="text-sm font-medium">
          Education level
        </label>
        <div className="relative">
          <select
            id="education_level"
            value={values.education_level}
            onChange={(e) => onChange({ education_level: e.target.value })}
            className={cn(
              'h-9 w-full appearance-none rounded-xl border px-3 pr-8 text-sm outline-none',
              'transition-[color,box-shadow,background-color]',
              'focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-3',
              !values.education_level && 'text-muted-foreground',
              errors.education_level && 'border-destructive ring-destructive/20 ring-3'
            )}
          >
            <option value="" disabled>
              Select your education level
            </option>
            {PROFILE_EDUCATION_LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2" />
        </div>
        {errors.education_level && <p className="text-destructive text-xs">{errors.education_level}</p>}
      </div>
    </div>
  );
}
