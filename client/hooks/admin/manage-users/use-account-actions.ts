'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Roles, Users } from '@/api/sdk.gen';
import type {
  AssignableRoleResponse as AssignableRole,
  ChangeUserEmailResponse,
  ChangeUserRoleResponse,
  CreateGrantsResponse,
  DeleteAccountResponse as ScheduleAccountDeletionResponse,
  GrantEffect,
  GrantFeatureResponse,
  RoleAction,
  UserGrantResponse,
  SendUserPasswordResetResponse
} from '@/api/types.gen';
import { getAccessToken } from '@/store/auth-store';

type PendingAction = 'role' | 'email' | 'password-reset' | 'delete' | 'special-permission' | 'delete-special-permission' | null;

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

function getAdminUserAccountErrorMessage(error: unknown, fallbackMessage: string) {
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

export function useAdminUserAccountActions() {
  const [roles, setRoles] = useState<AssignableRole[]>([]);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [grantFeatures, setGrantFeatures] = useState<GrantFeatureResponse[]>([]);
  const [grantFeaturesError, setGrantFeaturesError] = useState<string | null>(null);
  const [isLoadingGrantFeatures, setIsLoadingGrantFeatures] = useState(true);
  const [specialPermissions, setSpecialPermissions] = useState<UserGrantResponse[]>([]);
  const [specialPermissionsError, setSpecialPermissionsError] = useState<string | null>(null);
  const [isLoadingSpecialPermissions, setIsLoadingSpecialPermissions] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => {
    void refreshRoles();
    void refreshGrantFeatures();
  }, []);

  async function refreshRoles() {
    setIsLoadingRoles(true);
    setRolesError(null);

    try {
      const result = await Users.listRolesUserAccountsRolesGet({
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        throwOnError: false
      });

      if (!result.data) {
        throw result.error ?? new Error('Unable to load roles right now.');
      }

      setRoles(result.data.data);
    } catch (error) {
      setRoles([]);
      setRolesError(getAdminUserAccountErrorMessage(error, 'Unable to load roles right now.'));
    } finally {
      setIsLoadingRoles(false);
    }
  }

  async function refreshGrantFeatures() {
    setIsLoadingGrantFeatures(true);
    setGrantFeaturesError(null);

    try {
      const result = await Roles.listGrantFeaturesUserGrantsFeaturesGet({
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        throwOnError: false
      });

      if (!result.data) {
        throw result.error ?? new Error('Unable to load special-permission features right now.');
      }

      setGrantFeatures(result.data.data);
    } catch (error) {
      setGrantFeatures([]);
      setGrantFeaturesError(getAdminUserAccountErrorMessage(error, 'Unable to load special-permission features right now.'));
    } finally {
      setIsLoadingGrantFeatures(false);
    }
  }

  async function changeRole(userId: string, roleId: string): Promise<ChangeUserRoleResponse | null> {
    if (pendingAction) return null;

    setPendingAction('role');

    try {
      const result = await Users.changeUserRoleUserAccountsUserIdRolePatch({
        body: { role_id: roleId },
        path: { user_id: userId },
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        throwOnError: false
      });

      if (!result.data) {
        throw result.error ?? new Error('Unable to update the user role right now.');
      }

      const response = result.data;
      toast.success(response.message ?? 'User role updated successfully.');
      return response;
    } catch (error) {
      toast.error(getAdminUserAccountErrorMessage(error, 'Unable to update the user role right now.'));
      return null;
    } finally {
      setPendingAction(null);
    }
  }

  async function changeEmail(userId: string, email: string): Promise<ChangeUserEmailResponse | null> {
    if (pendingAction) return null;

    setPendingAction('email');

    try {
      const result = await Users.changeUserEmailUserAccountsUserIdEmailPatch({
        body: { email },
        path: { user_id: userId },
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        throwOnError: false
      });

      if (!result.data) {
        throw result.error ?? new Error('Unable to update the user email right now.');
      }

      const response = result.data;
      toast.success(response.message ?? 'User email updated successfully.');
      return response;
    } catch (error) {
      toast.error(getAdminUserAccountErrorMessage(error, 'Unable to update the user email right now.'));
      return null;
    } finally {
      setPendingAction(null);
    }
  }

  async function sendPasswordReset(userId: string): Promise<SendUserPasswordResetResponse | null> {
    if (pendingAction) return null;

    setPendingAction('password-reset');

    try {
      const result = await Users.sendUserPasswordResetUserAccountsUserIdPasswordResetPost({
        path: { user_id: userId },
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        throwOnError: false
      });

      if (!result.data) {
        throw result.error ?? new Error('Unable to send the password reset link right now.');
      }

      const response = result.data;
      toast.success(response.message ?? 'Password reset link sent successfully.');
      return response;
    } catch (error) {
      toast.error(getAdminUserAccountErrorMessage(error, 'Unable to send the password reset link right now.'));
      return null;
    } finally {
      setPendingAction(null);
    }
  }

  async function scheduleDeletion(userId: string, reason: string): Promise<ScheduleAccountDeletionResponse | null> {
    if (pendingAction) return null;

    setPendingAction('delete');

    try {
      const result = await Users.scheduleAdminAccountDeletionUserAccountsUserIdAccountDeletionPost({
        body: { reason },
        path: { user_id: userId },
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        throwOnError: false
      });

      if (!result.data) {
        throw result.error ?? new Error('Unable to schedule account deletion right now.');
      }

      const response = result.data;
      toast.success(response.message ?? 'Account deletion scheduled successfully.');
      return response;
    } catch (error) {
      toast.error(getAdminUserAccountErrorMessage(error, 'Unable to schedule account deletion right now.'));
      return null;
    } finally {
      setPendingAction(null);
    }
  }

  async function createSpecialPermission(input: {
    actions: RoleAction[];
    effect: GrantEffect;
    expiresAt?: string | null;
    featureId: string;
    roleId: string;
    startsAt: string;
    userId: string;
  }): Promise<CreateGrantsResponse | null> {
    if (pendingAction) return null;

    setPendingAction('special-permission');

    try {
      const result = await Roles.createGrantsUserGrantsPost({
        body: {
          user_id: input.userId,
          role_id: input.roleId,
          feature_id: input.featureId,
          actions: input.actions,
          effect: input.effect,
          starts_at: input.startsAt,
          expires_at: input.expiresAt ?? null
        },
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        throwOnError: false
      });

      if (!result.data) {
        throw result.error ?? new Error('Unable to add the special permission right now.');
      }

      const response = result.data;
      toast.success(response.message ?? 'Special permission added successfully.');
      return response;
    } catch (error) {
      toast.error(getAdminUserAccountErrorMessage(error, 'Unable to add the special permission right now.'));
      return null;
    } finally {
      setPendingAction(null);
    }
  }

  async function loadSpecialPermissions(userId: string) {
    setIsLoadingSpecialPermissions(true);
    setSpecialPermissionsError(null);

    try {
      const result = await Roles.listUserGrantsUserGrantsGet({
        query: { user_id: userId },
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        throwOnError: false
      });

      if (!result.data) {
        throw result.error ?? new Error('Unable to load special permissions right now.');
      }

      setSpecialPermissions(result.data.data);
    } catch (error) {
      setSpecialPermissions([]);
      setSpecialPermissionsError(getAdminUserAccountErrorMessage(error, 'Unable to load special permissions right now.'));
    } finally {
      setIsLoadingSpecialPermissions(false);
    }
  }

  function clearSpecialPermissions() {
    setSpecialPermissions([]);
    setSpecialPermissionsError(null);
    setIsLoadingSpecialPermissions(false);
  }

  async function deleteSpecialPermission(grantId: string): Promise<boolean> {
    if (pendingAction) return false;

    setPendingAction('delete-special-permission');

    try {
      const result = await Roles.revokeGrantUserGrantsGrantIdDelete({
        path: { grant_id: grantId },
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        throwOnError: false
      });

      if (result.error) {
        throw result.error;
      }

      setSpecialPermissions((currentPermissions) => currentPermissions.filter((permission) => permission.id !== grantId));
      toast.success('Special permission removed successfully.');
      return true;
    } catch (error) {
      toast.error(getAdminUserAccountErrorMessage(error, 'Unable to remove the special permission right now.'));
      return false;
    } finally {
      setPendingAction(null);
    }
  }

  return {
    changeEmail,
    changeRole,
    clearSpecialPermissions,
    createSpecialPermission,
    deleteSpecialPermission,
    grantFeatures,
    grantFeaturesError,
    isLoadingRoles,
    isLoadingGrantFeatures,
    isLoadingSpecialPermissions,
    isSubmitting: pendingAction !== null,
    loadSpecialPermissions,
    pendingAction,
    refreshGrantFeatures,
    refreshRoles,
    roles,
    rolesError,
    scheduleDeletion,
    specialPermissions,
    specialPermissionsError,
    sendPasswordReset
  };
}
