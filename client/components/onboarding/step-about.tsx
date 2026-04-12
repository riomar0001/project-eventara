'use client';

import { AGE_GROUP_OPTIONS, EDUCATION_LEVEL_OPTIONS, GENDER_OPTIONS } from '@/constants/onboarding';
import { OptionCard } from './option-card';
import { cn } from '@/lib/utils';

export interface AboutFields {
  age_group: string;
  gender: string;
  education_level: string;
}

interface StepAboutProps {
  values: AboutFields;
  onChange: (fields: Partial<AboutFields>) => void;
  errors: Partial<Record<keyof AboutFields, string>>;
}

export function StepAbout({ values, onChange, errors }: StepAboutProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Age group */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Age group</span>
        <div className="grid grid-cols-4 gap-2">
          {AGE_GROUP_OPTIONS.map((opt) => (
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
          {GENDER_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              selected={values.gender === opt.value}
              onSelect={(v) => onChange({ gender: v })}
            />
          ))}
        </div>
        {errors.gender && <p className="text-destructive text-xs">{errors.gender}</p>}
      </div>

      {/* Education level */}
      <div className="flex flex-col gap-2">
        <label htmlFor="education_level" className="text-sm font-medium">
          Education level
        </label>
        <select
          id="education_level"
          value={values.education_level}
          onChange={(e) => onChange({ education_level: e.target.value })}
          className={cn(
            'bg-input/50 focus-visible:border-ring focus-visible:ring-ring/30',
            'h-9 w-full min-w-0 appearance-none rounded-xl border border-transparent px-3 py-1 text-sm',
            'transition-[color,box-shadow,background-color] outline-none',
            'focus-visible:ring-3',
            !values.education_level && 'text-muted-foreground',
            errors.education_level && 'border-destructive ring-3 ring-destructive/20'
          )}
        >
          <option value="" disabled>
            Select your education level
          </option>
          {EDUCATION_LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.education_level && <p className="text-destructive text-xs">{errors.education_level}</p>}
      </div>
    </div>
  );
}
