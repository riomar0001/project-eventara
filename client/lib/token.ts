import { jwtDecode, JwtPayload } from 'jwt-decode';

export interface AuthUser {
  id: string;
  email: string;
  doneOnboarding: boolean;
  roleId?: string;
  firstName?: string;
  lastName?: string;
  alias?: string;
  ageGroup?: string;
  gender?: string;
  educationLevel?: string;
  occupation?: string;
  bio?: string;
}

// Extending standard JwtPayload gives you 'sub' and 'exp' automatically
interface RawTokenPayload extends JwtPayload {
  email?: string;
  done_onboarding?: boolean;
  role_id?: string;
  first_name?: string;
  last_name?: string;
  alias?: string;
  age_group?: string;
  gender?: string;
  education_level?: string;
  occupation?: string;
  bio?: string;
}

/**
 * Decodes a JWT access token using jwt-decode (without verification — trust is established
 * by the server-issued httpOnly refresh cookie flow) and maps the payload
 * to the client AuthUser shape.
 *
 * Returns null if the token is malformed or missing required claims.
 */
export function decodeTokenUser(token: string): AuthUser | null {
  try {
    // jwtDecode handles the splitting, base64url decoding, and JSON parsing safely
    const p = jwtDecode<RawTokenPayload>(token);

    if (typeof p.sub !== 'string' || typeof p.email !== 'string') {
      return null;
    }

    return {
      id: p.sub,
      email: p.email,
      doneOnboarding: Boolean(p.done_onboarding),
      roleId: p.role_id ?? undefined,
      firstName: p.first_name ?? undefined,
      lastName: p.last_name ?? undefined,
      alias: p.alias ?? undefined,
      ageGroup: p.age_group ?? undefined,
      gender: p.gender ?? undefined,
      educationLevel: p.education_level ?? undefined,
      occupation: p.occupation ?? undefined,
      bio: p.bio ?? undefined
    };
  } catch {
    // jwtDecode throws an InvalidTokenError if the token is invalid/malformed
    return null;
  }
}

/**
 * Returns the UTC expiry timestamp (ms) from a JWT, or null if unreadable.
 */
export function getTokenExpiry(token: string): number | null {
  try {
    const p = jwtDecode<JwtPayload>(token);
    return typeof p.exp === 'number' ? p.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const expiry = getTokenExpiry(token);
  if (expiry === null) return true; // Treat unreadable/missing tokens as expired
  return Date.now() >= expiry;
}
