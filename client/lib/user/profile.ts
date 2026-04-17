import { PROFILE_COMPLETION_FIELDS } from '@/constants/user/profile';
import type { AuthUser } from '@/lib/auth/token';

export function getDisplayName(user: AuthUser | null | undefined) {
  if (!user) return 'My Account';

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;
  if (user.alias) return user.alias;
  if (user.email) return user.email.split('@')[0];

  return 'My Account';
}

export function getInitials(user: AuthUser | null | undefined) {
  if (!user) return 'UA';

  const fromNames = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((part) => part!.trim()[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (fromNames) return fromNames;

  if (user.alias) {
    return (
      user.alias
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 2)
        .toUpperCase() || 'UA'
    );
  }

  if (user.email) {
    return user.email.slice(0, 2).toUpperCase();
  }

  return 'UA';
}

export function getProfileHandle(user: AuthUser | null | undefined) {
  if (!user) return '@eventara';
  if (user.alias) return `@${user.alias}`;
  return `@${user.email.split('@')[0]}`;
}

export function getRoleLabel(role: string | undefined) {
  if (!role) return 'Member';
  return role.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function humanizeProfileValue(value: string | undefined) {
  if (!value) return 'Not set';

  return value
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getProfileCompletion(user: AuthUser | null | undefined) {
  if (!user) return 0;

  const completedFields = PROFILE_COMPLETION_FIELDS.filter((field) => Boolean(user[field] && String(user[field]).trim())).length;

  return Math.round((completedFields / PROFILE_COMPLETION_FIELDS.length) * 100);
}

