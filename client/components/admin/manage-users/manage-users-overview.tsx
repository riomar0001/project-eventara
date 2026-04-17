'use client';

import { Loader2, RefreshCcw, Users } from 'lucide-react';
import { AdminPageHero } from '@/components/admin/shared/admin-page-hero';
import { Button } from '@/components/ui/button';
import type {
  AdminUserAccountPaginationResponse as AdminUserAccountPagination,
  AdminUserAccountSummaryResponse as AdminUserAccountSummary
} from '@/api/types.gen';

interface ManageUsersOverviewProps {
  isLoading: boolean;
  onRefresh: () => void;
  pagination: AdminUserAccountPagination;
  users: AdminUserAccountSummary[];
}

export function ManageUsersOverview({ isLoading, onRefresh, pagination, users }: ManageUsersOverviewProps) {
  const activeUsersCount = users.filter((user) => user.status !== 'deleted').length;
  const deletedUsersCount = users.filter((user) => user.status === 'deleted').length;
  const roleAssignedCount = users.filter((user) => Boolean(user.role_id)).length;

  return (
    <AdminPageHero
      actions={
        <Button variant="outline" className="border-slate-300/70 bg-white/70 text-slate-900 hover:bg-white" size="sm" onClick={onRefresh} disabled={isLoading}>
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
          Refresh roster
        </Button>
      }
      description="Review accounts, adjust access, inspect profiles, and handle account lifecycle work from a single high-signal operations surface."
      eyebrow={
        <>
          User Operations
        </>
      }
      metrics={[
        {
          label: 'Total Users',
          value: pagination.total_count,
          hint: 'Accounts currently visible in the paginated admin index.'
        },
        {
          label: 'Active Users',
          value: activeUsersCount,
          hint: 'Accounts that are not currently marked as deleted.'
        },
        {
          label: 'Assigned Roles',
          value: roleAssignedCount,
          hint: `${deletedUsersCount} deleted accounts in the current page snapshot.`,
          emphasis: 'accent'
        }
      ]}
      title="User Management"
      tone="slate"
    />
  );
}
