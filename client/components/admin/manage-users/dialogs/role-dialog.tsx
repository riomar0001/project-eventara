'use client';

import type { FormEvent } from 'react';
import { Loader2, RefreshCcw, ShieldCheck } from 'lucide-react';
import { humanizeRoleName, RolePermissionList } from '@/components/admin/manage-users/manage-users-ui';
import { FieldHint } from '@/components/system/forms/field-hint';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AdminUserAccountSummaryResponse as AdminUserAccountSummary, AssignableRoleResponse as AssignableRole } from '@/api/types.gen';

interface AdminRoleDialogProps {
  isLoadingRoles: boolean;
  isSubmitting: boolean;
  onCloseRoleDialog: () => void;
  onRoleChange: (value: string) => void;
  onRoleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pendingAction: 'role' | 'email' | 'password-reset' | 'delete' | 'special-permission' | 'delete-special-permission' | null;
  refreshRoles: () => void;
  roleDialogUser: AdminUserAccountSummary | null;
  roleError?: string;
  roles: AssignableRole[];
  rolesError: string | null;
  selectedRoleId: string;
}

export function AdminRoleDialog({
  isLoadingRoles,
  isSubmitting,
  onCloseRoleDialog,
  onRoleChange,
  onRoleSubmit,
  pendingAction,
  refreshRoles,
  roleDialogUser,
  roleError,
  roles,
  rolesError,
  selectedRoleId
}: AdminRoleDialogProps) {
  const selectedRole = roles.find((role) => role.id === selectedRoleId);
  const selectedRoleFeatureCount = new Set((selectedRole?.permissions ?? []).map((permission) => permission.feature_slug)).size;
  const selectedRolePermissionCount = selectedRole?.permissions?.length ?? 0;

  return (
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
                <SelectTrigger className="h-11 rounded-xl border-0 bg-neutral-100 shadow-none" id="admin-change-role" disabled={isLoadingRoles || isSubmitting}>
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
              <div className="rounded-xl border p-4 py-3">
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
                    <p className="pb-3 text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase">Included permissions</p>
                    <ScrollArea className="max-h-64 overflow-y-auto rounded-md">
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
  );
}
