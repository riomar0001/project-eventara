export interface AuthUser {
  id: string;
  email: string;
  doneOnboarding: boolean;
  roleId?: string;
  firstName?: string;
  lastName?: string;
}

interface RawTokenPayload {
  sub: string;
  email: string;
  done_onboarding?: boolean;
  role_id?: string;
  first_name?: string;
  last_name?: string;
  exp?: number;
}

/**
 * Decodes a JWT access token (without verification — trust is established
 * by the server-issued httpOnly refresh cookie flow) and maps the payload
 * to the client AuthUser shape.
 *
 * Returns null if the token is malformed or missing required claims.
 */
export function decodeTokenUser(token: string): AuthUser | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    // Base64url → Base64 → JSON
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const p: TokenPayload = JSON.parse(json);
    return {
      id: p.sub,
      email: p.email,
      role: p.role,
      first_name: p.first_name ?? '',
      last_name: p.last_name ?? '',
      ...(p.applicant_profile_id && {
        applicant_profile_id: p.applicant_profile_id
      }),
      ...(p.company_id && { company_id: p.company_id })
    };
  } catch {
    return null;
  }
}

/**
 * Returns the UTC expiry timestamp (ms) from a JWT, or null if unreadable.
 */
export function getTokenExpiry(token: string): number | null {
  try {
    const [, raw] = token.split('.');
    if (!raw) return null;
    const json = atob(raw.replace(/-/g, '+').replace(/_/g, '/'));
    const p: { exp?: number } = JSON.parse(json);
    return typeof p.exp === 'number' ? p.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const expiry = getTokenExpiry(token);
  if (expiry === null) return true;
  return Date.now() >= expiry;
}
