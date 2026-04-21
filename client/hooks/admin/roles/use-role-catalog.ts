'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Roles } from '@/api/sdk.gen';
import type { RoleCreateRequest, RoleRecordResponse, RoleUpdateRequest } from '@/api/types.gen';
import { ROLE_ACCESS_TEXT } from '@/constants/admin/roles/access-control';
import { getAccessToken } from '@/store/auth-store';

type RoleDraft = RoleCreateRequest;
type RoleCatalogApi = {
  createRoleRolesPost: typeof Roles.createRoleRolesPost;
  deleteRoleRolesRoleIdDelete: typeof Roles.deleteRoleRolesRoleIdDelete;
  listRolesRolesGet: typeof Roles.listRolesRolesGet;
  updateRoleRolesRoleIdPatch: typeof Roles.updateRoleRolesRoleIdPatch;
};

const roleCatalogApi: RoleCatalogApi = Roles;

function extractErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;

  const maybePayload = payload as { detail?: unknown; message?: unknown };

  if (typeof maybePayload.detail === 'string') return maybePayload.detail;

  if (Array.isArray(maybePayload.detail) && maybePayload.detail.length > 0) {
    const first = maybePayload.detail[0];

    if (typeof first === 'string') return first;

    if (first && typeof first === 'object') {
      const validationError = first as { msg?: unknown; message?: unknown };
      if (typeof validationError.msg === 'string') return validationError.msg;
      if (typeof validationError.message === 'string') return validationError.message;
    }
  }

  if (typeof maybePayload.message === 'string') return maybePayload.message;
  return undefined;
}

function getAccessErrorMessage(error: unknown, fallbackMessage: string) {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const responseData = (error as { response?: { data?: unknown } }).response?.data;
    const responseMessage = extractErrorMessage(responseData);
    if (responseMessage) return responseMessage;

    const payloadMessage = extractErrorMessage(error);
    if (payloadMessage) return payloadMessage;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallbackMessage;
}

function getRequestHeaders() {
  const accessToken = getAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

export function useRoleCatalog() {
  const [roles, setRoles] = useState<RoleRecordResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRoles() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await roleCatalogApi.listRolesRolesGet({
          headers: getRequestHeaders(),
          throwOnError: false
        });

        if (!result.data) {
          throw result.error ?? new Error('Unable to load roles right now.');
        }

        if (!cancelled) {
          setRoles(result.data.data);
        }
      } catch (nextError) {
        if (!cancelled) {
          setRoles([]);
          setError(getAccessErrorMessage(nextError, 'Unable to load roles right now.'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRoles();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  function refresh() {
    setReloadToken((current) => current + 1);
  }

  async function createRole(input: RoleDraft) {
    if (isSaving || isDeleting) return null;

    setIsSaving(true);

    try {
      const result = await roleCatalogApi.createRoleRolesPost({
        body: input,
        headers: getRequestHeaders(),
        throwOnError: false
      });

      if (!result.data) {
        throw result.error ?? new Error('Unable to create the role right now.');
      }

      toast.success(result.data.message ?? ROLE_ACCESS_TEXT.savedCreate);
      refresh();
      return result.data.data;
    } catch (nextError) {
      toast.error(getAccessErrorMessage(nextError, 'Unable to create the role right now.'));
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function updateRole(roleId: string, input: RoleUpdateRequest) {
    if (isSaving || isDeleting) return null;

    setIsSaving(true);

    try {
      const result = await roleCatalogApi.updateRoleRolesRoleIdPatch({
        body: input,
        headers: getRequestHeaders(),
        path: { role_id: roleId },
        throwOnError: false
      });

      if (!result.data) {
        throw result.error ?? new Error('Unable to update the role right now.');
      }

      toast.success(result.data.message ?? ROLE_ACCESS_TEXT.savedUpdate);
      refresh();
      return result.data.data;
    } catch (nextError) {
      toast.error(getAccessErrorMessage(nextError, 'Unable to update the role right now.'));
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteRole(roleId: string) {
    if (isSaving || isDeleting) return false;

    setIsDeleting(true);

    try {
      const result = await roleCatalogApi.deleteRoleRolesRoleIdDelete({
        headers: getRequestHeaders(),
        path: { role_id: roleId },
        throwOnError: false
      });

      if (result.error) {
        throw result.error;
      }

      toast.success(ROLE_ACCESS_TEXT.savedDelete);
      refresh();
      return true;
    } catch (nextError) {
      toast.error(getAccessErrorMessage(nextError, 'Unable to delete the role right now.'));
      return false;
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    createRole,
    deleteRole,
    error,
    isDeleting,
    isEmpty: !isLoading && !error && roles.length === 0,
    isLoading,
    isSaving,
    refresh,
    roles,
    updateRole
  };
}
