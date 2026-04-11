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
    const [, raw] = token.split('.');
    if (!raw) return null;

    const json = atob(raw.replace(/-/g, '+').replace(/_/g, '/'));
    const p: RawTokenPayload = JSON.parse(json);

    if (typeof p.sub !== 'string' || typeof p.email !== 'string') return null;

    return {
      id: p.sub,
      email: p.email,
      doneOnboarding: Boolean(p.done_onboarding),
      roleId: p.role_id ?? undefined,
      firstName: p.first_name ?? undefined,
      lastName: p.last_name ?? undefined
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
