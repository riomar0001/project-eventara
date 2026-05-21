'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Eye, Loader2, Search, XCircle } from 'lucide-react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Volunteers } from '@/api/sdk.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';
import type { ApplicationRecord } from '@/hooks/admin/volunteers/use-volunteer-applications';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Withdrawn', value: 'withdrawn' },
];

const statusStyles: Record<ApplicationRecord['status'], string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-neutral-100 text-neutral-600',
};

function getInitials(name: string | undefined) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

type ReviewDialogProps = {
  application: ApplicationRecord | null;
  open: boolean;
  action: 'approve' | 'reject' | null;
  volunteerRoles: { id: string; name: string }[];
  onClose: () => void;
  onDone: () => void;
};

function ReviewDialog({ application, open, action, volunteerRoles, onClose, onDone }: ReviewDialogProps) {
  const [contactPhone, setContactPhone] = useState(() => application?.application_data?.contact_phone ?? '');
  const [roleId, setRoleId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!application || !action) return null;
  const app = application;

  const isApprove = action === 'approve';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await Volunteers.reviewApplicationVolunteerApplicationsApplicationIdReviewPatch({
        path: { application_id: app.id },
        body: isApprove
          ? { status: 'approved', contact_phone: contactPhone, volunteer_role_id: roleId }
          : { status: 'rejected' },
        headers: getAuthHeaders(),
        throwOnError: false,
      });
      if (!result.data) throw result.error ?? new Error('Review failed.');
      setContactPhone('');
      setRoleId('');
      onDone();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit review. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  const applicantName = [app.first_name, app.last_name].filter(Boolean).join(' ') || app.alias || 'this applicant';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApprove
              ? <><CheckCircle2 className="size-5 text-emerald-600" /> Approve application</>
              : <><XCircle className="size-5 text-red-500" /> Reject application</>
            }
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? `You are approving ${applicantName}'s volunteer application. Provide a contact phone and assign a role to create their volunteer profile.`
              : `You are rejecting ${applicantName}'s application. This action cannot be undone.`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {isApprove && (
            <>
              <div className="space-y-1.5">
                <label htmlFor="contact_phone" className="text-sm font-medium text-neutral-700">Contact phone <span className="text-red-500">*</span></label>
                <input
                  id="contact_phone"
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                  className="flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="volunteer_role" className="text-sm font-medium text-neutral-700">Volunteer role <span className="text-red-500">*</span></label>
                <Select value={roleId} onValueChange={setRoleId} required>
                  <SelectTrigger id="volunteer_role">
                    <SelectValue placeholder="Select a role…" />
                  </SelectTrigger>
                  <SelectContent>
                    {volunteerRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || (isApprove && (!contactPhone.trim() || !roleId))}
              className={isApprove ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isApprove ? 'Approve & create volunteer' : 'Confirm rejection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ColumnMeta = { headerClassName?: string; cellClassName?: string };

type ApplicationDetailModalProps = {
  application: ApplicationRecord | null;
  open: boolean;
  onClose: () => void;
};

function ApplicationDetailModal({ application, open, onClose }: ApplicationDetailModalProps) {
  if (!application) return null;
  const app = application;
  const name = [app.first_name, app.last_name].filter(Boolean).join(' ') || app.alias || '—';
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="size-5 text-neutral-500" /> Application details
          </DialogTitle>
          <DialogDescription>
            Submitted by {name} on {formatDate(app.created_at)}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback className="bg-emerald-50 font-medium text-emerald-700">{getInitials(name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-neutral-950">{name}</p>
              {app.alias && <p className="text-xs text-neutral-500">@{app.alias}</p>}
              <Badge className={cn('mt-1 capitalize', statusStyles[app.status])}>{app.status}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-neutral-50 p-4 text-sm">
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase">Email</p>
              <p className="mt-0.5 text-neutral-800">{app.email ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase">Contact phone</p>
              <p className="mt-0.5 text-neutral-800">{app.application_data?.contact_phone ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase">Preferred role</p>
              <p className="mt-0.5 text-neutral-800">{app.application_data?.preferred_role ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase">Availability</p>
              <p className="mt-0.5 text-neutral-800">{app.application_data?.availability ?? '—'}</p>
            </div>
          </div>
          {app.application_data?.reason && (
            <div>
              <p className="mb-1 text-xs font-medium text-neutral-500 uppercase">Why they want to volunteer</p>
              <p className="text-sm leading-relaxed text-neutral-700">{app.application_data.reason}</p>
            </div>
          )}
          {app.application_data?.skills_experience && (
            <div>
              <p className="mb-1 text-xs font-medium text-neutral-500 uppercase">Skills & experience</p>
              <p className="text-sm leading-relaxed text-neutral-700">{app.application_data.skills_experience}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type TableActionsProps = {
  record: ApplicationRecord;
  onApprove: (r: ApplicationRecord) => void;
  onReject: (r: ApplicationRecord) => void;
  onView: (r: ApplicationRecord) => void;
};

function ApplicationActions({ record, onApprove, onReject, onView }: TableActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => onView(record)} className="h-7 border-neutral-200 text-neutral-600 hover:bg-neutral-50">
        <Eye className="size-3.5" /> View
      </Button>
      {record.status === 'pending' && (
        <>
          <Button size="sm" variant="outline" onClick={() => onApprove(record)} className="h-7 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300">
            <CheckCircle2 className="size-3.5" /> Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => onReject(record)} className="h-7 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
            <XCircle className="size-3.5" /> Reject
          </Button>
        </>
      )}
    </div>
  );
}

function buildColumns(
  onApprove: (r: ApplicationRecord) => void,
  onReject: (r: ApplicationRecord) => void,
  onView: (r: ApplicationRecord) => void,
): ColumnDef<ApplicationRecord>[] {
  return [
    {
      id: 'applicant',
      header: 'Applicant',
      cell: ({ row }) => {
        const { first_name, last_name, alias, email } = row.original;
        const name = [first_name, last_name].filter(Boolean).join(' ') || alias || '—';
        const initials = name !== '—' ? name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() : '??';
        return (
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback className="bg-emerald-50 font-medium text-emerald-700">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="font-medium text-neutral-950">{name}</p>
              <p className="text-sm text-neutral-500">{email ?? '—'}</p>
            </div>
          </div>
        );
      },
      meta: { headerClassName: 'pl-6', cellClassName: 'pl-6' },
    },
    {
      id: 'preferred_role',
      header: 'Preferred Role',
      cell: ({ row }) => (
        <span className="text-sm text-neutral-700">{row.original.application_data?.preferred_role ?? '—'}</span>
      ),
    },
    {
      id: 'availability',
      header: 'Availability',
      cell: ({ row }) => (
        <span className="text-sm text-neutral-600">{row.original.application_data?.availability ?? '—'}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={cn('capitalize', statusStyles[row.original.status])}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'submitted',
      header: 'Submitted',
      cell: ({ row }) => <span className="text-sm text-neutral-500">{formatDate(row.original.created_at)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <ApplicationActions record={row.original} onApprove={onApprove} onReject={onReject} onView={onView} />,
      meta: { cellClassName: 'pr-6' },
    },
  ];
}

export type VolunteerApplicationsTableProps = {
  records: ApplicationRecord[];
  total: number;
  page: number;
  totalPages: number;
  statusFilter: ApplicationRecord['status'] | null;
  search: string;
  volunteerRoles: { id: string; name: string }[];
  isLoading?: boolean;
  error?: string | null;
  onPageChange: (page: number) => void;
  onStatusFilterChange: (status: ApplicationRecord['status'] | null) => void;
  onSearchChange: (value: string) => void;
  onRefetch: () => void;
};

export function VolunteerApplicationsTable({
  records,
  total,
  page,
  totalPages,
  statusFilter,
  search,
  volunteerRoles,
  isLoading,
  error,
  onPageChange,
  onStatusFilterChange,
  onSearchChange,
  onRefetch,
}: VolunteerApplicationsTableProps) {
  const [reviewTarget, setReviewTarget] = useState<ApplicationRecord | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [detailTarget, setDetailTarget] = useState<ApplicationRecord | null>(null);

  function openApprove(r: ApplicationRecord) { setReviewTarget(r); setReviewAction('approve'); }
  function openReject(r: ApplicationRecord) { setReviewTarget(r); setReviewAction('reject'); }
  function closeDialog() { setReviewTarget(null); setReviewAction(null); }
  function handleDone() { closeDialog(); onRefetch(); }
  function openDetail(r: ApplicationRecord) { setDetailTarget(r); }
  function closeDetail() { setDetailTarget(null); }

  const columns = buildColumns(openApprove, openReject, openDetail);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: records, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <>
      <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
        <CardHeader className="flex flex-col items-start gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Volunteer applications</CardTitle>
            <CardDescription>Review and act on incoming volunteer applications from the community.</CardDescription>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by name, email…"
                className="h-9 w-full rounded-md border border-neutral-200 bg-transparent pl-8 pr-3 text-sm shadow-sm transition-colors placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none sm:w-56"
              />
            </div>
            <Select
              value={statusFilter ?? 'all'}
              onValueChange={(v) => onStatusFilterChange(v === 'all' ? null : (v as ApplicationRecord['status']))}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-6 animate-spin text-neutral-400" />
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader className="bg-neutral-50/80">
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((header) => {
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
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="py-14 text-center">
                        <p className="text-sm font-medium text-neutral-950">No applications found</p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {search
                            ? `No applications match "${search}".`
                            : statusFilter
                              ? `No ${statusFilter} applications at the moment.`
                              : 'No volunteer applications have been submitted yet.'}
                        </p>
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
            </div>
          )}
        </CardContent>

        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between border-t px-6 py-4">
            <p className="text-sm text-neutral-500">
              Page {page} of {totalPages} &middot; {total} application{total !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1 || isLoading}>
                <ChevronLeft className="size-4" /> Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages || isLoading}>
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      <ReviewDialog
        application={reviewTarget}
        open={reviewTarget !== null}
        action={reviewAction}
        volunteerRoles={volunteerRoles}
        onClose={closeDialog}
        onDone={handleDone}
      />

      <ApplicationDetailModal
        application={detailTarget}
        open={detailTarget !== null}
        onClose={closeDetail}
      />
    </>
  );
}
