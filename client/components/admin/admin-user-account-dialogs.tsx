'use client';

import { type FormEvent } from 'react';
import { CalendarClock, KeyRound, Loader2, Mail, RefreshCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { FieldHint } from '@/components/shared/field-hint';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { type AdminUserAccountSummary, type AssignableRole } from '@/api/admin-user-accounts';

interface AdminUserAccountDialogsProps {
  deleteDialogUser: AdminUserAccountSummary | null;
  deleteReason: string;
  deleteReasonError?: string;
  emailDialogUser: AdminUserAccountSummary | null;
  emailError?: string;
  emailValue: string;
  isLoadingRoles: boolean;
  isSubmitting: boolean;
  onCloseDeleteDialog: () => void;
  onCloseEmailDialog: () => void;
  onClosePasswordResetDialog: () => void;
  onCloseRoleDialog: () => void;
  onDeleteReasonChange: (value: string) => void;
  onDeleteSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEmailChange: (value: string) => void;
  onEmailSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPasswordResetConfirm: () => void;
  onRoleChange: (value: string) => void;
  onRoleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  passwordResetUser: AdminUserAccountSummary | null;
  pendingAction: 'role' | 'email' | 'password-reset' | 'delete' | null;
  refreshRoles: () => void;
  roleDialogUser: AdminUserAccountSummary | null;
  roleError?: string;
  roles: AssignableRole[];
  rolesError: string | null;
  selectedRoleId: string;
}

export function AdminUserAccountDialogs({
  deleteDialogUser,
  deleteReason,
  deleteReasonError,
  emailDialogUser,
  emailError,
  emailValue,
  isLoadingRoles,
  isSubmitting,
  onCloseDeleteDialog,
  onCloseEmailDialog,
  onClosePasswordResetDialog,
  onCloseRoleDialog,
  onDeleteReasonChange,
  onDeleteSubmit,
  onEmailChange,
  onEmailSubmit,
  onPasswordResetConfirm,
  onRoleChange,
  onRoleSubmit,
  passwordResetUser,
  pendingAction,
  refreshRoles,
  roleDialogUser,
  roleError,
  roles,
  rolesError,
  selectedRoleId
}: AdminUserAccountDialogsProps) {
  return (
    <>
      <Dialog open={Boolean(roleDialogUser)} onOpenChange={(open) => !open && onCloseRoleDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>
              Replace the user&apos;s current effective role. Refresh tokens will be revoked so the new permissions apply on the next session refresh.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={onRoleSubmit}>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
              {roleDialogUser
                ? `${roleDialogUser.name} currently has ${roleDialogUser.role_name ?? 'no assigned role'}.`
                : 'Choose a new role for this account.'}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="admin-change-role">
                System role
              </label>
              <Select value={selectedRoleId || undefined} onValueChange={onRoleChange}>
                <SelectTrigger className="w-full" id="admin-change-role" disabled={isLoadingRoles || isSubmitting}>
                  <SelectValue placeholder={isLoadingRoles ? 'Loading roles...' : 'Select a role'} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldHint error={roleError ?? rolesError ?? undefined} hint="Only one effective role is kept for this admin flow." />
            </div>

            {rolesError ? (
              <Button type="button" variant="outline" size="sm" onClick={refreshRoles}>
                <RefreshCcw className="size-4" />
                Reload roles
              </Button>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCloseRoleDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingRoles}>
                {pendingAction === 'role' ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                Save role
              </Button>
            </DialogFooter>
          </form>
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
