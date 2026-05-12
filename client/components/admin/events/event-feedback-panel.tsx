'use client';

import { ChevronLeft, ChevronRight, Loader2, Star } from 'lucide-react';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEventFeedback } from '@/hooks/admin/events/use-event-feedback';
import type { EventFeedbackRecordResponse } from '@/api/types.gen';
import { cn } from '@/lib/utils';

type ColumnMeta = { cellClassName?: string; headerClassName?: string };

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function Rating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={cn('size-3.5', index < value ? 'fill-current' : 'text-neutral-200')} />
      ))}
      <span className="ml-1 text-xs font-medium text-neutral-600">{value}/5</span>
    </div>
  );
}

const columns: ColumnDef<EventFeedbackRecordResponse>[] = [
  {
    id: 'user_id',
    header: 'User ID',
    cell: ({ row }) => <p className="font-mono text-xs text-neutral-700">{shortId(row.original.user_id)}</p>,
    meta: { headerClassName: 'pl-6', cellClassName: 'pl-6' } satisfies ColumnMeta
  },
  {
    id: 'rating',
    header: 'Rating',
    cell: ({ row }) => <Rating value={row.original.rating} />
  },
  {
    id: 'comment',
    header: 'Comment',
    cell: ({ row }) => <p className="max-w-72 truncate text-sm text-neutral-700">{row.original.comment ?? '—'}</p>
  },
  {
    id: 'suggestion',
    header: 'Suggestion',
    cell: ({ row }) => <p className="max-w-72 truncate text-sm text-neutral-600">{row.original.suggestion ?? '—'}</p>
  },
  {
    id: 'submitted_on',
    header: 'Submitted on',
    cell: ({ row }) => <p className="text-sm text-neutral-600">{fmt(row.original.created_at)}</p>,
    meta: { headerClassName: 'pr-6', cellClassName: 'pr-6' } satisfies ColumnMeta
  }
];

export function EventFeedbackPanel({ eventId }: { eventId: string }) {
  const { feedback, total, page, totalPages, isLoading, error, setPage } = useEventFeedback(eventId);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: feedback,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="space-y-0 overflow-hidden rounded-[24px] ring-1 ring-neutral-200/80">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/80 bg-neutral-50/60 px-5 py-3.5">
        <span className="text-sm text-neutral-500">{total} total</span>
      </div>

      {error && <div className="px-5 py-4 text-sm text-red-600">{error}</div>}

      {isLoading ? (
        <div className="flex items-center justify-center px-5 py-12">
          <Loader2 className="size-5 animate-spin text-neutral-400" />
        </div>
      ) : (
        <Table className="min-w-220">
          <TableHeader className="bg-neutral-50/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as ColumnMeta | undefined;
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
            {feedback.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-neutral-500">No feedback submitted yet.</p>
                  <p className="mt-1 text-xs text-neutral-400">Checked-in attendees can submit feedback after the event ends.</p>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row, index) => (
                <TableRow key={row.id} className={cn('hover:bg-neutral-50/70', index % 2 !== 0 && 'bg-neutral-50/35')}>
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
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

      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-neutral-200/80 px-5 py-2.5">
          <span className="text-xs text-neutral-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t border-neutral-200/80 px-5 py-2.5 text-xs text-neutral-500">
          {feedback.length} feedback entr{feedback.length === 1 ? 'y' : 'ies'}
        </div>
      )}
    </div>
  );
}
