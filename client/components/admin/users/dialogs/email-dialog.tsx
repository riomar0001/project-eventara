'use client';

import type { FormEvent } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { FieldHint } from '@/components/system/forms/field-hint';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { AdminUserAccountSummaryResponse as AdminUserAccountSummary } from '@/api/types.gen';

interface AdminEmailDialogProps {
  emailDialogUser: AdminUserAccountSummary | null;
  emailError?: string;
  emailValue: string;
  isSubmitting: boolean;
  onCloseEmailDialog: () => void;
  onEmailChange: (value: string) => void;
  onEmailSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pendingAction: 'role' | 'email' | 'password-reset' | 'delete' | 'special-permission' | 'delete-special-permission' | null;
}

export function AdminEmailDialog({
  emailDialogUser,
  emailError,
  emailValue,
  isSubmitting,
  onCloseEmailDialog,
  onEmailChange,
  onEmailSubmit,
  pendingAction
}: AdminEmailDialogProps) {
  return (
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
  );
}

