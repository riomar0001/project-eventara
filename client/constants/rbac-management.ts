import type { GrantEffect, RoleAction } from '@/api/types.gen';

export const RBAC_PROTECTED_ROLE_DELETE_MESSAGE = 'System Administrator cannot be deleted.';

export const RBAC_ROLE_ACTIONS: RoleAction[] = ['create', 'read', 'update', 'delete'];

export const RBAC_GRANT_EFFECTS: Array<{ label: string; value: GrantEffect }> = [
  { label: 'Allow', value: 'allow' },
  { label: 'Deny', value: 'deny' }
];

export const RBAC_COPY = {
  features: {
    badge: 'Access Surface',
    title: 'Features Management',
    description: 'Curate the feature registry that powers route guards, special grants, and role matrices across the admin stack.',
    addCta: 'Add feature',
    emptyTitle: 'No features yet',
    emptyDescription: 'Create the first RBAC feature so roles can start mapping access across the platform.',
    createTitle: 'Create feature',
    editTitle: 'Edit feature',
    deleteTitle: 'Delete feature',
    deleteDescription: 'This removes the feature definition from the RBAC catalog. Existing dependencies must be cleared first.',
    savedCreate: 'Feature created successfully.',
    savedUpdate: 'Feature updated successfully.',
    savedDelete: 'Feature deleted successfully.'
  },
  roles: {
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
    protectedDeleteDescription: RBAC_PROTECTED_ROLE_DELETE_MESSAGE,
    savedCreate: 'Role created successfully.',
    savedUpdate: 'Role updated successfully.',
    savedDelete: 'Role deleted successfully.'
  }
} as const;
