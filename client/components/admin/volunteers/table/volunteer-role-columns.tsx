'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export type VolunteerRoleTableRecord = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type VolunteerRoleColumnMeta = {
  cellClassName?: string;
  headerClassName?: string;
};

type RoleActions = {
  onEdit: (role: VolunteerRoleTableRecord) => void;
  onDelete: (role: VolunteerRoleTableRecord) => void;
};

export function buildVolunteerRoleColumns(actions: RoleActions): ColumnDef<VolunteerRoleTableRecord>[] {
  return [
    {
      id: 'name',
      header: 'Role name',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="font-medium text-neutral-950">{row.original.name}</p>
          {row.original.description && (
            <p className="max-w-xs truncate text-xs text-neutral-500">{row.original.description}</p>
          )}
        </div>
      ),
      meta: {
        headerClassName: 'pl-6',
        cellClassName: 'pl-6'
      } satisfies VolunteerRoleColumnMeta
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={
            row.original.is_active
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-neutral-100 text-neutral-500'
          }
        >
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      id: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <p className="text-sm text-neutral-500">
          {row.original.created_at
            ? new Date(row.original.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })
            : '—'}
        </p>
      )
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open role actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onEdit(row.original)}>
                <Pencil className="size-4" />
                Edit role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => actions.onDelete(row.original)}
              >
                <Trash2 className="size-4" />
                Delete role
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      meta: {
        headerClassName: 'px-6 text-right',
        cellClassName: 'px-6 text-right'
      } satisfies VolunteerRoleColumnMeta
    }
  ];
}
