import type { GrantEffect, RoleAction, UserStatus } from '@/api/types.gen';

export const STATUS_OPTIONS: { label: string; value: UserStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Locked', value: 'locked' },
  { label: 'Deleted', value: 'deleted' }
];

export const SPECIAL_PERMISSION_ACTIONS: RoleAction[] = ['create', 'read', 'update', 'delete'];

export const SPECIAL_PERMISSION_EFFECTS: Array<{ label: string; value: GrantEffect }> = [
  { label: 'Allow', value: 'allow' },
  { label: 'Deny', value: 'deny' }
];
