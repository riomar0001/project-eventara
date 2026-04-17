'use client';

import { useState } from 'react';
import { Search, UserPlus, Users, X } from 'lucide-react';
import Link from 'next/link';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { volunteerColumns, type VolunteerColumnMeta } from './volunteer-columns';
import { ADMIN_OPERATIONS_PATHS, volunteerRecords } from '@/constants/admin/operations';
import { cn } from '@/lib/utils';
import { OperationsPageIntro } from './volunteers-shared';

export function VolunteersTable() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Training' | 'Inactive'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'Flexible' | 'Weekends' | 'Weeknights'>('all');

  const filteredVolunteers = volunteerRecords.filter((volunteer) => {
    const matchesSearch =
      search.length === 0 ||
      volunteer.name.toLowerCase().includes(search.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(search.toLowerCase()) ||
      volunteer.skills.some((skill) => skill.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || volunteer.status === statusFilter;
    const matchesAvailability = availabilityFilter === 'all' || volunteer.availability === availabilityFilter;

    return matchesSearch && matchesStatus && matchesAvailability;
  });

  // TanStack Table is intentionally used here for the shadcn data table pattern.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredVolunteers,
    columns: volunteerColumns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="space-y-6">
      <OperationsPageIntro
        title="Volunteer Management"
        description="A UI-only volunteer section with a shadcn-style searchable data table, profile pages, and add or edit form previews."
        metrics={[
          {
            label: 'Roster size',
            value: volunteerRecords.length,
            hint: 'Volunteers currently represented in the mock roster.'
          },
          {
            label: 'Active crew',
            value: volunteerRecords.filter((volunteer) => volunteer.status === 'Active').length,
            hint: 'Volunteers currently shown as ready for assignment.'
          },
          {
            label: 'Tracked hours',
            value: volunteerRecords.reduce((sum, volunteer) => sum + volunteer.hoursContributed, 0),
            hint: 'Combined contribution hours across the current volunteer preview.'
          }
        ]}
        actions={
          <Button asChild>
            <Link href={ADMIN_OPERATIONS_PATHS.volunteerCreate}>
              <UserPlus className="size-4" />
              Add volunteer
            </Link>
          </Button>
        }
      />

      <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
        <CardHeader className="flex flex-col items-start gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Volunteer roster</CardTitle>
            <CardDescription>Use search and filters to review the volunteer pool and jump into a profile or edit page.</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative w-full sm:w-72">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search volunteers or skills..." className="pl-9" />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700"
                  aria-label="Clear volunteer search"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Training">Training</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={availabilityFilter} onValueChange={(value) => setAvailabilityFilter(value as typeof availabilityFilter)}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All shifts</SelectItem>
                <SelectItem value="Weeknights">Weeknights</SelectItem>
                <SelectItem value="Weekends">Weekends</SelectItem>
                <SelectItem value="Flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
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
              {filteredVolunteers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={volunteerColumns.length} className="px-6 py-16 text-center">
                    <div className="space-y-2">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
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
        </CardContent>
      </Card>
    </div>
  );
}

