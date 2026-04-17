import type { GrantEffect, RoleAction } from '@/api/types.gen';

export type RoleFormValues = {
  description: string;
  is_default: boolean;
  is_system: boolean;
  name: string;
};

export type RolePermissionDraft = {
  actions: RoleAction[];
  effect: GrantEffect;
};

export type RolePermissionDraftMap = Record<string, RolePermissionDraft>;
