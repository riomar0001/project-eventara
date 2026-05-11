'use client';

import { useEffect, useState } from 'react';
import { Loader2, PencilLine, Save, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackLink, FieldLabel } from './volunteers-shared';
import { Users, Volunteers } from '@/api/sdk.gen';
import type { VolunteerStatus } from '@/api/types.gen';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';
import { getAccessToken } from '@/store/auth-store';
import type { VolunteerRecord } from '@/hooks/admin/volunteers/use-volunteers';

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

const VOLUNTEER_STATUS_OPTIONS: { label: string; value: VolunteerStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
];

type VolunteerFormProps = {
  mode: 'create' | 'edit';
  initialData?: VolunteerRecord;
  onCancel?: () => void;
  onSaved?: () => void;
  variant?: 'dialog' | 'page';
};

type VolunteerRoleOption = {
  description: string | null;
  id: string;
  is_active: boolean;
  name: string;
};

type UserSearchResult = {
  alias?: string | null;
  email: string;
  name: string;
  user_id: string;
};

function normalizeAlias(alias: string) {
  return alias.trim().replace(/^@+/, '');
}

function extractVolunteerRoles(payload: unknown): VolunteerRoleOption[] {
  if (!payload || typeof payload !== 'object') return [];
  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return [];
  const roles = (data as { roles?: unknown }).roles;
  if (!Array.isArray(roles)) return [];

  return roles.filter((role): role is VolunteerRoleOption => {
    if (!role || typeof role !== 'object') return false;
    const r = role as Partial<VolunteerRoleOption>;
    return typeof r.id === 'string' && typeof r.name === 'string' && typeof r.is_active === 'boolean';
  });
}

export function VolunteerForm({ mode, initialData, onCancel, onSaved, variant = 'page' }: VolunteerFormProps) {
  const router = useRouter();
  const [alias, setAlias] = useState('');
  const [contactPhone, setContactPhone] = useState(initialData?.contact_phone ?? '');
  const [volunteerRoleId, setVolunteerRoleId] = useState(initialData?.volunteer_role_id ?? '');
  const [volunteerStatus, setVolunteerStatus] = useState<VolunteerStatus>(initialData?.status ?? 'active');
  const [roles, setRoles] = useState<VolunteerRoleOption[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setAlias('');
    setContactPhone('');
    setVolunteerRoleId('');
    setVolunteerStatus('active');
  }

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    let isMounted = true;

    async function fetchRoles() {
      setIsLoadingRoles(true);
      try {
        const result = await Volunteers.getAllVolunteerRolesVolunteerRolesGet({
          query: { page: 1, page_size: 100, is_active: true },
          headers: { Authorization: `Bearer ${accessToken}` },
          throwOnError: false
        });

        if (!isMounted) return;
        setRoles(extractVolunteerRoles(result.data));
      } catch {
        if (isMounted) toast.error('Unable to load volunteer roles.');
      } finally {
        if (isMounted) setIsLoadingRoles(false);
      }
    }

    fetchRoles();

    return () => {
      isMounted = false;
    };
  }, []);

  async function resolveUserByAlias(aliasValue: string, accessToken: string) {
    const cleanAlias = normalizeAlias(aliasValue);
    if (!cleanAlias) {
      toast.error('Alias is required.');
      return null;
    }

    const result = await Users.listUserAccountsUserAccountsGet({
      query: { page: 1, page_size: 10, search: cleanAlias },
      headers: { Authorization: `Bearer ${accessToken}` },
      throwOnError: false
    });

    if (!result.data) throw result.error ?? new Error('Unable to find user alias.');

    const users = result.data.data as UserSearchResult[];
    const exactMatch = users.find((user) => user.alias?.toLowerCase() === cleanAlias.toLowerCase());

    if (!exactMatch) {
      toast.error(`No user found with alias @${cleanAlias}.`);
      return null;
    }

    return exactMatch;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const accessToken = getAccessToken();
    if (!accessToken) {
      toast.error('You must be signed in.');
      return;
    }

    setIsSubmitting(true);

    if (mode === 'edit' && initialData) {
      try {
        const body: { contact_phone?: string; volunteer_role_id?: string; status?: VolunteerStatus } = {};
        if (contactPhone.trim() !== initialData.contact_phone) body.contact_phone = contactPhone.trim();
        if (volunteerRoleId !== initialData.volunteer_role_id) body.volunteer_role_id = volunteerRoleId;
        if (volunteerStatus !== initialData.status) body.status = volunteerStatus;

        if (Object.keys(body).length === 0) {
          toast.info('No changes to save.');
          return;
        }

        const result = await Volunteers.updateVolunteerInfoVolunteersVolunteerIdPatch({
          path: { volunteer_id: initialData.id },
          body,
          headers: { Authorization: `Bearer ${accessToken}` },
          throwOnError: false,
        });

        if (!result.data) throw result.error ?? new Error('Unable to update volunteer.');

        toast.success('Volunteer updated successfully.');
        if (variant === 'page') {
          router.push(ADMIN_OPERATIONS_PATHS.volunteers);
        } else {
          onSaved?.();
        }
      } catch (error) {
        toast.error(getVolunteerErrorMessage(error));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const selectedRole = roles.find((role) => role.id === volunteerRoleId);
    if (!selectedRole) {
      toast.error('Select an active volunteer role.');
      setIsSubmitting(false);
      return;
    }

    try {
      const user = await resolveUserByAlias(alias, accessToken);
      if (!user) return;

      const result = await Volunteers.addVolunteerVolunteersPost({
        body: {
          target_user_id: user.user_id,
          contact_phone: contactPhone.trim(),
          volunteer_role_id: selectedRole.id
        },
        headers: { Authorization: `Bearer ${accessToken}` },
        throwOnError: false
      });

      if (!result.data) throw result.error ?? new Error('Unable to save volunteer.');

      toast.success('Volunteer added successfully.');
      if (variant === 'page') {
        router.push(ADMIN_OPERATIONS_PATHS.volunteers);
      } else {
        resetForm();
        onSaved?.();
      }
    } catch (error) {
      toast.error(getVolunteerErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const form = (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4">
        {mode === 'create' && (
          <div className="space-y-2">
            <FieldLabel htmlFor="volunteer-alias">Alias *</FieldLabel>
            <Input
              id="volunteer-alias"
              value={alias}
              onChange={(event) => setAlias(event.target.value)}
              placeholder="@maya-chen"
              required
              disabled={isSubmitting}
            />
          </div>
        )}
        <div className="space-y-2">
          <FieldLabel htmlFor="contact-phone">Contact phone {mode === 'create' ? '*' : ''}</FieldLabel>
          <Input
            id="contact-phone"
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
            placeholder="+63 912 345 6789"
            minLength={7}
            maxLength={20}
            required={mode === 'create'}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="volunteer-role-id">Role {mode === 'create' ? '*' : ''}</FieldLabel>
          <Select value={volunteerRoleId} onValueChange={setVolunteerRoleId} disabled={isSubmitting || isLoadingRoles || roles.length === 0}>
            <SelectTrigger id="volunteer-role-id" className="w-full">
              <SelectValue placeholder={isLoadingRoles ? 'Loading roles...' : 'Select volunteer role'} />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {mode === 'edit' && (
          <div className="space-y-2">
            <FieldLabel htmlFor="volunteer-status">Status</FieldLabel>
            <Select value={volunteerStatus} onValueChange={(v) => setVolunteerStatus(v as VolunteerStatus)} disabled={isSubmitting}>
              <SelectTrigger id="volunteer-status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {VOLUNTEER_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Save volunteer'}
        </Button>
        {variant === 'page' ? (
          <Button type="button" variant="outline" asChild disabled={isSubmitting}>
            <Link href={ADMIN_OPERATIONS_PATHS.volunteers}>Cancel</Link>
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );

  if (variant === 'dialog') {
    return form;
  }

  return (
    <div className="space-y-6">
      <BackLink href={ADMIN_OPERATIONS_PATHS.volunteers} label="Back to volunteers" />

      <Card className="max-w-3xl border-0 bg-white shadow-none ring-1 ring-neutral-200">
        <CardHeader className="border-b border-neutral-200/80 pb-5">
          <CardTitle>{mode === 'create' ? 'Add volunteer' : 'Edit volunteer'}</CardTitle>
          <CardDescription>Register an existing user by alias, phone number, and active volunteer role.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">{form}</CardContent>
      </Card>
    </div>
  );
}

export function EditVolunteerDialog({
  volunteer,
  open,
  onOpenChange,
  onSaved,
}: {
  volunteer: VolunteerRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-0 p-0 shadow-[0_28px_80px_-34px_rgba(15,23,42,0.45)] ring-1 ring-emerald-200/80 sm:max-w-xl">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.18),_transparent_34%),linear-gradient(135deg,_#ecfdf5_0%,_#ffffff_64%)] px-6 pt-6 pb-5">
          <DialogHeader className="pr-8">
            <div className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-[0_18px_34px_-20px_rgba(5,150,105,0.9)]">
              <PencilLine className="size-5" />
            </div>
            <DialogTitle>Edit volunteer</DialogTitle>
            <DialogDescription>Update contact details, role assignment, or status for this volunteer.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 pb-6">
          <VolunteerForm
            mode="edit"
            initialData={volunteer}
            variant="dialog"
            onCancel={() => onOpenChange(false)}
            onSaved={() => {
              onOpenChange(false);
              onSaved?.();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AddVolunteerDialog({ onCreated, onOpenChange, open }: { onCreated?: () => void; onOpenChange: (open: boolean) => void; open: boolean }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-0 p-0 shadow-[0_28px_80px_-34px_rgba(15,23,42,0.45)] ring-1 ring-emerald-200/80 sm:max-w-xl">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.18),_transparent_34%),linear-gradient(135deg,_#ecfdf5_0%,_#ffffff_64%)] px-6 pt-6 pb-5">
          <DialogHeader className="pr-8">
            <div className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-[0_18px_34px_-20px_rgba(5,150,105,0.9)]">
              <UserPlus className="size-5" />
            </div>
            <DialogTitle>Add volunteer</DialogTitle>
            <DialogDescription>Register an existing user by alias, phone number, and active volunteer role.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6">
          <VolunteerForm
            mode="create"
            variant="dialog"
            onCancel={() => onOpenChange(false)}
            onSaved={() => {
              onOpenChange(false);
              onCreated?.();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
