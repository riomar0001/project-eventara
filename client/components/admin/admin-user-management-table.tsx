'use client';

import { ChevronLeft, ChevronRight, Eye, KeyRound, Loader2, Mail, MoreHorizontal, RefreshCcw, ShieldCheck, ShieldX, Trash2, Users } from 'lucide-react';
import { formatDateTime, getInitials, isSoftDeleteDisabled, UserStatusBadge, UserTableSkeleton } from '@/components/admin/admin-user-management-ui';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import type {
  AdminUserAccountPaginationResponse as AdminUserAccountPagination,
  AdminUserAccountSummaryResponse as AdminUserAccountSummary
} from '@/api/types.gen';
import { cn } from '@/lib/utils';

interface AdminUserManagementTableProps {
  error: string | null;
  isEmpty: boolean;
  isLoading: boolean;
  onOpenDeleteDialog: (user: AdminUserAccountSummary) => void;
  onOpenEmailDialog: (user: AdminUserAccountSummary) => void;
  onOpenPasswordResetDialog: (user: AdminUserAccountSummary) => void;
  onOpenRoleDialog: (user: AdminUserAccountSummary) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onSelectUser: (userId: string) => void;
  pagination: AdminUserAccountPagination;
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
  onPageChange,
  onRefresh,
  onSelectUser,
  pagination,
  users
}: AdminUserManagementTableProps) {
  const showingFrom = users.length === 0 ? 0 : (pagination.page - 1) * pagination.page_size + 1;
  const showingTo = users.length === 0 ? 0 : showingFrom + users.length - 1;
  const pageLabel = pagination.total_pages === 0 ? 0 : pagination.page;

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-linear-to-br from-white via-white to-neutral-50 shadow-none ring-1 ring-neutral-200">
        <CardHeader className="border-b">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Users className="size-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl">User Management</CardTitle>
              <CardDescription>
                Review user accounts, inspect full profiles, update access, trigger password resets, and schedule soft deletion with the existing 30-day grace
                period.
              </CardDescription>
            </div>
          </div>
          <CardAction>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
              Refresh
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">Total users</p>
            <p className="mt-3 text-3xl font-semibold">{pagination.total_count}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">Current page</p>
            <p className="mt-3 text-3xl font-semibold">{pageLabel}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">Deletion workflow</p>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              Soft delete requests keep the account recoverable for 30 days unless the user signs in again.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div>
            <CardTitle>All users</CardTitle>
            <CardDescription>Paginated account records with quick actions for administrators.</CardDescription>
          </div>
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
            <ScrollArea className="w-full">
              <table className="w-full min-w-190 text-sm">
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground border-y text-xs">
                    <th className="px-6 py-3 text-left font-medium">Name</th>
                    <th className="px-6 py-3 text-left font-medium">Email</th>
                    <th className="px-6 py-3 text-left font-medium">Role</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <UserTableSkeleton />
                  ) : isEmpty ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-14 text-center">
                        <div className="space-y-2">
                          <p className="text-base font-medium">No users found</p>
                          <p className="text-muted-foreground text-sm">Try refreshing the table after new accounts are created.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user, index) => (
                      <tr key={user.user_id} className={cn('border-b transition-colors hover:bg-neutral-50', index % 2 !== 0 && 'bg-neutral-50/40')}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <p className="font-medium text-neutral-900">{user.name}</p>
                              <p className="text-muted-foreground text-xs">{user.user_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-neutral-900">{user.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-[11px]">
                            {user.role_name ?? 'No role assigned'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <UserStatusBadge status={user.status} />
                            {user.deletion_scheduled_for ? (
                              <p className="text-muted-foreground text-xs">Scheduled {formatDateTime(user.deletion_scheduled_for)}</p>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Open actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuLabel>Account actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => onSelectUser(user.user_id)}>
                                <Eye className="size-4" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => onOpenRoleDialog(user)}>
                                <ShieldCheck className="size-4" />
                                Change role
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => onOpenEmailDialog(user)}>
                                <Mail className="size-4" />
                                Change email
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => onOpenPasswordResetDialog(user)}>
                                <KeyRound className="size-4" />
                                Reset password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" disabled={isSoftDeleteDisabled(user)} onSelect={() => onOpenDeleteDialog(user)}>
                                <Trash2 className="size-4" />
                                Soft delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollArea>
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
