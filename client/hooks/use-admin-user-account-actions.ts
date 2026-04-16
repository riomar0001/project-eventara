'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  changeAdminUserEmail,
  changeAdminUserRole,
  getAdminUserAccountErrorMessage,
  listAssignableRoles,
  scheduleAdminUserSoftDelete,
  sendAdminUserPasswordReset,
  type AssignableRole,
  type ChangeUserEmailResponse,
  type ChangeUserRoleResponse,
  type ScheduleAccountDeletionResponse,
  type SendUserPasswordResetResponse
} from '@/api/admin-user-accounts';

type PendingAction = 'role' | 'email' | 'password-reset' | 'delete' | null;

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
      const response = await listAssignableRoles();
      setRoles(response.data);
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
      const response = await changeAdminUserRole(userId, roleId);
      toast.success(response.message);
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
      const response = await changeAdminUserEmail(userId, email);
      toast.success(response.message);
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
      const response = await sendAdminUserPasswordReset(userId);
      toast.success(response.message);
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
      const response = await scheduleAdminUserSoftDelete(userId, reason);
      toast.success(response.message);
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
