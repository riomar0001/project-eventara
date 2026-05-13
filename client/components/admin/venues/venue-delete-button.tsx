'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Venues } from '@/api/sdk.gen';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';
import { getAccessToken } from '@/store/auth-store';

function extractErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as { detail?: unknown; message?: unknown };
  if (typeof p.detail === 'string') return p.detail;
  if (Array.isArray(p.detail) && p.detail.length > 0) {
    const first = p.detail[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') {
      const ve = first as { msg?: unknown; message?: unknown };
      if (typeof ve.msg === 'string') return ve.msg;
      if (typeof ve.message === 'string') return ve.message;
    }
  }
  if (typeof p.message === 'string') return p.message;
  return undefined;
}

function getDeleteErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const d = (error as { response?: { data?: unknown } }).response?.data;
    const message = extractErrorMessage(d) ?? extractErrorMessage(error);
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return 'Unable to delete the venue right now.';
}

export function DeleteVenueButton({ suggestedVenue = false, venueId, venueName }: { suggestedVenue?: boolean; venueId: string; venueName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const result = suggestedVenue
        ? await Venues.deleteSuggestedVenueVenuesCommunityVenueIdDelete({
            path: { venue_id: venueId },
            headers: { Authorization: `Bearer ${getAccessToken()}` },
            throwOnError: false
          })
        : await Venues.deleteVenueVenuesVenueIdDelete({
            path: { venue_id: venueId },
            headers: { Authorization: `Bearer ${getAccessToken()}` },
            throwOnError: false
          });

      if (result.error) throw result.error;

      toast.success(suggestedVenue ? 'Venue suggestion deleted successfully.' : 'Venue deleted successfully.');
      setOpen(false);
      router.push(ADMIN_OPERATIONS_PATHS.venues);
      router.refresh();
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
          Delete venue
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Delete venue</DialogTitle>
          <DialogDescription>
            This will permanently delete &ldquo;{venueName}&rdquo;. The venue cannot be deleted while event sessions still reference it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isDeleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete venue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
