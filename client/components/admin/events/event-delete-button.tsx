'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Events } from '@/api/sdk.gen';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';
import { getAccessToken } from '@/store/auth-store';

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

export function DeleteEventButton({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (isDeleting) return;
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="size-4" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Delete event</DialogTitle>
          <DialogDescription>This will permanently delete &ldquo;{eventTitle}&rdquo; and all its sessions. This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isDeleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
