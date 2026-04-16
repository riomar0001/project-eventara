'use client';

import { FormEvent, useState } from 'react';
import { z } from 'zod';
import { AdminDeleteDialog } from '@/components/admin/user-management/dialogs/delete-dialog';
import { AdminEmailDialog } from '@/components/admin/user-management/dialogs/email-dialog';
import { AdminPasswordResetDialog } from '@/components/admin/user-management/dialogs/password-reset-dialog';
import { AdminRoleDialog } from '@/components/admin/user-management/dialogs/role-dialog';
import { AdminSpecialPermissionDialog } from '@/components/admin/user-management/dialogs/special-permission-dialog';
import { AdminUserManagementTable } from '@/components/admin/user-management/user-management-table';
import { AdminUserDetailSheet } from '@/components/admin/user-management/users-detail-sheet';
import { useAdminUserAccountActions } from '@/hooks/use-admin-user-account-actions';
import { useAdminUserAccountDetail } from '@/hooks/use-admin-user-account-detail';
import { useAdminUserAccounts } from '@/hooks/use-admin-user-accounts';
import { useDebounce } from '@/hooks/use-debounce';
import type { AdminUserAccountSummaryResponse as AdminUserAccountSummary, GrantEffect, RoleAction, UserStatus } from '@/api/types.gen';

const PAGE_SIZE = 10;
const emailSchema = z.string().trim().email('Enter a valid email address.');

function getDefaultEffectiveFromDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function AdminUserManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | undefined>(undefined);
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 400);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [roleDialogUser, setRoleDialogUser] = useState<AdminUserAccountSummary | null>(null);
  const [specialPermissionDialogUser, setSpecialPermissionDialogUser] = useState<AdminUserAccountSummary | null>(null);
  const [emailDialogUser, setEmailDialogUser] = useState<AdminUserAccountSummary | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<AdminUserAccountSummary | null>(null);
  const [deleteDialogUser, setDeleteDialogUser] = useState<AdminUserAccountSummary | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedFeatureId, setSelectedFeatureId] = useState('');
  const [selectedGrantActions, setSelectedGrantActions] = useState<RoleAction[]>([]);
  const [selectedGrantEffect, setSelectedGrantEffect] = useState<GrantEffect>('allow');
  const [effectiveFromDate, setEffectiveFromDate] = useState<Date | undefined>(getDefaultEffectiveFromDate());
  const [effectiveToDate, setEffectiveToDate] = useState<Date | undefined>();
  const [emailValue, setEmailValue] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [roleError, setRoleError] = useState<string | undefined>();
  const [specialPermissionError, setSpecialPermissionError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [deleteReasonError, setDeleteReasonError] = useState<string | undefined>();

  const { error, isEmpty, isLoading, pagination, refresh, users } = useAdminUserAccounts(
    page,
    PAGE_SIZE,
    debouncedSearch || undefined,
    statusFilter,
    roleFilter
  );
  const { detail, error: detailError, isLoading: isLoadingDetail, refresh: refreshDetail } = useAdminUserAccountDetail(selectedUserId);
  const {
    changeEmail,
    changeRole,
    clearSpecialPermissions,
    createSpecialPermission,
    deleteSpecialPermission,
    grantFeatures,
    grantFeaturesError,
    isLoadingGrantFeatures,
    isLoadingRoles,
    isLoadingSpecialPermissions,
    isSubmitting,
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
  } = useAdminUserAccountActions();

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

  function resetSpecialPermissionDialog() {
    setSpecialPermissionDialogUser(null);
    setSelectedFeatureId('');
    setSelectedGrantActions([]);
    setSelectedGrantEffect('allow');
    setEffectiveFromDate(getDefaultEffectiveFromDate());
    setEffectiveToDate(undefined);
    setSpecialPermissionError(undefined);
    clearSpecialPermissions();
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

  function openSpecialPermissionDialog(user: AdminUserAccountSummary) {
    setSpecialPermissionDialogUser(user);
    setSelectedFeatureId('');
    setSelectedGrantActions([]);
    setSelectedGrantEffect('allow');
    setEffectiveFromDate(getDefaultEffectiveFromDate());
    setEffectiveToDate(undefined);
    setSpecialPermissionError(undefined);
    void loadSpecialPermissions(user.user_id);
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

  async function handleSpecialPermissionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!specialPermissionDialogUser) return;

    if (!specialPermissionDialogUser.role_id) {
      setSpecialPermissionError('Assign a system role before adding a separate special permission for this user.');
      return;
    }

    if (!selectedFeatureId) {
      setSpecialPermissionError('Choose a feature for this special permission.');
      return;
    }

    if (selectedGrantActions.length === 0) {
      setSpecialPermissionError('Select at least one action for this special permission.');
      return;
    }

    if (!effectiveFromDate) {
      setSpecialPermissionError('Choose a valid start date.');
      return;
    }

    const startsAt = new Date(effectiveFromDate);
    startsAt.setHours(0, 0, 0, 0);

    let expiresAt: Date | null = null;

    if (effectiveToDate) {
      expiresAt = new Date(effectiveToDate);
      expiresAt.setHours(23, 59, 59, 999);
      if (expiresAt <= startsAt) {
        setSpecialPermissionError('The end date must be later than the start date.');
        return;
      }
    }

    const response = await createSpecialPermission({
      userId: specialPermissionDialogUser.user_id,
      roleId: specialPermissionDialogUser.role_id,
      featureId: selectedFeatureId,
      actions: selectedGrantActions,
      effect: selectedGrantEffect,
      startsAt: startsAt.toISOString(),
      expiresAt: expiresAt?.toISOString() ?? null
    });

    if (!response) return;

    handleMutationSuccess(specialPermissionDialogUser.user_id);
    setSelectedFeatureId('');
    setSelectedGrantActions([]);
    setSelectedGrantEffect('allow');
    setEffectiveFromDate(getDefaultEffectiveFromDate());
    setEffectiveToDate(undefined);
    setSpecialPermissionError(undefined);
    await loadSpecialPermissions(specialPermissionDialogUser.user_id);
  }

  async function handleSpecialPermissionDelete(grantId: string) {
    if (!specialPermissionDialogUser) return;

    const deleted = await deleteSpecialPermission(grantId);

    if (!deleted) return;

    handleMutationSuccess(specialPermissionDialogUser.user_id);
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

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusFilterChange(value: UserStatus | undefined) {
    setStatusFilter(value);
    setPage(1);
  }

  function handleRoleFilterChange(value: string | undefined) {
    setRoleFilter(value);
    setPage(1);
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
        onOpenSpecialPermissionDialog={openSpecialPermissionDialog}
        onPageChange={setPage}
        onRefresh={refresh}
        onSearchChange={handleSearchChange}
        onSelectUser={setSelectedUserId}
        onStatusFilterChange={handleStatusFilterChange}
        onRoleFilterChange={handleRoleFilterChange}
        pagination={pagination}
        search={search}
        statusFilter={statusFilter}
        roleFilter={roleFilter}
        roles={roles}
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

      <AdminRoleDialog
        isLoadingRoles={isLoadingRoles}
        isSubmitting={isSubmitting}
        onCloseRoleDialog={resetRoleDialog}
        onRoleChange={(value) => {
          setSelectedRoleId(value);
          setRoleError(undefined);
        }}
        onRoleSubmit={handleRoleSubmit}
        pendingAction={pendingAction}
        refreshRoles={refreshRoles}
        roleDialogUser={roleDialogUser}
        roleError={roleError}
        roles={roles}
        rolesError={rolesError}
        selectedRoleId={selectedRoleId}
      />

      <AdminEmailDialog
        emailDialogUser={emailDialogUser}
        emailError={emailError}
        emailValue={emailValue}
        isSubmitting={isSubmitting}
        onCloseEmailDialog={resetEmailDialog}
        onEmailChange={(value) => {
          setEmailValue(value);
          setEmailError(undefined);
        }}
        onEmailSubmit={handleEmailSubmit}
        pendingAction={pendingAction}
      />

      <AdminSpecialPermissionDialog
        effectiveFromDate={effectiveFromDate}
        effectiveToDate={effectiveToDate}
        grantFeatures={grantFeatures}
        grantFeaturesError={grantFeaturesError}
        isLoadingGrantFeatures={isLoadingGrantFeatures}
        isLoadingSpecialPermissions={isLoadingSpecialPermissions}
        isSubmitting={isSubmitting}
        onCloseSpecialPermissionDialog={resetSpecialPermissionDialog}
        onSpecialPermissionActionToggle={(value) => {
          setSelectedGrantActions((currentActions) =>
            currentActions.includes(value) ? currentActions.filter((action) => action !== value) : [...currentActions, value]
          );
          setSpecialPermissionError(undefined);
        }}
        onSpecialPermissionEffectChange={(value) => {
          setSelectedGrantEffect(value);
          setSpecialPermissionError(undefined);
        }}
        onSpecialPermissionFromDateChange={(value) => {
          setEffectiveFromDate(value);
          setSpecialPermissionError(undefined);
        }}
        onSpecialPermissionFeatureChange={(value) => {
          setSelectedFeatureId(value);
          setSpecialPermissionError(undefined);
        }}
        onSpecialPermissionDelete={handleSpecialPermissionDelete}
        onSpecialPermissionSubmit={handleSpecialPermissionSubmit}
        onSpecialPermissionToDateChange={(value) => {
          setEffectiveToDate(value);
          setSpecialPermissionError(undefined);
        }}
        pendingAction={pendingAction}
        refreshGrantFeatures={refreshGrantFeatures}
        selectedFeatureId={selectedFeatureId}
        selectedGrantActions={selectedGrantActions}
        selectedGrantEffect={selectedGrantEffect}
        specialPermissionDialogUser={specialPermissionDialogUser}
        specialPermissionError={specialPermissionError}
        specialPermissions={specialPermissions}
        specialPermissionsError={specialPermissionsError}
      />

      <AdminPasswordResetDialog
        isSubmitting={isSubmitting}
        onClosePasswordResetDialog={resetPasswordResetDialog}
        onPasswordResetConfirm={handlePasswordResetConfirm}
        passwordResetUser={passwordResetUser}
        pendingAction={pendingAction}
      />

      <AdminDeleteDialog
        deleteDialogUser={deleteDialogUser}
        deleteReason={deleteReason}
        deleteReasonError={deleteReasonError}
        isSubmitting={isSubmitting}
        onCloseDeleteDialog={resetDeleteDialog}
        onDeleteReasonChange={(value) => {
          setDeleteReason(value);
          setDeleteReasonError(undefined);
        }}
        onDeleteSubmit={handleDeleteSubmit}
        pendingAction={pendingAction}
      />
    </>
  );
}
