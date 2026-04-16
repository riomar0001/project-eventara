'use client';

import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { AdminUserAccountDialogs } from '@/components/admin/admin-user-account-dialogs';
import { AdminUserDetailSheet } from '@/components/admin/admin-user-detail-sheet';
import { AdminUserManagementTable } from '@/components/admin/admin-user-management-table';
import { useAdminUserAccountActions } from '@/hooks/use-admin-user-account-actions';
import { useAdminUserAccountDetail } from '@/hooks/use-admin-user-account-detail';
import { useAdminUserAccounts } from '@/hooks/use-admin-user-accounts';
import type { AdminUserAccountSummaryResponse as AdminUserAccountSummary } from '@/api/types.gen';

const PAGE_SIZE = 10;
const emailSchema = z.string().trim().email('Enter a valid email address.');

export function AdminUserManagement() {
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [roleDialogUser, setRoleDialogUser] = useState<AdminUserAccountSummary | null>(null);
  const [emailDialogUser, setEmailDialogUser] = useState<AdminUserAccountSummary | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<AdminUserAccountSummary | null>(null);
  const [deleteDialogUser, setDeleteDialogUser] = useState<AdminUserAccountSummary | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [roleError, setRoleError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [deleteReasonError, setDeleteReasonError] = useState<string | undefined>();

  const { error, isEmpty, isLoading, pagination, refresh, users } = useAdminUserAccounts(page, PAGE_SIZE);
  const { detail, error: detailError, isLoading: isLoadingDetail, refresh: refreshDetail } = useAdminUserAccountDetail(selectedUserId);
  const { changeEmail, changeRole, isLoadingRoles, isSubmitting, pendingAction, refreshRoles, roles, rolesError, scheduleDeletion, sendPasswordReset } =
    useAdminUserAccountActions();

  function resetRoleDialog() {
    setRoleDialogUser(null);
    setSelectedRoleId('');
    setRoleError(undefined);
  }

  function resetEmailDialog() {
    setEmailDialogUser(null);
    setEmailValue('');
    setEmailError(undefined);
  }

  function resetPasswordResetDialog() {
    setPasswordResetUser(null);
  }

  function resetDeleteDialog() {
    setDeleteDialogUser(null);
    setDeleteReason('');
    setDeleteReasonError(undefined);
  }

  function handleMutationSuccess(userId: string) {
    refresh();

    if (selectedUserId === userId) {
      refreshDetail();
    }
  }

  function openRoleDialog(user: AdminUserAccountSummary) {
    setRoleDialogUser(user);
    setSelectedRoleId(user.role_id ?? '');
    setRoleError(undefined);
  }

  function openEmailDialog(user: AdminUserAccountSummary) {
    setEmailDialogUser(user);
    setEmailValue(user.email);
    setEmailError(undefined);
  }

  function openPasswordResetDialog(user: AdminUserAccountSummary) {
    setPasswordResetUser(user);
  }

  function openDeleteDialog(user: AdminUserAccountSummary) {
    setDeleteDialogUser(user);
    setDeleteReason('');
    setDeleteReasonError(undefined);
  }

  async function handleRoleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!roleDialogUser) return;

    if (!selectedRoleId) {
      setRoleError('Please choose a role.');
      return;
    }

    const response = await changeRole(roleDialogUser.user_id, selectedRoleId);

    if (!response) return;

    handleMutationSuccess(roleDialogUser.user_id);
    resetRoleDialog();
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!emailDialogUser) return;

    const parsedEmail = emailSchema.safeParse(emailValue);

    if (!parsedEmail.success) {
      setEmailError(parsedEmail.error.issues[0]?.message ?? 'Enter a valid email address.');
      return;
    }

    const response = await changeEmail(emailDialogUser.user_id, parsedEmail.data);

    if (!response) return;

    handleMutationSuccess(emailDialogUser.user_id);
    resetEmailDialog();
  }

  async function handlePasswordResetConfirm() {
    if (!passwordResetUser) return;

    const response = await sendPasswordReset(passwordResetUser.user_id);

    if (!response) return;

    resetPasswordResetDialog();
  }

  async function handleDeleteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!deleteDialogUser) return;

    const normalizedReason = deleteReason.trim();

    if (!normalizedReason) {
      setDeleteReasonError('Please provide a reason for the deletion request.');
      return;
    }

    const response = await scheduleDeletion(deleteDialogUser.user_id, normalizedReason);

    if (!response) return;

    handleMutationSuccess(deleteDialogUser.user_id);
    resetDeleteDialog();
  }

  return (
    <>
      <AdminUserManagementTable
        error={error}
        isEmpty={isEmpty}
        isLoading={isLoading}
        onOpenDeleteDialog={openDeleteDialog}
        onOpenEmailDialog={openEmailDialog}
        onOpenPasswordResetDialog={openPasswordResetDialog}
        onOpenRoleDialog={openRoleDialog}
        onPageChange={setPage}
        onRefresh={refresh}
        onSelectUser={setSelectedUserId}
        pagination={pagination}
        users={users}
      />

      <AdminUserDetailSheet
        detail={detail}
        error={detailError}
        isLoading={isLoadingDetail}
        onOpenChange={(open) => !open && setSelectedUserId(null)}
        onRefresh={refreshDetail}
        open={Boolean(selectedUserId)}
      />

      <AdminUserAccountDialogs
        deleteDialogUser={deleteDialogUser}
        deleteReason={deleteReason}
        deleteReasonError={deleteReasonError}
        emailDialogUser={emailDialogUser}
        emailError={emailError}
        emailValue={emailValue}
        isLoadingRoles={isLoadingRoles}
        isSubmitting={isSubmitting}
        onCloseDeleteDialog={resetDeleteDialog}
        onCloseEmailDialog={resetEmailDialog}
        onClosePasswordResetDialog={resetPasswordResetDialog}
        onCloseRoleDialog={resetRoleDialog}
        onDeleteReasonChange={(value) => {
          setDeleteReason(value);
          setDeleteReasonError(undefined);
        }}
        onDeleteSubmit={handleDeleteSubmit}
        onEmailChange={(value) => {
          setEmailValue(value);
          setEmailError(undefined);
        }}
        onEmailSubmit={handleEmailSubmit}
        onPasswordResetConfirm={handlePasswordResetConfirm}
        onRoleChange={(value) => {
          setSelectedRoleId(value);
          setRoleError(undefined);
        }}
        onRoleSubmit={handleRoleSubmit}
        passwordResetUser={passwordResetUser}
        pendingAction={pendingAction}
        refreshRoles={refreshRoles}
        roleDialogUser={roleDialogUser}
        roleError={roleError}
        roles={roles}
        rolesError={rolesError}
        selectedRoleId={selectedRoleId}
      />
    </>
  );
}
