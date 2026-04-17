import * as React from 'react';
import { Eye, KeyRound, Mail, MoreHorizontal, ShieldCheck, ShieldPlus, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDateTime, getInitials, humanizeRoleName, isSoftDeleteDisabled, UserStatusBadge } from '@/components/admin/manage-users/manage-users-ui';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { AdminUserAccountSummaryResponse as AdminUserAccountSummary } from '@/api/types.gen';

export type AdminTableColumnMeta = {
  cellClassName?: string;
  headerClassName?: string;
};

interface UseAdminTableColumnsProps {
  currentUserId: string | null;
  onOpenDeleteDialog: (user: AdminUserAccountSummary) => void;
  onOpenEmailDialog: (user: AdminUserAccountSummary) => void;
  onOpenPasswordResetDialog: (user: AdminUserAccountSummary) => void;
  onOpenRoleDialog: (user: AdminUserAccountSummary) => void;
  onOpenSpecialPermissionDialog: (user: AdminUserAccountSummary) => void;
  onSelectUser: (userId: string) => void;
}

export function useAdminTableColumns({
  currentUserId,
  onOpenDeleteDialog,
  onOpenEmailDialog,
  onOpenPasswordResetDialog,
  onOpenRoleDialog,
  onOpenSpecialPermissionDialog,
  onSelectUser
}: UseAdminTableColumnsProps) {
  return React.useMemo<ColumnDef<AdminUserAccountSummary>[]>(
    () => [
      {
        id: 'avatar',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
            </Avatar>
          </div>
        ),
        header: () => null,
        meta: {
          headerClassName: 'w-16 pl-6',
          cellClassName: 'pl-6'
        }
      },
      {
        accessorKey: 'user_id',
        cell: ({ row }) => <p className="text-xs">{row.original.user_id}</p>,
        header: 'ID'
      },
      {
        accessorKey: 'alias',
        cell: ({ row }) => <p className="text-sm text-neutral-900">@{row.original.alias ?? 'n/a'}</p>,
        header: 'Alias'
      },
      {
        accessorKey: 'name',
        cell: ({ row }) => <p className="font-medium text-neutral-900">{row.original.name}</p>,
        header: 'Name',
        meta: {
          cellClassName: 'px-6',
          headerClassName: 'px-6'
        }
      },
      {
        accessorKey: 'email',
        cell: ({ row }) => <p className="text-sm text-neutral-900">{row.original.email}</p>,
        header: 'Email',
        meta: {
          cellClassName: 'px-6',
          headerClassName: 'px-6'
        }
      },
      {
        accessorKey: 'role_name',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[11px]">
            {humanizeRoleName(row.original.role_name)}
          </Badge>
        ),
        header: 'Role',
        meta: {
          cellClassName: 'px-6',
          headerClassName: 'px-6'
        }
      },
      {
        id: 'status',
        cell: ({ row }) => (
          <div className="space-y-1">
            <UserStatusBadge status={row.original.status} />
            {row.original.deletion_scheduled_for ? (
              <p className="text-muted-foreground text-xs">Scheduled Deletion on {formatDateTime(row.original.deletion_scheduled_for)}</p>
            ) : null}
          </div>
        ),
        header: 'Status',
        meta: {
          cellClassName: 'px-6',
          headerClassName: 'px-6'
        }
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = currentUserId === user.user_id;

          return (
            <div className="text-right">
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
                  <DropdownMenuItem disabled={!user.role_id || user.status === 'deleted'} onSelect={() => onOpenSpecialPermissionDialog(user)}>
                    <ShieldPlus className="size-4" />
                    Special permission
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={isSelf} onSelect={() => onOpenEmailDialog(user)}>
                    <Mail className="size-4" />
                    Change email
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={isSelf} onSelect={() => onOpenPasswordResetDialog(user)}>
                    <KeyRound className="size-4" />
                    Reset password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" disabled={isSoftDeleteDisabled(user) || isSelf} onSelect={() => onOpenDeleteDialog(user)}>
                    <Trash2 className="size-4" />
                    Soft delete
                  </DropdownMenuItem>
                  {isSelf ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                        Manage your own account in Settings.
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        header: () => <div className="text-right">Actions</div>,
        meta: {
          cellClassName: 'px-6 text-right',
          headerClassName: 'px-6 text-right'
        }
      }
    ],
    [currentUserId, onOpenDeleteDialog, onOpenEmailDialog, onOpenPasswordResetDialog, onOpenRoleDialog, onOpenSpecialPermissionDialog, onSelectUser]
  );
}

