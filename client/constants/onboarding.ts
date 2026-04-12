export const ONBOARDING_STEPS = [
  {
    step: 1,
    title: "Let's get started",
    description: 'Set up your public identity on Eventara.'
  },
  {
    step: 2,
    title: 'Tell us about you',
    description: 'Help us personalise your experience.'
  },
  {
    step: 3,
    title: 'Almost there',
    description: 'A few optional details to complete your profile.'
  }
] as const;

export const AGE_GROUP_OPTIONS = [
  { value: 'child', label: 'Child', description: 'Under 13' },
  { value: 'teen', label: 'Teen', description: '13 – 17' },
  { value: 'adult', label: 'Adult', description: '18 – 59' },
  { value: 'senior', label: 'Senior', description: '60+' }
] as const;

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' }
] as const;

export const EDUCATION_LEVEL_OPTIONS = [
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
] as const;
