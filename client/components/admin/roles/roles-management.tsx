'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import type { GrantEffect, RoleAction, RolePermissionRequest, RoleRecordResponse } from '@/api/types.gen';
import { RBAC_COPY } from '@/constants/rbac-management';
import { useRbacFeatures } from '@/hooks/use-rbac-features';
import { useRbacRoles } from '@/hooks/use-rbac-roles';
import { RbacDeleteDialog } from '../shared/rbac-delete-dialog';
import { RoleFormDialog } from './role-form-dialog';
import { RolesTable } from './roles-table';
import { createEmptyRoleForm, createRolePermissionDraftMap, type RoleFormValues, type RolePermissionDraftMap } from '../shared/rbac-management-shared';

function buildPermissionsPayload(permissionDrafts: RolePermissionDraftMap): RolePermissionRequest[] {
  return Object.entries(permissionDrafts)
    .filter(([, permission]) => permission.actions.length > 0)
    .map(([featureId, permission]) => ({
      actions: permission.actions,
      effect: permission.effect,
      feature_id: featureId
    }));
}

function isProtectedRole(role: RoleRecordResponse) {
  return role.is_system && role.name === 'system_administrator';
}

export function RolesManagement() {
  const {
    createRole,
    deleteRole,
    error: rolesError,
    isDeleting,
    isEmpty,
    isLoading,
    isSaving,
    refresh,
    roles,
    updateRole
  } = useRbacRoles();
  const { features, isLoading: isLoadingFeatures } = useRbacFeatures();
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [values, setValues] = useState<RoleFormValues>(createEmptyRoleForm());
  const [permissionDrafts, setPermissionDrafts] = useState<RolePermissionDraftMap>({});
  const [selectedRole, setSelectedRole] = useState<RoleRecordResponse | null>(null);
  const [formError, setFormError] = useState<string | undefined>();
  const [rolePendingDelete, setRolePendingDelete] = useState<RoleRecordResponse | null>(null);

  function resetForm() {
    setIsFormOpen(false);
    setMode('create');
    setValues(createEmptyRoleForm());
    setPermissionDrafts({});
    setSelectedRole(null);
    setFormError(undefined);
  }

  function openCreateDialog() {
    setMode('create');
    setValues(createEmptyRoleForm());
    setPermissionDrafts({});
    setSelectedRole(null);
    setFormError(undefined);
    setIsFormOpen(true);
  }

  function openEditDialog(role: RoleRecordResponse) {
    setMode('edit');
    setSelectedRole(role);
    setValues({
      description: role.description ?? '',
      is_default: role.is_default ?? false,
      is_system: role.is_system ?? false,
      name: role.name
    });
    setPermissionDrafts(createRolePermissionDraftMap(role.permissions));
    setFormError(undefined);
    setIsFormOpen(true);
  }

  function handlePermissionActionToggle(featureId: string, action: RoleAction) {
    setPermissionDrafts((currentDrafts) => {
      const currentPermission = currentDrafts[featureId] ?? { actions: [], effect: 'allow' as GrantEffect };
      const nextActions = currentPermission.actions.includes(action)
        ? currentPermission.actions.filter((currentAction) => currentAction !== action)
        : [...currentPermission.actions, action];

      if (nextActions.length === 0) {
        const remainingDrafts = { ...currentDrafts };
        delete remainingDrafts[featureId];
        return remainingDrafts;
      }

      return {
        ...currentDrafts,
        [featureId]: {
          actions: nextActions,
          effect: currentPermission.effect
        }
      };
    });
    setFormError(undefined);
  }

  function handlePermissionEffectChange(featureId: string, effect: GrantEffect) {
    setPermissionDrafts((currentDrafts) => ({
      ...currentDrafts,
      [featureId]: {
        actions: currentDrafts[featureId]?.actions ?? [],
        effect
      }
    }));
    setFormError(undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      description: values.description.trim() || null,
      is_default: values.is_default,
      is_system: values.is_system,
      name: values.name.trim(),
      permissions: buildPermissionsPayload(permissionDrafts)
    };

    if (!payload.name) {
      setFormError('Role name is required.');
      return;
    }

    const response =
      mode === 'create' ? await createRole(payload) : selectedRole ? await updateRole(selectedRole.id, payload) : null;

    if (!response) return;

    resetForm();
  }

  async function handleDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!rolePendingDelete) return;
    if (isProtectedRole(rolePendingDelete)) return;

    const deleted = await deleteRole(rolePendingDelete.id);

    if (!deleted) return;

    setRolePendingDelete(null);
  }

  return (
    <>
      <RolesTable
        error={rolesError}
        isEmpty={isEmpty}
        isLoading={isLoading}
        onCreate={openCreateDialog}
        onDelete={(role) => {
          if (isProtectedRole(role)) return;
          setRolePendingDelete(role);
        }}
        onEdit={openEditDialog}
        onRefresh={refresh}
        roles={roles}
      />

      <RoleFormDialog
        availableFeatures={features}
        error={formError}
        isLoadingFeatures={isLoadingFeatures}
        isSaving={isSaving}
        mode={mode}
        onClose={resetForm}
        onPermissionActionToggle={handlePermissionActionToggle}
        onPermissionEffectChange={handlePermissionEffectChange}
        onSubmit={handleSubmit}
        onValuesChange={(nextValues) => {
          setValues(nextValues);
          setFormError(undefined);
        }}
        open={isFormOpen}
        permissionDrafts={permissionDrafts}
        selectedRole={selectedRole}
        values={values}
      />

      <RbacDeleteDialog
        description={
          rolePendingDelete
            ? `${isProtectedRole(rolePendingDelete) ? 'System Administrator cannot be deleted.' : RBAC_COPY.roles.deleteDescription} Selected role: ${rolePendingDelete.name}.`
            : RBAC_COPY.roles.deleteDescription
        }
        isDeleting={isDeleting}
        onClose={() => setRolePendingDelete(null)}
        onConfirm={handleDelete}
        open={Boolean(rolePendingDelete)}
        title={RBAC_COPY.roles.deleteTitle}
      />
    </>
  );
}
