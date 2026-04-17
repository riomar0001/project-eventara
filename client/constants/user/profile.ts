import type { AgeGroup, EducationLevel, Gender } from '@/api/types.gen';

type ProfileOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

export const PROFILE_ALIAS_PATTERN = /^[a-z0-9_]+$/;
export const PROFILE_ALIAS_MIN_LENGTH = 3;
export const PROFILE_ALIAS_DEBOUNCE_MS = 450;
export const PROFILE_OCCUPATION_MAX_LENGTH = 150;
export const PROFILE_BIO_MAX_LENGTH = 500;

export const PROFILE_COMPLETION_FIELDS = ['alias', 'firstName', 'lastName', 'occupation', 'bio', 'ageGroup', 'gender', 'educationLevel'] as const;

export const PROFILE_AGE_GROUP_OPTIONS = [
  { value: 'child', label: 'Child', description: 'Under 13' },
  { value: 'teen', label: 'Teen', description: '13 - 17' },
  { value: 'adult', label: 'Adult', description: '18 - 59' },
  { value: 'senior', label: 'Senior', description: '60+' }
] as const satisfies readonly ProfileOption<AgeGroup>[];

export const PROFILE_GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' }
] as const satisfies readonly ProfileOption<Gender>[];

export const PROFILE_EDUCATION_LEVEL_OPTIONS = [
  { value: 'no_formal_education', label: 'No Formal Education' },
  { value: 'elementary_level', label: 'Elementary Level' },
  { value: 'elementary_graduate', label: 'Elementary Graduate' },
  { value: 'junior_high_school_level', label: 'Junior High School Level' },
  { value: 'junior_high_school_graduate', label: 'Junior High School Graduate' },
  { value: 'senior_high_school_level', label: 'Senior High School Level' },
  { value: 'senior_high_school_graduate', label: 'Senior High School Graduate' },
  { value: 'vocational_trade_certificate', label: 'Vocational / Trade Certificate' },
  { value: 'college_level_undergraduate', label: 'College Level (Undergraduate)' },
  { value: 'associate_degree', label: 'Associate Degree' },
  { value: 'bachelors_degree', label: "Bachelor's Degree" },
  { value: 'masters_degree', label: "Master's Degree" },
  { value: 'doctorate_degree', label: 'Doctorate Degree' }
] as const satisfies readonly ProfileOption<EducationLevel>[];
