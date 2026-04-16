'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminUserAccounts, User } from '@/api/sdk.gen';
import type {
  AssignableRoleResponse as AssignableRole,
  ChangeUserEmailResponse,
  ChangeUserRoleResponse,
  DeleteAccountResponse as ScheduleAccountDeletionResponse,
  SendUserPasswordResetResponse
} from '@/api/types.gen';
import { getAccessToken } from '@/store/auth-store';

type PendingAction = 'role' | 'email' | 'password-reset' | 'delete' | null;

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
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => {
    void refreshRoles();
  }, []);

  async function refreshRoles() {
    setIsLoadingRoles(true);
    setRolesError(null);

    try {
      const result = await AdminUserAccounts.listRolesUserAccountsRolesGet({
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

  async function changeRole(userId: string, roleId: string): Promise<ChangeUserRoleResponse | null> {
    if (pendingAction) return null;

    setPendingAction('role');

    try {
      const result = await AdminUserAccounts.changeUserRoleUserAccountsUserIdRolePatch({
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
      const result = await AdminUserAccounts.changeUserEmailUserAccountsUserIdEmailPatch({
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
      const result = await AdminUserAccounts.sendUserPasswordResetUserAccountsUserIdPasswordResetPost({
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
      const result = await User.scheduleAdminAccountDeletionUserTargetUserIdAccountDeletionPost({
        body: { reason },
        path: { target_user_id: userId },
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

  return {
    changeEmail,
    changeRole,
    isLoadingRoles,
    isSubmitting: pendingAction !== null,
    pendingAction,
    refreshRoles,
    roles,
    rolesError,
    scheduleDeletion,
    sendPasswordReset
  };
}
