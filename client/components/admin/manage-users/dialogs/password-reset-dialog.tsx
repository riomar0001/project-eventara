'use client';

import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { AdminUserAccountSummaryResponse as AdminUserAccountSummary } from '@/api/types.gen';

interface AdminPasswordResetDialogProps {
  isSubmitting: boolean;
  onClosePasswordResetDialog: () => void;
  onPasswordResetConfirm: () => void;
  passwordResetUser: AdminUserAccountSummary | null;
  pendingAction: 'role' | 'email' | 'password-reset' | 'delete' | 'special-permission' | 'delete-special-permission' | null;
}

export function AdminPasswordResetDialog({
  isSubmitting,
  onClosePasswordResetDialog,
  onPasswordResetConfirm,
  passwordResetUser,
  pendingAction
}: AdminPasswordResetDialogProps) {
  return (
    <Dialog open={Boolean(passwordResetUser)} onOpenChange={(open) => !open && onClosePasswordResetDialog()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>Send the standard password reset link to the user&apos;s current verified email address.</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
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
  );
}
