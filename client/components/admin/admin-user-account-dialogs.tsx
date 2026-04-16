'use client';

import { type FormEvent } from 'react';
import { format } from 'date-fns';
import { CalendarClock, CalendarIcon, Check, KeyRound, Loader2, Mail, RefreshCcw, ShieldCheck, ShieldPlus, Trash2 } from 'lucide-react';
import { humanizeRoleName, humanizeValue, RolePermissionList } from '@/components/admin/admin-user-management-ui';
import { FieldHint } from '@/components/shared/field-hint';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  AdminUserAccountSummaryResponse as AdminUserAccountSummary,
  AssignableRoleResponse as AssignableRole,
  GrantEffect,
  GrantFeatureResponse,
  RoleAction
} from '@/api/types.gen';
import { cn } from '@/lib/utils';

const SPECIAL_PERMISSION_ACTIONS: RoleAction[] = ['create', 'read', 'update', 'delete'];
const SPECIAL_PERMISSION_EFFECTS: Array<{ label: string; value: GrantEffect }> = [
  { label: 'Allow', value: 'allow' },
  { label: 'Deny', value: 'deny' }
];

interface AdminUserAccountDialogsProps {
  deleteDialogUser: AdminUserAccountSummary | null;
  deleteReason: string;
  deleteReasonError?: string;
  emailDialogUser: AdminUserAccountSummary | null;
  emailError?: string;
  emailValue: string;
  effectiveFromDate?: Date;
  effectiveToDate?: Date;
  grantFeatures: GrantFeatureResponse[];
  grantFeaturesError: string | null;
  isLoadingGrantFeatures: boolean;
  isLoadingRoles: boolean;
  isSubmitting: boolean;
  onCloseDeleteDialog: () => void;
  onCloseEmailDialog: () => void;
  onClosePasswordResetDialog: () => void;
  onCloseRoleDialog: () => void;
  onCloseSpecialPermissionDialog: () => void;
  onDeleteReasonChange: (value: string) => void;
  onDeleteSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEmailChange: (value: string) => void;
  onEmailSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPasswordResetConfirm: () => void;
  onRoleChange: (value: string) => void;
  onRoleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSpecialPermissionActionToggle: (value: RoleAction) => void;
  onSpecialPermissionEffectChange: (value: GrantEffect) => void;
  onSpecialPermissionFromDateChange: (value: Date | undefined) => void;
  onSpecialPermissionFeatureChange: (value: string) => void;
  onSpecialPermissionSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSpecialPermissionToDateChange: (value: Date | undefined) => void;
  passwordResetUser: AdminUserAccountSummary | null;
  pendingAction: 'role' | 'email' | 'password-reset' | 'delete' | 'special-permission' | null;
  refreshGrantFeatures: () => void;
  refreshRoles: () => void;
  roleDialogUser: AdminUserAccountSummary | null;
  roleError?: string;
  roles: AssignableRole[];
  rolesError: string | null;
  selectedRoleId: string;
  selectedFeatureId: string;
  selectedGrantActions: RoleAction[];
  selectedGrantEffect: GrantEffect;
  specialPermissionDialogUser: AdminUserAccountSummary | null;
  specialPermissionError?: string;
}

export function AdminUserAccountDialogs({
  deleteDialogUser,
  deleteReason,
  deleteReasonError,
  emailDialogUser,
  emailError,
  emailValue,
  effectiveFromDate,
  effectiveToDate,
  grantFeatures,
  grantFeaturesError,
  isLoadingGrantFeatures,
  isLoadingRoles,
  isSubmitting,
  onCloseDeleteDialog,
  onCloseEmailDialog,
  onClosePasswordResetDialog,
  onCloseRoleDialog,
  onCloseSpecialPermissionDialog,
  onDeleteReasonChange,
  onDeleteSubmit,
  onEmailChange,
  onEmailSubmit,
  onPasswordResetConfirm,
  onRoleChange,
  onRoleSubmit,
  onSpecialPermissionActionToggle,
  onSpecialPermissionEffectChange,
  onSpecialPermissionFromDateChange,
  onSpecialPermissionFeatureChange,
  onSpecialPermissionSubmit,
  onSpecialPermissionToDateChange,
  passwordResetUser,
  pendingAction,
  refreshGrantFeatures,
  refreshRoles,
  roleDialogUser,
  roleError,
  roles,
  rolesError,
  selectedRoleId,
  selectedFeatureId,
  selectedGrantActions,
  selectedGrantEffect,
  specialPermissionDialogUser,
  specialPermissionError
}: AdminUserAccountDialogsProps) {
  const selectedRole = roles.find((role) => role.id === selectedRoleId);
  const selectedGrantFeature = grantFeatures.find((feature) => feature.id === selectedFeatureId);
  const selectedRoleFeatureCount = new Set((selectedRole?.permissions ?? []).map((permission) => permission.feature_slug)).size;
  const selectedRolePermissionCount = selectedRole?.permissions?.length ?? 0;

  return (
    <>
      <Dialog open={Boolean(roleDialogUser)} onOpenChange={(open) => !open && onCloseRoleDialog()}>
        <DialogContent className="max-h-[85vh] overflow-hidden border-0 bg-white p-0 shadow-xl shadow-neutral-900/5 sm:max-w-xl">
          <DialogHeader className="px-5 pt-5 pb-4">
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>
              Replace the user&apos;s current effective role. Refresh tokens will be revoked so the new permissions apply on the next session refresh.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(85vh-5.75rem)]">
            <form className="space-y-4 px-5 pb-5" onSubmit={onRoleSubmit}>
              <div className="rounded-xl bg-neutral-50 px-4 py-3">
                <div className="flex flex-col gap-1">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-neutral-950">{roleDialogUser?.name ?? 'Selected user'}</p>
                    <p className="text-xs text-neutral-500">Current role: {humanizeRoleName(roleDialogUser?.role_name, 'No assigned role')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor="admin-change-role">
                  System role
                </label>
                <Select value={selectedRoleId || undefined} onValueChange={onRoleChange}>
                  <SelectTrigger
                    className="h-11 rounded-xl border-0 bg-neutral-100 shadow-none"
                    id="admin-change-role"
                    disabled={isLoadingRoles || isSubmitting}
                  >
                    <SelectValue placeholder={isLoadingRoles ? 'Loading roles...' : 'Select a role'} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {humanizeRoleName(role.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldHint error={roleError ?? rolesError ?? undefined} hint="Only one effective role is kept for this admin flow." />
              </div>

              {selectedRole ? (
                <div className="rounded-xl py-3 border p-4">
                  <div className="space-y-10">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-neutral-950">{humanizeRoleName(selectedRole.name)}</p>
                        <Badge variant="secondary" className="bg-white px-2 py-0.5 text-[10px] text-neutral-700 shadow-xs">
                          {selectedRolePermissionCount} permissions
                        </Badge>
                        <Badge variant="secondary" className="bg-white px-2 py-0.5 text-[10px] text-neutral-700 shadow-xs">
                          {selectedRoleFeatureCount} features
                        </Badge>
                      </div>
                      <p className="text-sm leading-5 text-neutral-600">
                        {selectedRole.description?.trim() ? selectedRole.description : 'No role description is available for this role.'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase pb-3">Included permissions</p>
                      <ScrollArea className="max-h-64 rounded-md overflow-y-auto">
                        <div className="p-3">
                          <RolePermissionList permissions={selectedRole.permissions} />
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-neutral-50 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-neutral-800">Select a role to preview its permissions.</p>
                </div>
              )}

              {rolesError ? (
                <Button type="button" variant="outline" size="sm" onClick={refreshRoles}>
                  <RefreshCcw className="size-4" />
                  Reload roles
                </Button>
              ) : null}

              <DialogFooter className="pt-1">
                <Button type="button" variant="outline" onClick={onCloseRoleDialog} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isLoadingRoles}>
                  {pendingAction === 'role' ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                  Save role
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(emailDialogUser)} onOpenChange={(open) => !open && onCloseEmailDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change email</DialogTitle>
            <DialogDescription>Update the email address, clear the verification state, and send a fresh verification link to the new inbox.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={onEmailSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="admin-change-email">
                Email address
              </label>
              <Input
                id="admin-change-email"
                type="email"
                value={emailValue}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="Enter the new email address"
                autoComplete="email"
                disabled={isSubmitting}
              />
              <FieldHint error={emailError} hint="The user will need to verify this new address before using verification-gated flows." />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCloseEmailDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {pendingAction === 'email' ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                Save email
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(specialPermissionDialogUser)} onOpenChange={(open) => !open && onCloseSpecialPermissionDialog()}>
        <DialogContent className="max-h-[85vh] overflow-hidden border-0 bg-white p-0 shadow-xl shadow-neutral-900/5 sm:max-w-lg">
          <DialogHeader className="px-5 pt-5 pb-4">
            <DialogTitle>Add special permission</DialogTitle>
            <DialogDescription>Override the user&apos;s role for a specific feature within a defined active window.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(85vh-5.75rem)]">
            <form className="space-y-4 px-5 pb-5" onSubmit={onSpecialPermissionSubmit}>
              <div className="rounded-2xl bg-neutral-50 px-4 py-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-neutral-950">{specialPermissionDialogUser?.name ?? 'Selected user'}</p>
                  <p className="text-xs text-neutral-500">Current role: {humanizeRoleName(specialPermissionDialogUser?.role_name, 'No assigned role')}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor="admin-special-permission-feature">
                    Feature
                  </label>
                  <Select value={selectedFeatureId || undefined} onValueChange={onSpecialPermissionFeatureChange}>
                    <SelectTrigger
                      className="h-11 rounded-xl border-0 bg-neutral-100 shadow-none"
                      id="admin-special-permission-feature"
                      disabled={isLoadingGrantFeatures || isSubmitting}
                    >
                      <SelectValue placeholder={isLoadingGrantFeatures ? 'Loading features...' : 'Select a feature'} />
                    </SelectTrigger>
                    <SelectContent>
                      {grantFeatures.map((feature) => (
                        <SelectItem key={feature.id} value={feature.id}>
                          {feature.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor="admin-special-permission-effect">
                    Effect
                  </label>
                  <Select value={selectedGrantEffect} onValueChange={(value) => onSpecialPermissionEffectChange(value as GrantEffect)}>
                    <SelectTrigger className="h-11 rounded-xl border-0 bg-neutral-100 shadow-none" id="admin-special-permission-effect" disabled={isSubmitting}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIAL_PERMISSION_EFFECTS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor="admin-special-permission-effective-from">
                    Effective from
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="admin-special-permission-effective-from"
                        disabled={isSubmitting}
                        className="h-11 w-full justify-start rounded-xl border-0 bg-neutral-100 font-normal shadow-none"
                      >
                        <CalendarIcon className="size-4 text-neutral-500" />
                        {effectiveFromDate ? <span>{format(effectiveFromDate, 'PPP')}</span> : <span>Pick a start date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={effectiveFromDate} onSelect={onSpecialPermissionFromDateChange} defaultMonth={effectiveFromDate} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor="admin-special-permission-effective-to">
                    Effective to
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="admin-special-permission-effective-to"
                        disabled={isSubmitting}
                        className="h-11 w-full justify-start rounded-xl border-0 bg-neutral-100 font-normal shadow-none"
                      >
                        <CalendarIcon className="size-4 text-neutral-500" />
                        {effectiveToDate ? <span>{format(effectiveToDate, 'PPP')}</span> : <span>Pick an end date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={effectiveToDate} onSelect={onSpecialPermissionToDateChange} defaultMonth={effectiveToDate ?? effectiveFromDate} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase">Actions</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SPECIAL_PERMISSION_ACTIONS.map((action) => {
                    const isSelected = selectedGrantActions.includes(action);

                    return (
                      <button
                        key={action}
                        type="button"
                        onClick={() => onSpecialPermissionActionToggle(action)}
                        disabled={isSubmitting}
                        className={cn(
                          'flex items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition-colors',
                          isSelected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'
                        )}
                      >
                        <span>{humanizeValue(action)}</span>
                        {isSelected ? <Check className="size-4" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedGrantFeature ? (
                <div className="rounded-2xl bg-neutral-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-neutral-950">{selectedGrantFeature.name}</p>
                      <p className="text-xs text-neutral-500">{selectedGrantFeature.description?.trim() ? selectedGrantFeature.description : 'No feature description is available.'}</p>
                    </div>
                    <Badge variant="secondary" className="bg-white px-2 py-0.5 text-[10px] text-neutral-600 shadow-xs">
                      {selectedGrantFeature.slug}
                    </Badge>
                  </div>
                </div>
              ) : null}

              <FieldHint
                error={specialPermissionError ?? grantFeaturesError ?? undefined}
                hint={
                  specialPermissionDialogUser?.role_id
                    ? 'The override becomes active at the start date and ends automatically at the optional end date.'
                    : 'Assign a system role first so this user has a base role for the override.'
                }
              />

              {grantFeaturesError ? (
                <Button type="button" variant="outline" size="sm" onClick={refreshGrantFeatures}>
                  <RefreshCcw className="size-4" />
                  Reload features
                </Button>
              ) : null}

              <DialogFooter className="pt-1">
                <Button type="button" variant="outline" onClick={onCloseSpecialPermissionDialog} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isLoadingGrantFeatures || !specialPermissionDialogUser?.role_id}>
                  {pendingAction === 'special-permission' ? <Loader2 className="size-4 animate-spin" /> : <ShieldPlus className="size-4" />}
                  Save permission
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(passwordResetUser)} onOpenChange={(open) => !open && onClosePasswordResetDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>Send the standard password reset link to the user&apos;s current verified email address.</DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
            {passwordResetUser ? `A reset link will be sent to ${passwordResetUser.email}. This action requires the address to already be verified.` : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClosePasswordResetDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={onPasswordResetConfirm} disabled={isSubmitting}>
              {pendingAction === 'password-reset' ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              Send reset link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteDialogUser)} onOpenChange={(open) => !open && onCloseDeleteDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule soft delete</DialogTitle>
            <DialogDescription>
              This uses the existing 30-day deletion workflow. The account remains recoverable until the grace period expires or the user logs in again.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={onDeleteSubmit}>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 size-4 shrink-0" />
                <p>{deleteDialogUser ? `${deleteDialogUser.name} will be scheduled for deletion after 30 days.` : null}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="admin-delete-reason">
                Reason
              </label>
              <Textarea
                id="admin-delete-reason"
                value={deleteReason}
                onChange={(event) => onDeleteReasonChange(event.target.value)}
                rows={4}
                placeholder="Explain why this account should be scheduled for deletion"
                disabled={isSubmitting}
              />
              <FieldHint error={deleteReasonError} hint="This reason is stored with the pending deletion request." />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCloseDeleteDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {pendingAction === 'delete' ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Schedule deletion
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
