export const DELETE_ACCOUNT_REASON_OPTIONS = [
  "I no longer need the platform",
  "I have a duplicate account",
  "Privacy concerns",
  "Too many emails / notifications",
  "I didn't find any useful events",
  "Other"
] as const;

export type DeleteAccountReason = (typeof DELETE_ACCOUNT_REASON_OPTIONS)[number];

export const DELETE_ACCOUNT_OTHER_REASON = 'Other' satisfies DeleteAccountReason;

export const DELETE_CONFIRMATION_WORD = 'DELETE';
