'use client';

import { type FormEvent, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldLabel } from './volunteers-shared';
import { Volunteers } from '@/api/sdk.gen';
import { getApiErrorMessage } from '@/lib/system/api-request';
import { getAccessToken } from '@/store/auth-store';

export function VolunteerRoleForm({ onCreated, onOpenChange, open }: { onCreated?: () => void; onOpenChange: (open: boolean) => void; open: boolean }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setName('');
    setDescription('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error('Role name must be at least 2 characters.');
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      toast.error('You must be signed in to create a volunteer role.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await Volunteers.createVolunteerRoleVolunteerRolesPost({
        body: {
          name: trimmedName,
          description: description.trim() || null
        },
        headers: { Authorization: `Bearer ${accessToken}` },
        throwOnError: false
      });

      if (!result.data) throw result.error ?? new Error('Unable to create volunteer role.');

      toast.success('Volunteer role created successfully.');
      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to create volunteer role. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return;
        if (!nextOpen) resetForm();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="overflow-hidden border-0 p-0 shadow-[0_28px_80px_-34px_rgba(15,23,42,0.45)] ring-1 ring-emerald-200/80 sm:max-w-xl">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.18),_transparent_34%),linear-gradient(135deg,_#ecfdf5_0%,_#ffffff_64%)] px-6 pt-6 pb-5">
          <DialogHeader className="pr-8">
            <div className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-[0_18px_34px_-20px_rgba(5,150,105,0.9)]">
              <Plus className="size-5" />
            </div>
            <DialogTitle>Create volunteer role</DialogTitle>
            <DialogDescription>Define a reusable role that can be assigned across events and volunteer profiles.</DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5 px-6 pb-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <FieldLabel htmlFor="volunteer-role-name">Name *</FieldLabel>
            <Input
              id="volunteer-role-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Registration lead, usher, stage support..."
              minLength={2}
              maxLength={100}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="volunteer-role-description">Description</FieldLabel>
            <Textarea
              id="volunteer-role-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe responsibilities, availability, or event context for this role."
              maxLength={500}
              disabled={isSubmitting}
              className="min-h-28 resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting || (!name && !description)} onClick={resetForm}>
              Clear
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {isSubmitting ? 'Creating...' : 'Create role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
