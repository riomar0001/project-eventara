'use client';

import type { FormEvent } from 'react';
import { CalendarClock, Loader2, Trash2 } from 'lucide-react';
import { FieldHint } from '@/components/shared/field-hint';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { AdminUserAccountSummaryResponse as AdminUserAccountSummary } from '@/api/types.gen';

interface AdminDeleteDialogProps {
  deleteDialogUser: AdminUserAccountSummary | null;
  deleteReason: string;
  deleteReasonError?: string;
  isSubmitting: boolean;
  onCloseDeleteDialog: () => void;
  onDeleteReasonChange: (value: string) => void;
  onDeleteSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pendingAction: 'role' | 'email' | 'password-reset' | 'delete' | 'special-permission' | 'delete-special-permission' | null;
}

export function AdminDeleteDialog({
  deleteDialogUser,
  deleteReason,
  deleteReasonError,
  isSubmitting,
  onCloseDeleteDialog,
  onDeleteReasonChange,
  onDeleteSubmit,
  pendingAction
}: AdminDeleteDialogProps) {
  return (
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
  );
}
