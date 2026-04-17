'use client';

import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  AdminUserAccountDetailResponse as AdminUserAccountDetail,
  AdminUserAccountSummaryResponse as AdminUserAccountSummary,
  RolePermissionResponse
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

export function humanizeRoleName(value: string | null | undefined, fallback: string = 'No role assigned') {
  if (!value) return fallback;

  return humanizeValue(value);
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

export function formatRolePermission(permission: RolePermissionResponse) {
  const effectLabel = permission.effect === 'deny' ? 'Deny ' : '';
  return `${permission.feature_name} - ${effectLabel}${humanizeValue(permission.action)}`;
}

function formatRolePermissionAction(permission: RolePermissionResponse) {
  const actionLabel = humanizeValue(permission.action);
  return permission.effect === 'deny' ? `Deny ${actionLabel}` : actionLabel;
}

export function RolePermissionList({
  className,
  emptyLabel = 'No permissions are attached to this role.',
  permissions
}: {
  className?: string;
  emptyLabel?: string;
  permissions?: RolePermissionResponse[];
}) {
  if (!permissions || permissions.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  }

  const groupedPermissions = permissions.reduce<
    Array<{
      featureName: string;
      featureSlug: string;
      permissions: RolePermissionResponse[];
    }>
  >((groups, permission) => {
    const existingGroup = groups.find((group) => group.featureSlug === permission.feature_slug);

    if (existingGroup) {
      existingGroup.permissions.push(permission);
      return groups;
    }

    groups.push({
      featureName: permission.feature_name,
      featureSlug: permission.feature_slug,
      permissions: [permission]
    });

    return groups;
  }, []);

  return (
    <div className={cn('space-y-2', className)}>
      {groupedPermissions.map((group) => (
        <div key={group.featureSlug} className="rounded-xl border bg-neutral-50 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-neutral-900">{group.featureName}</p>
            <Badge variant="secondary" className="bg-white text-[10px] text-neutral-500 shadow-xs">
              {group.permissions.length}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {group.permissions.map((permission) => (
              <Badge
                key={`${permission.feature_slug}-${permission.action}-${permission.effect}`}
                variant="secondary"
                className={cn(
                  'h-auto rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-neutral-700 shadow-xs',
                  permission.effect === 'deny' && 'bg-red-50 text-red-700 shadow-none'
                )}
              >
                {formatRolePermissionAction(permission)}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
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

