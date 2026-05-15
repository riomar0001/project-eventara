'use client';

import { Calendar, Mail, Phone, Shield } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { VolunteerRecord } from '@/hooks/admin/volunteers/use-volunteers';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-neutral-100 text-neutral-600',
  suspended: 'bg-red-100 text-red-700'
};

function getInitials(firstName: string | null, lastName: string | null, alias: string | null) {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
  if (alias) return alias.slice(0, 2).toUpperCase();
  return '??';
}

function getDisplayName(firstName: string | null, lastName: string | null, alias: string | null) {
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (alias) return alias;
  return '—';
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

type DetailRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
        <p className="mt-0.5 text-sm break-all text-neutral-800">{value}</p>
      </div>
    </div>
  );
}

type VolunteerProfileModalProps = {
  volunteer: VolunteerRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VolunteerProfileModal({ volunteer, open, onOpenChange }: VolunteerProfileModalProps) {
  if (!volunteer) return null;

  const displayName = getDisplayName(volunteer.first_name, volunteer.last_name, volunteer.alias);
  const initials = getInitials(volunteer.first_name, volunteer.last_name, volunteer.alias);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="border-b border-neutral-100 bg-gradient-to-br from-emerald-50 to-white px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="sr-only">Volunteer Profile</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="size-14">
              <AvatarFallback className="bg-emerald-100 text-lg font-semibold text-emerald-700">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-neutral-950">{displayName}</p>
              {volunteer.alias ? <p className="text-sm text-neutral-500">@{volunteer.alias}</p> : null}
              <div className="mt-1.5">
                <Badge variant="secondary" className={STATUS_STYLES[volunteer.status] ?? 'bg-neutral-100 text-neutral-600'}>
                  {volunteer.status.charAt(0).toUpperCase() + volunteer.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          {volunteer.email ? <DetailRow icon={<Mail className="size-4" />} label="Email" value={volunteer.email} /> : null}
          <DetailRow icon={<Phone className="size-4" />} label="Phone" value={volunteer.contact_phone} />
          <DetailRow icon={<Shield className="size-4" />} label="Volunteer Role" value={volunteer.role_name ?? '—'} />
          <DetailRow icon={<Calendar className="size-4" />} label="Member since" value={formatDate(volunteer.created_at)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
