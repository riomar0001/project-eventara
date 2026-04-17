import type { GrantEffect, RoleAction } from '@/api/types.gen';

export const PROTECTED_ROLE_DELETE_MESSAGE = 'System Administrator cannot be deleted.';

export const ROLE_ACTION_OPTIONS: RoleAction[] = ['create', 'read', 'update', 'delete'];

export const ACCESS_EFFECT_OPTIONS: Array<{ label: string; value: GrantEffect }> = [
  { label: 'Allow', value: 'allow' },
  { label: 'Deny', value: 'deny' }
];

export const ROLE_ACCESS_TEXT = {
  badge: 'Permission Matrix',
  title: 'Roles Management',
  description: 'Shape reusable access bundles by combining features, action scopes, and explicit allow or deny effects in one role catalog.',
  addCta: 'Add role',
  emptyTitle: 'No roles yet',
  emptyDescription: 'Create the first role definition to start assigning curated permissions to users.',
  createTitle: 'Create role',
  editTitle: 'Edit role',
  deleteTitle: 'Delete role',
  deleteDescription: 'This removes the role definition. Existing user assignments and grants must be removed first.',
  protectedDeleteDescription: PROTECTED_ROLE_DELETE_MESSAGE,
  savedCreate: 'Role created successfully.',
  savedUpdate: 'Role updated successfully.',
  savedDelete: 'Role deleted successfully.'
} as const;
