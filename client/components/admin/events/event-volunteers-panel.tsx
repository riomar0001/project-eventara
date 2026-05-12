'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, MoreHorizontal, Plus, UserX, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEventVolunteers } from '@/hooks/admin/events/use-event-volunteers';
import { EventVolunteers } from '@/api/sdk.gen';
import type { EventVolunteerRecordResponse, EventVolunteerStatus } from '@/api/types.gen';
import { resolveStorageImageUrl } from '@/lib/storage/image-url';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';
import { cn } from '@/lib/utils';

type ColumnMeta = { cellClassName?: string; headerClassName?: string };

type StatusFilter = 'all' | EventVolunteerStatus;

const STATUS_BADGE: Record<EventVolunteerStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  joined: 'bg-emerald-100 text-emerald-800',
  left: 'bg-neutral-100 text-neutral-600',
  rejected: 'bg-red-100 text-red-700'
};

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function volunteerName(record: EventVolunteerRecordResponse) {
  const fullName = [record.volunteer_first_name, record.volunteer_last_name].filter(Boolean).join(' ').trim();
  return fullName || record.volunteer_alias || 'Unnamed volunteer';
}

function volunteerInitials(record: EventVolunteerRecordResponse) {
  const source = [record.volunteer_first_name, record.volunteer_last_name].filter(Boolean).join(' ').trim() || record.volunteer_alias || 'V';
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function VolunteerStatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE[status as EventVolunteerStatus] ?? 'bg-neutral-100 text-neutral-600';
  return (
    <Badge variant="secondary" className={cls}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

interface AssignDialogProps {
  eventId: string;
  onClose: () => void;
  onAssigned: () => void;
}

function AssignVolunteerDialog({ eventId, onClose, onAssigned }: AssignDialogProps) {
  const [alias, setAlias] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = alias.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      const result = await EventVolunteers.assignVolunteerEventsEventIdVolunteersPost({
        path: { event_id: eventId },
        body: { alias: trimmed },
        headers: getAuthHeaders(),
        throwOnError: false
      });
      if (!result.data) throw result.error ?? new Error('Unable to assign volunteer.');
      toast.success(result.data.message ?? 'Volunteer assigned successfully.');
      onAssigned();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to assign volunteer.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign volunteer</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-neutral-900">Volunteer alias</p>
            <Input id="volunteer-alias" placeholder="e.g. johndoe" value={alias} onChange={(e) => setAlias(e.target.value)} disabled={isSubmitting} autoFocus />
            <p className="text-xs text-neutral-500">The volunteer&apos;s account alias.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !alias.trim()}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface RowActionsProps {
  record: EventVolunteerRecordResponse;
  eventId: string;
  onMutated: () => void;
}

function RowActions({ record, eventId, onMutated }: RowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function updateStatus(newStatus: EventVolunteerStatus) {
    setIsPending(true);
    try {
      const result = await EventVolunteers.updateEventVolunteerStatusEventsEventIdVolunteersEventVolunteerIdPatch({
        path: { event_id: eventId, event_volunteer_id: record.id },
        body: { status: newStatus },
        headers: getAuthHeaders(),
        throwOnError: false
      });
      if (!result.data) throw result.error ?? new Error('Unable to update volunteer status.');
      toast.success(result.data.message ?? 'Status updated.');
      onMutated();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to update volunteer status.'));
    } finally {
      setIsPending(false);
      setIsOpen(false);
    }
  }

  async function remove() {
    setIsPending(true);
    try {
      const result = await EventVolunteers.removeEventVolunteerEventsEventIdVolunteersEventVolunteerIdDelete({
        path: { event_id: eventId, event_volunteer_id: record.id },
        headers: getAuthHeaders(),
        throwOnError: false
      });
      if (!result.data) throw result.error ?? new Error('Unable to remove volunteer.');
      toast.success(result.data.message ?? 'Volunteer removed.');
      onMutated();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to remove volunteer.'));
    } finally {
      setIsPending(false);
      setIsOpen(false);
    }
  }

  const status = record.status as EventVolunteerStatus;

  const canJoin = status === 'pending';
  const canReject = status === 'pending';
  const canMarkLeft = status === 'joined';

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
          <span className="sr-only">Open actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {canJoin && (
          <DropdownMenuItem onSelect={() => void updateStatus('joined')}>
            <CheckCircle2 className="size-4 text-emerald-600" />
            Accept (mark joined)
          </DropdownMenuItem>
        )}
        {canReject && (
          <DropdownMenuItem onSelect={() => void updateStatus('rejected')} variant="destructive">
            <XCircle className="size-4" />
            Reject
          </DropdownMenuItem>
        )}
        {canMarkLeft && (
          <DropdownMenuItem onSelect={() => void updateStatus('left')}>
            <UserX className="size-4" />
            Mark as left
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void remove()} variant="destructive">
          <UserX className="size-4" />
          Remove assignment
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function buildColumns(eventId: string, onMutated: () => void): ColumnDef<EventVolunteerRecordResponse>[] {
  return [
    {
      id: 'volunteer',
      header: 'Volunteer name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarImage src={resolveStorageImageUrl(row.original.volunteer_profile_picture_url)} alt={volunteerName(row.original)} />
            <AvatarFallback className="bg-sky-50 font-semibold text-sky-700">{volunteerInitials(row.original)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-950">{volunteerName(row.original)}</p>
            <p className="text-xs text-neutral-500">{row.original.volunteer_alias ? `@${row.original.volunteer_alias}` : 'No alias'}</p>
          </div>
        </div>
      ),
      meta: { headerClassName: 'pl-6', cellClassName: 'pl-6' } satisfies ColumnMeta
    },
    {
      id: 'volunteer_role',
      header: 'Volunteer role',
      cell: ({ row }) => <p className="text-sm font-medium text-neutral-800">{row.original.volunteer_role_name ?? 'Unassigned role'}</p>
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <VolunteerStatusBadge status={row.original.status} />
    },
    {
      id: 'assigned_on',
      header: 'Assigned on',
      cell: ({ row }) => <p className="text-sm text-neutral-600">{fmt(row.original.created_at)}</p>
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <RowActions record={row.original} eventId={eventId} onMutated={onMutated} />
        </div>
      ),
      meta: { headerClassName: 'px-6 text-right', cellClassName: 'px-6 text-right' } satisfies ColumnMeta
    }
  ];
}

export interface EventVolunteersPanelProps {
  eventId: string;
}

export function EventVolunteersPanel({ eventId }: EventVolunteersPanelProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  const { volunteers, isLoading, error, refetch } = useEventVolunteers(eventId, statusFilter === 'all' ? null : statusFilter);

  const columns = buildColumns(eventId, refetch);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: volunteers,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <>
      {isAssignOpen && <AssignVolunteerDialog eventId={eventId} onClose={() => setIsAssignOpen(false)} onAssigned={refetch} />}

      <div className="space-y-0 overflow-hidden rounded-[24px] ring-1 ring-neutral-200/80">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/80 bg-neutral-50/60 px-5 py-3.5">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="h-8 w-44 text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="joined">Joined</SelectItem>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl border-sky-200 text-sky-700 hover:bg-sky-50"
            onClick={() => setIsAssignOpen(true)}
          >
            <Plus className="size-4" />
            Assign volunteer
          </Button>
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
              {volunteers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="px-6 py-12 text-center">
                    <p className="text-sm font-medium text-neutral-500">No volunteers assigned yet.</p>
                    <p className="mt-1 text-xs text-neutral-400">Use the Assign volunteer button to add one.</p>
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

        <div className="border-t border-neutral-200/80 px-5 py-2.5 text-xs text-neutral-500">
          {volunteers.length} volunteer{volunteers.length === 1 ? '' : 's'}
          {statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}
        </div>
      </div>
    </>
  );
}
