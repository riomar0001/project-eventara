'use client';

import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ManageUsersOverview } from '../manage-users-overview';
import { useAdminTableColumns } from './table-columns';
import { ManageUsersTableContent } from './table-content';
import { ManageUsersTablePagination } from './table-pagination';
import { ManageUsersTableToolbar } from './table-toolbar';
import type {
  AdminUserAccountPaginationResponse as AdminUserAccountPagination,
  AdminUserAccountSummaryResponse as AdminUserAccountSummary,
  AssignableRoleResponse,
  UserStatus
} from '@/api/types.gen';
import { useAuthStore } from '@/store/auth-store';

interface AdminUserManagementTableProps {
  error: string | null;
  isEmpty: boolean;
  isLoading: boolean;
  onOpenDeleteDialog: (user: AdminUserAccountSummary) => void;
  onOpenEmailDialog: (user: AdminUserAccountSummary) => void;
  onOpenPasswordResetDialog: (user: AdminUserAccountSummary) => void;
  onOpenRoleDialog: (user: AdminUserAccountSummary) => void;
  onOpenSpecialPermissionDialog: (user: AdminUserAccountSummary) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onSearchChange: (value: string) => void;
  onSelectUser: (userId: string) => void;
  onStatusFilterChange: (value: UserStatus | undefined) => void;
  onRoleFilterChange: (value: string | undefined) => void;
  pagination: AdminUserAccountPagination;
  search: string;
  statusFilter: UserStatus | undefined;
  roleFilter: string | undefined;
  roles: AssignableRoleResponse[];
  users: AdminUserAccountSummary[];
}

export function AdminUserManagementTable({
  error,
  isEmpty,
  isLoading,
  onOpenDeleteDialog,
  onOpenEmailDialog,
  onOpenPasswordResetDialog,
  onOpenRoleDialog,
  onOpenSpecialPermissionDialog,
  onPageChange,
  onRefresh,
  onSearchChange,
  onSelectUser,
  onStatusFilterChange,
  onRoleFilterChange,
  pagination,
  search,
  statusFilter,
  roleFilter,
  roles,
  users
}: AdminUserManagementTableProps) {
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const hasActiveFilters = Boolean(search) || Boolean(statusFilter) || Boolean(roleFilter);

  const columns = useAdminTableColumns({
    currentUserId,
    onOpenDeleteDialog,
    onOpenEmailDialog,
    onOpenPasswordResetDialog,
    onOpenRoleDialog,
    onOpenSpecialPermissionDialog,
    onSelectUser
  });

  // TanStack Table is intentionally used here for the shadcn data table pattern.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="space-y-6">
      <ManageUsersOverview isLoading={isLoading} onRefresh={onRefresh} pagination={pagination} users={users} />

      <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
        <CardHeader className="flex flex-col items-start gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full">
            <CardTitle>All users</CardTitle>
            <CardDescription>Browse paginated user accounts and perform administrator actions quickly.</CardDescription>
          </div>
          <CardAction className="col-start-1 row-start-2 flex w-full flex-col gap-2 self-stretch sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:w-auto sm:flex-row sm:items-center sm:self-start sm:justify-self-end">
            <ManageUsersTableToolbar
              onRoleFilterChange={onRoleFilterChange}
              onSearchChange={onSearchChange}
              onStatusFilterChange={onStatusFilterChange}
              roleFilter={roleFilter}
              roles={roles}
              search={search}
              statusFilter={statusFilter}
            />
          </CardAction>
        </CardHeader>

        <CardContent className="p-0">
          <ManageUsersTableContent
            columnsLength={columns.length}
            error={error}
            hasActiveFilters={hasActiveFilters}
            isEmpty={isEmpty}
            isLoading={isLoading}
            onClearFilters={() => {
              onSearchChange('');
              onStatusFilterChange(undefined);
              onRoleFilterChange(undefined);
            }}
            onRefresh={onRefresh}
            table={table}
          />
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <ManageUsersTablePagination isLoading={isLoading} onPageChange={onPageChange} pagination={pagination} usersCount={users.length} />
        </CardFooter>
      </Card>
    </div>
  );
}
