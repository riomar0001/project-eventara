'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEventParticipants } from '@/hooks/admin/events/use-event-participants';
import type { EventParticipantRecord, EventParticipantStatus } from '@/api/types.gen';
import { cn } from '@/lib/utils';

type ColumnMeta = { cellClassName?: string; headerClassName?: string };

type StatusFilter = 'all' | EventParticipantStatus;

const STATUS_BADGE: Record<EventParticipantStatus, string> = {
  registered: 'bg-sky-100 text-sky-800',
  attended: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-neutral-100 text-neutral-600'
};

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function ParticipantStatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE[status as EventParticipantStatus] ?? 'bg-neutral-100 text-neutral-600';
  const label = status === 'no_show' ? 'No show' : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <Badge variant="secondary" className={cls}>
      {label}
    </Badge>
  );
}

const participantColumns: ColumnDef<EventParticipantRecord>[] = [
  {
    id: 'user_id',
    header: 'User ID',
    cell: ({ row }) => <p className="font-mono text-xs text-neutral-700">{shortId(row.original.user_id)}</p>,
    meta: { headerClassName: 'pl-6', cellClassName: 'pl-6' } satisfies ColumnMeta
  },
  {
    id: 'session_id',
    header: 'Session ID',
    cell: ({ row }) => <p className="font-mono text-xs text-neutral-500">{shortId(row.original.event_session_id)}</p>
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <ParticipantStatusBadge status={row.original.status} />
  },
  {
    id: 'checked_in',
    header: 'Checked in',
    cell: ({ row }) => (
      <Badge variant="secondary" className={row.original.is_checked_in ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'}>
        {row.original.is_checked_in ? 'Yes' : 'No'}
      </Badge>
    )
  },
  {
    id: 'checked_in_time',
    header: 'Checked in date',
    cell: ({ row }) => <p className="text-sm text-neutral-600">{fmtDateTime(row.original.checked_in_time)}</p>
  },
  {
    id: 'registered_on',
    header: 'Registered on',
    cell: ({ row }) => <p className="text-sm text-neutral-600">{fmt(row.original.created_at)}</p>
  }
];

export interface EventParticipantsPanelProps {
  eventId: string;
  refreshKey?: number;
}

export function EventParticipantsPanel({ eventId, refreshKey = 0 }: EventParticipantsPanelProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { participants, total, page, totalPages, isLoading, error, setPage } = useEventParticipants(eventId, statusFilter === 'all' ? null : statusFilter, refreshKey);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: participants,
    columns: participantColumns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="space-y-0 overflow-hidden rounded-[24px] ring-1 ring-neutral-200/80">
      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200/80 bg-neutral-50/60 px-5 py-3.5">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="h-8 w-44 text-sm">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="registered">Registered</SelectItem>
            <SelectItem value="attended">Attended</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show">No show</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-neutral-500">{total} total</span>
      </div>

      {error && <div className="px-5 py-4 text-sm text-red-600">{error}</div>}

      {isLoading ? (
        <div className="flex items-center justify-center px-5 py-12">
          <Loader2 className="size-5 animate-spin text-neutral-400" />
        </div>
      ) : (
        <Table className="min-w-160">
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
            {participants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={participantColumns.length} className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-neutral-500">No participants found.</p>
                  <p className="mt-1 text-xs text-neutral-400">Participants appear here once they register for a session.</p>
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

      {totalPages > 1 && (
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
      )}

      {totalPages <= 1 && (
        <div className="border-t border-neutral-200/80 px-5 py-2.5 text-xs text-neutral-500">
          {participants.length} participant{participants.length === 1 ? '' : 's'}
          {statusFilter !== 'all' ? ` with status "${statusFilter === 'no_show' ? 'no show' : statusFilter}"` : ''}
        </div>
      )}
    </div>
  );
}
