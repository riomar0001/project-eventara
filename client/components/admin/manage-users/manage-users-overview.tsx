'use client';

import { Loader2, RefreshCcw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminUserAccountPaginationResponse as AdminUserAccountPagination, AdminUserAccountSummaryResponse as AdminUserAccountSummary } from '@/api/types.gen';

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
    <Card className="border-0 bg-linear-to-br from-sky-50 via-white to-white shadow-none ring-1 ring-sky-200/80">
      <CardHeader className="border-b border-neutral-200/80 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <Users className="size-5 text-neutral-900" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl">User Management</CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-6">
                  Review accounts, update access, inspect profiles, and handle lifecycle actions from one practical admin surface.
                </CardDescription>
              </div>
            </div>
          </div>

          <CardAction>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
              Refresh
            </Button>
          </CardAction>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">Total Users</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{pagination.total_count}</p>
          <p className="mt-2 text-sm text-neutral-500">Accounts currently visible in the admin index.</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">Active Users</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{activeUsersCount}</p>
          <p className="mt-2 text-sm text-neutral-500">Accounts that are not scheduled as deleted.</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">Assigned Roles</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{roleAssignedCount}</p>
          <p className="mt-2 text-sm text-neutral-500">{deletedUsersCount} deleted accounts in the current page snapshot.</p>
        </div>
      </CardContent>
    </Card>
  );
}
