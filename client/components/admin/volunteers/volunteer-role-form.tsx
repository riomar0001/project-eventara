'use client';

import { type FormEvent, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Volunteers } from '@/api/sdk.gen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/system/api-request';
import { getAccessToken } from '@/store/auth-store';
import { FieldLabel } from './volunteers-shared';

export function VolunteerRoleForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setName('');
      setDescription('');
      onCreated?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to create volunteer role. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-3xl border-0 bg-white shadow-none ring-1 ring-neutral-200">
      <CardHeader className="border-b border-neutral-200/80 pb-5">
        <CardTitle>Create volunteer role</CardTitle>
        <CardDescription>Define a reusable volunteer role with a name and description for future assignments.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4">
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
                placeholder="Describe the responsibilities, availability, or event context for this role."
                maxLength={500}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {isSubmitting ? 'Creating...' : 'Create role'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || (!name && !description)}
              onClick={() => {
                setName('');
                setDescription('');
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}