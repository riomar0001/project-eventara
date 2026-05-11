'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Events } from '@/api/sdk.gen';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';
import { FieldLabel } from './events-shared';

const STATUS_WARNINGS: Record<string, string> = {
  posted: 'This session is currently published and visible to attendees.',
  started: 'This session is currently in progress. Active participants will lose access immediately.',
  ended: 'This session has already ended. Historical records will be permanently removed.',
  postponed: 'This session is postponed and may have registered attendees.',
};

type EventSessionDeleteDialogProps = {
  eventId: string;
  sessionId: string;
  sessionTitle: string;
  sessionStatus: string;
  onClose: () => void;
  onDeleted?: () => void;
};

export function EventSessionDeleteDialog({ eventId, sessionId, sessionTitle, sessionStatus, onClose, onDeleted }: EventSessionDeleteDialogProps) {
  const [confirmValue, setConfirmValue] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isMatch = confirmValue === sessionTitle;
  const warning = STATUS_WARNINGS[sessionStatus];

  async function handleDelete() {
    if (!isMatch || isDeleting) return;
    setIsDeleting(true);

    try {
      const result = await Events.deleteEventSessionEventsEventIdSessionSessionIdDelete({
        path: { event_id: eventId, session_id: sessionId },
        headers: getAuthHeaders(),
        throwOnError: false
      });

      if (!result.data) throw result.error ?? new Error('Unable to delete session right now.');

      toast.success(result.data.message ?? 'Session deleted successfully.');
      onDeleted?.();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to delete session right now.'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog defaultOpen onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete session</DialogTitle>
          <DialogDescription>
            This will permanently delete this session and all its participant records. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {warning && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              {warning}
            </div>
          )}

          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="mb-1 text-[10px] font-semibold tracking-[0.14em] text-red-500 uppercase">Session to delete</p>
            <p
              className="select-none text-sm font-medium text-red-900"
              onCopy={(e) => e.preventDefault()}
            >
              {sessionTitle}
            </p>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="session-delete-confirm">Type the session name to confirm</FieldLabel>
            <Input
              id="session-delete-confirm"
              value={confirmValue}
              onChange={(e) => setConfirmValue(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              placeholder="Enter session name"
              disabled={isDeleting}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={!isMatch || isDeleting}>
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {isDeleting ? 'Deleting…' : 'Delete session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
