import { jwtDecode, JwtPayload } from 'jwt-decode';

export interface AuthUser {
  id: string;
  email: string;
  doneOnboarding: boolean;
  role?: string;
  firstName?: string;
  lastName?: string;
  alias?: string;
  ageGroup?: string;
  gender?: string;
  educationLevel?: string;
  occupation?: string;
  bio?: string;
  image?: string;
}

interface RawTokenPayload extends JwtPayload {
  email?: string;
  done_onboarding?: boolean;
  role?: string;
  first_name?: string;
  last_name?: string;
  alias?: string;
  age_group?: string;
  gender?: string;
  education_level?: string;
  occupation?: string;
  bio?: string;
  image?: string;
}

export function decodeTokenUser(token: string): AuthUser | null {
  try {
    const p = jwtDecode<RawTokenPayload>(token);
    if (typeof p.sub !== 'string' || typeof p.email !== 'string') return null;
    return {
      id: p.sub,
      email: p.email,
      doneOnboarding: Boolean(p.done_onboarding),
      role: p.role ?? undefined,
      firstName: p.first_name ?? undefined,
      lastName: p.last_name ?? undefined,
      alias: p.alias ?? undefined,
      ageGroup: p.age_group ?? undefined,
      gender: p.gender ?? undefined,
      educationLevel: p.education_level ?? undefined,
      occupation: p.occupation ?? undefined,
      bio: p.bio ?? undefined,
      image: p.image ?? undefined,
    };
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const p = jwtDecode<JwtPayload>(token);
    return typeof p.exp === 'number' ? Date.now() >= p.exp * 1000 : true;
  } catch {
    return true;
  }
}
