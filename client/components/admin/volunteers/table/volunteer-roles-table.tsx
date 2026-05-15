'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Search, ShieldAlert, Tags, X } from 'lucide-react';
import { toast } from 'sonner';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { FieldLabel } from '../volunteers-shared';
import { buildVolunteerRoleColumns, type VolunteerRoleColumnMeta, type VolunteerRoleTableRecord } from './volunteer-role-columns';
import { Volunteers } from '@/api/sdk.gen';
import { usePermissions } from '@/context/permissions-context';
import { getApiErrorMessage } from '@/lib/system/api-request';
import { cn } from '@/lib/utils';
import { getAccessToken } from '@/store/auth-store';

type StatusFilter = 'all' | 'active' | 'inactive';

function VolunteerRolesToolbar({
  hasActiveFilters,
  onClearFilters,
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onRefresh,
  isLoading
}: {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  search: string;
  statusFilter: StatusFilter;
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (v: StatusFilter) => void;
  onRefresh: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <div className="relative w-full sm:w-60">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
        <Input
          className="h-9 rounded-xl border-neutral-200 bg-white pl-9 text-sm"
          placeholder="Search roles..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700"
            aria-label="Clear volunteer role search"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}>
        <SelectTrigger className="h-9 w-full rounded-xl border-neutral-200 bg-white text-sm sm:w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      {hasActiveFilters ? (
        <Button type="button" variant="outline" size="sm" className="h-9 rounded-xl" onClick={onClearFilters}>
          <X className="size-3.5" />
          Clear
        </Button>
      ) : null}
      <Button variant="outline" size="sm" className="h-9 rounded-xl" onClick={onRefresh} disabled={isLoading}>
        <RefreshCw className={cn('size-3.5', isLoading && 'animate-spin')} />
        Refresh
      </Button>
    </div>
  );
}

function EditRoleDialog({
  role,
  open,
  onOpenChange,
  onSaved
}: {
  role: VolunteerRoleTableRecord | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description ?? '');
      setIsActive(role.is_active);
    }
  }, [role]);

  async function handleSave() {
    if (!role) return;
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error('Role name must be at least 2 characters.');
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      toast.error('You must be signed in.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await Volunteers.updateVolunteerRoleVolunteerRolesRoleIdPatch({
        path: { role_id: role.id },
        body: {
          name: trimmedName !== role.name ? trimmedName : undefined,
          description: description.trim() || null,
          is_active: isActive !== role.is_active ? isActive : undefined
        },
        headers: { Authorization: `Bearer ${accessToken}` },
        throwOnError: false
      });

      if (!result.data) throw result.error ?? new Error('Failed to update role.');

      toast.success('Volunteer role updated successfully.');
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update volunteer role. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit volunteer role</DialogTitle>
          <DialogDescription>Update the name, description, or status of this role.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <FieldLabel htmlFor="edit-role-name">Name *</FieldLabel>
            <Input
              id="edit-role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Registration lead, usher..."
              minLength={2}
              maxLength={100}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="edit-role-description">Description</FieldLabel>
            <Textarea
              id="edit-role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the responsibilities for this role."
              maxLength={500}
              disabled={isSaving}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <FieldLabel>Status</FieldLabel>
            <Select value={isActive ? 'active' : 'inactive'} onValueChange={(v) => setIsActive(v === 'active')} disabled={isSaving}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteRoleDialog({
  role,
  open,
  onOpenChange,
  onDeleted
}: {
  role: VolunteerRoleTableRecord | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDeleted: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm() {
    if (!role) return;

    const accessToken = getAccessToken();
    if (!accessToken) {
      toast.error('You must be signed in.');
      return;
    }

    setIsDeleting(true);
    try {
      const result = await Volunteers.deleteVolunteerRoleVolunteerRolesRoleIdDelete({
        path: { role_id: role.id },
        headers: { Authorization: `Bearer ${accessToken}` },
        throwOnError: false
      });

      if (!result.data) throw result.error ?? new Error('Failed to delete role.');

      const responseData = result.data as { data?: { volunteers_removed?: number } };
      const removed = responseData.data?.volunteers_removed ?? 0;
      const volunteersNote = removed > 0 ? ` ${removed} volunteer${removed === 1 ? '' : 's'} removed.` : '';
      toast.success(`Role deleted successfully.${volunteersNote}`);
      onOpenChange(false);
      onDeleted();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete volunteer role. Please try again.'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-red-500" />
            Delete volunteer role
          </DialogTitle>
          <DialogDescription>
            This will permanently delete <span className="font-semibold text-neutral-950">{role?.name}</span> and remove all volunteers currently assigned to
            this role. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
            {isDeleting ? 'Deleting...' : 'Delete role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VolunteerRolesTable({ refreshSignal }: { refreshSignal?: number }) {
  const { can } = usePermissions();
  const [roles, setRoles] = useState<VolunteerRoleTableRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(false);

  const [editingRole, setEditingRole] = useState<VolunteerRoleTableRecord | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<VolunteerRoleTableRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const canCreateVolunteerRole = can('volunteer-roles', 'create');

  const PAGE_SIZE = 20;

  const fetchRoles = useCallback(
    async (currentPage: number) => {
      const accessToken = getAccessToken();
      if (!accessToken) return;

      setIsLoading(true);
      try {
        const result = await Volunteers.getAllVolunteerRolesVolunteerRolesGet({
          query: {
            page: currentPage,
            page_size: PAGE_SIZE,
            search: search.trim() || undefined,
            is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
          },
          headers: { Authorization: `Bearer ${accessToken}` },
          throwOnError: false
        });

        if (!result.data) return;

        const responseData = result.data as {
          data?: {
            roles?: VolunteerRoleTableRecord[];
            total?: number;
            total_pages?: number;
          };
        };
        const data = responseData.data;
        setRoles(data?.roles ?? []);
        setTotal(data?.total ?? 0);
        setTotalPages(data?.total_pages ?? 1);
      } catch {
        toast.error('Failed to load volunteer roles.');
      } finally {
        setIsLoading(false);
      }
    },
    [search, statusFilter]
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchRoles(page);
  }, [fetchRoles, page, refreshSignal]);

  const columns = buildVolunteerRoleColumns({
    onEdit: can('volunteer-roles', 'update')
      ? (role) => {
          setEditingRole(role);
          setEditOpen(true);
        }
      : undefined,
    onDelete: can('volunteer-roles', 'delete')
      ? (role) => {
          setDeletingRole(role);
          setDeleteOpen(true);
        }
      : undefined
  });
  const hasActiveFilters = search.trim().length > 0 || statusFilter !== 'all';

  const table = useReactTable({
    data: roles,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <>
      <div className="flex flex-col gap-4 border-b border-neutral-200 bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-emerald-700 uppercase">
            <Tags className="size-3.5" />
            Role inventory
          </div>
          <p className="font-medium text-neutral-950">All volunteer roles</p>
          <p className="text-sm text-neutral-500">{isLoading ? 'Syncing role catalog...' : `${total} role${total !== 1 ? 's' : ''} total`}</p>
        </div>
        <VolunteerRolesToolbar
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() => {
            setSearch('');
            setStatusFilter('all');
          }}
          search={search}
          statusFilter={statusFilter}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onRefresh={() => fetchRoles(page)}
          isLoading={isLoading}
        />
      </div>

      <Table className="min-w-180">
        <TableHeader className="bg-emerald-50/70">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta as VolunteerRoleColumnMeta | undefined;
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
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="px-6 py-16 text-center">
                <div className="flex items-center justify-center gap-2 text-neutral-500">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-sm">Loading roles...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : roles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="px-6 py-16 text-center">
                <div className="space-y-2">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Tags className="size-5" />
                  </div>
                  <p className="font-medium text-neutral-950">No roles found</p>
                  <p className="text-sm text-neutral-500">
                    {hasActiveFilters
                      ? 'Try clearing your search or filter.'
                      : canCreateVolunteerRole
                        ? 'Create your first volunteer role from the button above.'
                        : 'No volunteer roles are available yet.'}
                  </p>
                  {hasActiveFilters ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setSearch('');
                        setStatusFilter('all');
                      }}
                    >
                      <X className="size-3.5" />
                      Clear filters
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row, index) => (
              <TableRow key={row.id} className={cn('transition-colors hover:bg-emerald-50/45', index % 2 !== 0 && 'bg-neutral-50/45')}>
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as VolunteerRoleColumnMeta | undefined;
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
          <p className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || isLoading} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages || isLoading} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <EditRoleDialog role={editingRole} open={editOpen} onOpenChange={setEditOpen} onSaved={() => fetchRoles(page)} />
      <DeleteRoleDialog
        role={deletingRole}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => {
          if (roles.length === 1 && page > 1) {
            setPage((p) => p - 1);
          } else {
            fetchRoles(page);
          }
        }}
      />
    </>
  );
}
