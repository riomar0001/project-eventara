'use client';

import { ChevronLeft, ChevronRight, Loader2, RefreshCcw, Search, ShieldX, X } from 'lucide-react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { STATUS_OPTIONS } from '../../constants/user-managment';
import { humanizeRoleName } from './admin-user-management-ui';
import { useAdminTableColumns, type AdminTableColumnMeta } from './table-columns';
import type {
  AdminUserAccountPaginationResponse as AdminUserAccountPagination,
  AdminUserAccountSummaryResponse as AdminUserAccountSummary,
  AssignableRoleResponse,
  UserStatus
} from '@/api/types.gen';
import { cn } from '@/lib/utils';
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
  const activeUsersCount = users.filter((user) => user.status !== 'deleted').length;
  const deletedUsersCount = users.filter((user) => user.status === 'deleted').length;
  const showingFrom = users.length === 0 ? 0 : (pagination.page - 1) * pagination.page_size + 1;
  const showingTo = users.length === 0 ? 0 : showingFrom + users.length - 1;
  const pageLabel = pagination.total_pages === 0 ? 0 : pagination.page;
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
      <Card className="border-0 bg-linear-to-br from-white via-white to-neutral-50 shadow-none ring-1 ring-neutral-200">
        <CardHeader className="border-b">
          <div className="flex items-start gap-4">
            <div className="w-full space-y-1">
              <div className="flex flex-row justify-between">
                <CardTitle className="text-xl">User Management</CardTitle>
                <CardAction>
                  <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
                    Refresh
                  </Button>
                </CardAction>
              </div>

              <CardDescription>
                Review user accounts, inspect complete profiles, manage access, send password reset links, and handle soft deletion within the 30-day grace
                period.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">Total User</p>
            <p className="mt-3 text-2xl font-semibold md:text-3xl">{pagination.total_count}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">Active User</p>
            <p className="mt-3 text-2xl font-semibold md:text-3xl">{activeUsersCount}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">Delete User</p>
            <p className="mt-3 text-2xl font-semibold md:text-3xl">{deletedUsersCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col items-start gap-4 border-b data-[slot=card-action]:grid-cols-none data-[slot=card-action]:has-[:data-[slot=card-action]]:grid-cols-none sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full">
            <CardTitle>All users</CardTitle>
            <CardDescription>Browse paginated user accounts and perform administrator actions quickly.</CardDescription>
          </div>
          <CardAction className="col-start-1 row-start-2 flex w-full flex-col gap-2 self-stretch sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:w-auto sm:flex-row sm:items-center sm:self-start sm:justify-self-end">
            <div className="relative w-full sm:w-auto">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
              <Input
                id="admin-user-search"
                className="h-8 w-full pl-8 text-sm sm:w-90"
                placeholder="Search name, email, alias..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {search && (
                <button
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 transition-colors"
                  onClick={() => onSearchChange('')}
                  type="button"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <Select value={statusFilter ?? 'all'} onValueChange={(value) => onStatusFilterChange(value === 'all' ? undefined : (value as UserStatus))}>
              <SelectTrigger id="admin-user-status-filter" className="h-8 w-full text-sm sm:w-36">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={roleFilter ?? 'all'} onValueChange={(value) => onRoleFilterChange(value === 'all' ? undefined : value)}>
              <SelectTrigger id="admin-user-role-filter" className="h-8 w-full text-sm sm:w-36">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.name}>
                    {humanizeRoleName(role.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>

        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
              <ShieldX className="size-10 text-red-500" />
              <div className="space-y-1">
                <p className="text-base font-medium">Unable to load user accounts</p>
                <p className="text-muted-foreground text-sm">{error}</p>
              </div>
              <Button variant="outline" onClick={onRefresh}>
                <RefreshCcw className="size-4" />
                Try again
              </Button>
            </div>
          ) : (
            <Table className="min-w-245 text-sm">
              <TableHeader className="bg-muted/40 border-y">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const meta = header.column.columnDef.meta as AdminTableColumnMeta | undefined;

                      return (
                        <TableHead key={header.id} className={cn('text-muted-foreground py-3 text-xs font-medium', meta?.headerClassName)}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }, (_, index) => (
                    <TableRow key={`user-table-skeleton-${index}`}>
                      <TableCell className="pl-6">
                        <Skeleton className="size-9 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-3.5 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-3.5 w-24" />
                      </TableCell>
                      <TableCell className="px-6">
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell className="px-6">
                        <Skeleton className="h-4 w-44" />
                      </TableCell>
                      <TableCell className="px-6">
                        <Skeleton className="h-5 w-28" />
                      </TableCell>
                      <TableCell className="px-6">
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell className="px-6 text-right">
                        <Skeleton className="ml-auto h-8 w-8 rounded-xl" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : isEmpty ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="px-6 py-14 text-center">
                      <div className="space-y-2">
                        <p className="text-base font-medium">{hasActiveFilters ? 'No users match your search' : 'No users found'}</p>
                        <p className="text-muted-foreground text-sm">
                          {hasActiveFilters ? 'Try adjusting your search term or status filter.' : 'Try refreshing the table after new accounts are created.'}
                        </p>
                        {hasActiveFilters && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              onSearchChange('');
                              onStatusFilterChange(undefined);
                              onRoleFilterChange(undefined);
                            }}
                          >
                            <X className="size-3.5" />
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row, index) => (
                    <TableRow key={row.id} className={cn('hover:bg-neutral-50', index % 2 !== 0 && 'bg-neutral-50/40')}>
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta as AdminTableColumnMeta | undefined;

                        return (
                          <TableCell key={cell.id} className={cn('py-4', meta?.cellClassName)}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs">
            Showing {showingFrom}-{showingTo} of {pagination.total_count}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, pagination.page - 1))} disabled={isLoading || !pagination.has_previous}>
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-muted-foreground min-w-24 text-center text-xs">
              Page {pageLabel} of {pagination.total_pages}
            </span>
            <Button variant="outline" size="sm" onClick={() => onPageChange(pagination.page + 1)} disabled={isLoading || !pagination.has_next}>
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
