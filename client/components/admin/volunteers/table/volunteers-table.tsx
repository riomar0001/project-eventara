'use client';

import { Users } from 'lucide-react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { volunteerColumns, type VolunteerColumnMeta, type VolunteerTableRecord } from './table-columns';
import { cn } from '@/lib/utils';

interface VolunteersTableContentProps {
  volunteers: VolunteerTableRecord[];
}

export function VolunteersTableContent({ volunteers }: VolunteersTableContentProps) {
  // TanStack Table is intentionally used here for the shadcn data table pattern.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: volunteers,
    columns: volunteerColumns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <Table className="min-w-220">
      <TableHeader className="bg-neutral-50/80">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const meta = header.column.columnDef.meta as VolunteerColumnMeta | undefined;

              return (
                <TableHead key={header.id} className={cn('py-3 text-xs font-medium text-neutral-500', meta?.headerClassName)}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {volunteers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={volunteerColumns.length} className="px-6 py-16 text-center">
              <div className="space-y-2">
                <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Users className="size-5" />
                </div>
                <p className="font-medium text-neutral-950">No volunteers match this filter set</p>
                <p className="text-sm text-neutral-500">Try widening the search or clearing one of the dropdown filters.</p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row, index) => (
            <TableRow key={row.id} className={cn('hover:bg-neutral-50/70', index % 2 !== 0 && 'bg-neutral-50/35')}>
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta as VolunteerColumnMeta | undefined;

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
