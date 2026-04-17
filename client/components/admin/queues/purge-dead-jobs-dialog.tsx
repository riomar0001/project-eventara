'use client';

import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QUEUE_MANAGEMENT_TEXT } from '@/constants/admin/queues';

interface PurgeDeadJobsDialogProps {
  deadJobCount: number;
  isPurging: boolean;
  onClose: () => void;
  onConfirm: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
}

export function PurgeDeadJobsDialog({ deadJobCount, isPurging, onClose, onConfirm, open }: PurgeDeadJobsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-md">
        <form className="space-y-5" onSubmit={onConfirm}>
          <DialogHeader>
            <DialogTitle>{QUEUE_MANAGEMENT_TEXT.purgeTitle}</DialogTitle>
            <DialogDescription>
              {QUEUE_MANAGEMENT_TEXT.purgeDescription} {deadJobCount} failed job{deadJobCount === 1 ? '' : 's'} will be removed.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-neutral-700">
            Purging the dead-letter queue only clears the archived failure records. It does not retry the jobs and it cannot be undone later.
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPurging}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isPurging}>
              {isPurging ? 'Purging...' : 'Purge dead-letter queue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
