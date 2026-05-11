'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BackLink, FieldLabel } from './volunteers-shared';
import { Volunteers } from '@/api/sdk.gen';
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

function getVolunteerErrorMessage(error: unknown) {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const d = (error as { response?: { data?: unknown } }).response?.data;
    const message = extractErrorMessage(d) ?? extractErrorMessage(error);
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return 'Unable to save volunteer. Please try again.';
}

export function VolunteerForm({ mode }: { mode: 'create' | 'edit' }) {
  const router = useRouter();
  const [targetUserId, setTargetUserId] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [volunteerRoleId, setVolunteerRoleId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode !== 'create' || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await Volunteers.addVolunteerVolunteersPost({
        body: {
          target_user_id: targetUserId.trim(),
          contact_phone: contactPhone.trim(),
          volunteer_role_id: volunteerRoleId.trim()
        },
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        throwOnError: false
      });

      if (!result.data) throw result.error ?? new Error('Unable to save volunteer.');

      toast.success('Volunteer added successfully.');
      router.push(ADMIN_OPERATIONS_PATHS.volunteers);
    } catch (error) {
      toast.error(getVolunteerErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <BackLink href={ADMIN_OPERATIONS_PATHS.volunteers} label="Back to volunteers" />

      <Card className="max-w-3xl border-0 bg-white shadow-none ring-1 ring-neutral-200">
        <CardHeader className="border-b border-neutral-200/80 pb-5">
          <CardTitle>{mode === 'create' ? 'Add volunteer' : 'Edit volunteer'}</CardTitle>
          <CardDescription>Register an existing user as a volunteer by assigning an active volunteer role.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="space-y-2">
                <FieldLabel htmlFor="target-user-id">Target user ID *</FieldLabel>
                <Input id="target-user-id" value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)} placeholder="User UUID" required />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="contact-phone">Contact phone *</FieldLabel>
                <Input
                  id="contact-phone"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  placeholder="+63 912 345 6789"
                  minLength={7}
                  maxLength={20}
                  required
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="volunteer-role-id">Volunteer role ID *</FieldLabel>
                <Input
                  id="volunteer-role-id"
                  value={volunteerRoleId}
                  onChange={(event) => setVolunteerRoleId(event.target.value)}
                  placeholder="Volunteer role UUID"
                  required
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSubmitting || mode !== 'create'}>
                <Save className="size-4" />
                {isSubmitting ? 'Saving...' : 'Save volunteer'}
              </Button>
              <Button type="button" variant="outline" asChild disabled={isSubmitting}>
                <Link href={ADMIN_OPERATIONS_PATHS.volunteers}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
