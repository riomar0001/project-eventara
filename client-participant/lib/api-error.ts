const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const RULES: Array<[RegExp, string]> = [
  // Session registration
  [/already registered for event session/i, "You're already registered for this session."],
  [/registration is not open|not open for (this )?session/i, "This session isn't open for registration right now."],
  [/is full|no slots remaining/i, "This session is full. No more spots available."],
  [/event participant not found/i, "Registration not found. You may not be registered for this session."],
  [/already checked in/i, "You've already been checked in to this session."],
  [/check-in is not open/i, "Check-in isn't open for this session yet."],
  [/cannot transition event participant/i, "This action isn't allowed for your current registration status."],

  // Venue rating
  [/already rated (this )?venue|has already rated/i, "You've already rated this venue."],
  [/venue rating not found/i, "Your rating wasn't found. It may have already been removed."],
  [/venue rating validation/i, "Your rating couldn't be saved. Please check your input."],

  // Auth
  [/token has expired/i, "Your session has expired. Please sign in again."],
  [/invalid.*token|malformed token/i, "Your session is invalid. Please sign in again."],
  [/invalid email or password/i, "Incorrect email or password. Please try again."],
  [/invalid or expired verification code/i, "That code is incorrect or has expired. Please try again."],
  [/account is temporarily locked/i, "Your account is temporarily locked. Please try again later or reset your password."],
  [/account is inactive|has been deleted/i, "This account is no longer active. Please contact support."],
  [/email must be verified/i, "Please verify your email address before continuing."],

  // Profile / account
  [/alias.*already taken|already taken.*alias/i, "That username is already taken. Please choose a different one."],
  [/email.*already registered|already registered.*email/i, "That email is already registered. Try signing in instead."],
  [/new (email|password) must be different/i, "Your new value can't be the same as the current one."],
  [/account deletion.*already scheduled/i, "Your account is already scheduled for deletion."],
  [/profile not found/i, "Your profile couldn't be found. Please complete your account setup."],
  [/onboarding.*already completed/i, "Your account setup is already complete."],

  // Events
  [/event not found/i, "This event couldn't be found. It may have been removed."],
  [/event.*cannot be deleted/i, "This event can't be deleted in its current state."],

  // Generic permission
  [/you do not have permission/i, "You don't have permission to do this."],
];

/**
 * Converts a raw server error message into something a user can understand.
 * Rejects any message containing a UUID and maps known patterns to friendly copies.
 */
export function humanizeApiError(message: string | null | undefined, fallback: string): string {
  if (!message) return fallback;
  if (UUID_RE.test(message)) return fallback;

  for (const [pattern, friendly] of RULES) {
    if (pattern.test(message)) return friendly;
  }

  return message;
}
