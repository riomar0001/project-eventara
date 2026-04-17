'use client';

import { RefreshCcw, ShieldX, X } from 'lucide-react';
import { flexRender, type Table as TanstackTable } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type AdminTableColumnMeta } from './table-columns';
import type { AdminUserAccountSummaryResponse as AdminUserAccountSummary } from '@/api/types.gen';
import { cn } from '@/lib/utils';

interface ManageUsersTableContentProps {
  columnsLength: number;
  error: string | null;
  hasActiveFilters: boolean;
  isEmpty: boolean;
  isLoading: boolean;
  onClearFilters: () => void;
  onRefresh: () => void;
  table: TanstackTable<AdminUserAccountSummary>;
}

function UserTableSkeletonRows() {
  return Array.from({ length: 6 }, (_, index) => (
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
  ));
}

function UsersTableEmptyState({ columnsLength, hasActiveFilters, onClearFilters }: Pick<ManageUsersTableContentProps, 'columnsLength' | 'hasActiveFilters' | 'onClearFilters'>) {
  return (
    <TableRow>
      <TableCell colSpan={columnsLength} className="px-6 py-14 text-center">
        <div className="space-y-2">
          <p className="text-base font-medium">{hasActiveFilters ? 'No users match your search' : 'No users found'}</p>
          <p className="text-muted-foreground text-sm">
            {hasActiveFilters ? 'Try adjusting your search term or status filter.' : 'Try refreshing the table after new accounts are created.'}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" size="sm" className="mt-2" onClick={onClearFilters}>
              <X className="size-3.5" />
              Clear filters
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

function UsersTableErrorState({ error, onRefresh }: Pick<ManageUsersTableContentProps, 'error' | 'onRefresh'>) {
  return (
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
  );
}

export function ManageUsersTableContent({
  columnsLength,
  error,
  hasActiveFilters,
  isEmpty,
  isLoading,
  onClearFilters,
  onRefresh,
  table
}: ManageUsersTableContentProps) {
  if (error) {
    return <UsersTableErrorState error={error} onRefresh={onRefresh} />;
  }

  return (
    <Table className="min-w-245 text-sm">
      <TableHeader className="border-y bg-neutral-50/80">
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
          <UserTableSkeletonRows />
        ) : isEmpty ? (
          <UsersTableEmptyState columnsLength={columnsLength} hasActiveFilters={hasActiveFilters} onClearFilters={onClearFilters} />
        ) : (
          table.getRowModel().rows.map((row, index) => (
            <TableRow key={row.id} className={cn('hover:bg-neutral-50/80', index % 2 !== 0 && 'bg-neutral-50/35')}>
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
  );
}
