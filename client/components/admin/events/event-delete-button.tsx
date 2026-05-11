'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';
import { FieldLabel } from './events-shared';

const STATUS_WARNINGS: Record<string, string> = {
  posted: 'This event is currently published and visible on the public calendar.',
  started: 'This event is currently in progress. All active participants will lose access immediately.',
  ended: 'This event has already ended. Historical records will be permanently removed.',
  postponed: 'This event is postponed and may have participants waiting for updates.',
};

function extractErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as { detail?: unknown; message?: unknown };
  if (typeof p.detail === 'string') return p.detail;
  if (typeof p.message === 'string') return p.message;
  return undefined;
}

function getDeleteErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const d = (error as { response?: { data?: unknown } }).response?.data;
    const msg = extractErrorMessage(d) ?? extractErrorMessage(error);
    if (msg) return msg;
  }
  if (error instanceof Error) return error.message;
  return 'Unable to delete the event right now.';
}

export function DeleteEventButton({ eventId, eventTitle, eventStatus }: { eventId: string; eventTitle: string; eventStatus: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const warning = STATUS_WARNINGS[eventStatus];
  const isMatch = confirmValue === eventTitle;

  function handleOpenChange(next: boolean) {
    if (!next) setConfirmValue('');
    setOpen(next);
  }

  async function handleDelete() {
    if (!isMatch || isDeleting) return;
    setIsDeleting(true);

    try {
      const result = await Events.deleteEventEventsEventIdDelete({
        path: { event_id: eventId },
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        throwOnError: false
      });

      if (!result.data) throw result.error ?? new Error('Unable to delete event right now.');

      toast.success(result.data.message ?? 'Event deleted successfully.');
      setOpen(false);
      router.push(ADMIN_OPERATIONS_PATHS.events);
    } catch (error) {
      toast.error(getDeleteErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="size-4" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete event</DialogTitle>
          <DialogDescription>
            This will permanently delete this event and all its sessions. This action cannot be undone.
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
            <p className="mb-1 text-[10px] font-semibold tracking-[0.14em] text-red-500 uppercase">Event to delete</p>
            <p
              className="select-none text-sm font-medium text-red-900"
              onCopy={(e) => e.preventDefault()}
            >
              {eventTitle}
            </p>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="event-delete-confirm">Type the event name to confirm</FieldLabel>
            <Input
              id="event-delete-confirm"
              value={confirmValue}
              onChange={(e) => setConfirmValue(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              placeholder="Enter event name"
              disabled={isDeleting}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isDeleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={!isMatch || isDeleting}>
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {isDeleting ? 'Deleting…' : 'Delete event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
