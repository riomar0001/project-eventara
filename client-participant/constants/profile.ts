export const AGE_GROUP_OPTIONS = [
  { value: 'child', label: 'Under 13' },
  { value: 'teen', label: '13–17' },
  { value: 'adult', label: '18–54' },
  { value: 'senior', label: '55+' },
] as const;

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
] as const;

export const EDUCATION_LEVEL_OPTIONS = [
  { value: 'no_formal_education', label: 'No formal education' },
  { value: 'elementary_level', label: 'Elementary level' },
  { value: 'elementary_graduate', label: 'Elementary graduate' },
  { value: 'junior_high_school_level', label: 'Junior high (level)' },
  { value: 'junior_high_school_graduate', label: 'Junior high (graduate)' },
  { value: 'senior_high_school_level', label: 'Senior high (level)' },
  { value: 'senior_high_school_graduate', label: 'Senior high (graduate)' },
  { value: 'vocational_trade_certificate', label: 'Vocational / Trade' },
  { value: 'college_level_undergraduate', label: 'College level' },
  { value: 'associate_degree', label: 'Associate degree' },
  { value: 'bachelors_degree', label: "Bachelor's degree" },
  { value: 'masters_degree', label: "Master's degree" },
  { value: 'doctorate_degree', label: 'Doctorate' },
] as const;

// Legacy string arrays kept for backwards compatibility
export const AGE_GROUPS = AGE_GROUP_OPTIONS.map((o) => o.label);
export const GENDERS = GENDER_OPTIONS.map((o) => o.label);
export const EDUCATION_LEVELS = EDUCATION_LEVEL_OPTIONS.map((o) => o.label);
