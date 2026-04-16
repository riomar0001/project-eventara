'use client';

import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  AdminUserAccountDetailResponse as AdminUserAccountDetail,
  AdminUserAccountSummaryResponse as AdminUserAccountSummary
} from '@/api/types.gen';
import { cn } from '@/lib/utils';

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) return 'NA';
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export function humanizeValue(value: string | null | undefined) {
  if (!value) return 'Not set';

  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Not available';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return format(date, 'PPP p');
}

export function getAccountStatusLabel(status: AdminUserAccountSummary['status'] | AdminUserAccountDetail['status']) {
  return status === 'deleted' ? 'Deleted' : 'Active';
}

export function isSoftDeleteDisabled(user: Pick<AdminUserAccountSummary, 'status' | 'deletion_scheduled_for'>) {
  return user.status === 'deleted' || Boolean(user.deletion_scheduled_for);
}

export function UserStatusBadge({ status }: { status: AdminUserAccountSummary['status'] | AdminUserAccountDetail['status'] }) {
  const isDeleted = status === 'deleted';

  return (
    <Badge variant="outline" className={cn('border-transparent text-[11px]', isDeleted ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700')}>
      {getAccountStatusLabel(status)}
    </Badge>
  );
}

export function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-muted-foreground text-xs font-medium tracking-[0.16em] uppercase">{label}</p>
      <p className="text-sm font-medium text-neutral-900">{value}</p>
    </div>
  );
}

export function UserTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }, (_, index) => (
        <tr key={`skeleton-${index}`} className="border-b">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <Skeleton className="h-3.5 w-44" />
          </td>
          <td className="px-6 py-4">
            <Skeleton className="h-5 w-28" />
          </td>
          <td className="px-6 py-4">
            <Skeleton className="h-5 w-20" />
          </td>
          <td className="px-6 py-4 text-right">
            <Skeleton className="ml-auto h-8 w-8 rounded-xl" />
          </td>
        </tr>
      ))}
    </>
  );
}
