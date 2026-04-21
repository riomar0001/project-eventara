'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface RoleDeleteDialogProps {
  description: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: (event: React.SyntheticEvent<HTMLFormElement>) => void;
  open: boolean;
  title: string;
}

export function RoleDeleteDialog({ description, isDeleting, onClose, onConfirm, open, title }: RoleDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-md border-0 bg-white p-0 shadow-xl shadow-neutral-950/10">
        <form onSubmit={onConfirm}>
          <DialogHeader className="border-b px-6 pt-6 pb-4">
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="leading-6">{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-6 py-5">
            <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
