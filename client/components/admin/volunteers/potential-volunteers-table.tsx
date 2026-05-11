'use client';

import { useState } from 'react';
import { ArrowDown, ChevronLeft, ChevronRight, Loader2, RotateCcw, Search, Sparkles, Users, X } from 'lucide-react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PotentialVolunteerRecord } from '@/hooks/admin/volunteers/use-potential-volunteers';
import { cn } from '@/lib/utils';

const MIN_EVENTS_OPTIONS = [
  { label: '1+ events', value: 1 },
  { label: '2+ events', value: 2 },
  { label: '3+ events', value: 3 },
  { label: '5+ events', value: 5 },
  { label: '10+ events', value: 10 }
];

function getInitials(firstName: string | null, lastName: string | null, alias: string | null) {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
  if (alias) return alias.slice(0, 2).toUpperCase();
  return '??';
}

function getDisplayName(firstName: string | null, lastName: string | null, alias: string | null) {
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (alias) return alias;
  return '—';
}

const potentialVolunteerColumns: ColumnDef<PotentialVolunteerRecord>[] = [
  {
    id: 'profile',
    header: 'Candidate',
    cell: ({ row }) => {
      const { first_name, last_name, alias, email } = row.original;
      const displayName = getDisplayName(first_name, last_name, alias);
      const initials = getInitials(first_name, last_name, alias);
      return (
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback className="bg-violet-50 font-medium text-violet-700">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <p className="font-medium text-neutral-950">{displayName}</p>
            <p className="text-sm text-neutral-500">{email}</p>
          </div>
        </div>
      );
    },
    meta: { headerClassName: 'pl-6', cellClassName: 'pl-6' }
  },
  {
    id: 'alias',
    header: 'Alias',
    cell: ({ row }) => <p className="text-sm text-neutral-500">{row.original.alias ? `@${row.original.alias}` : '—'}</p>
  },
  {
    id: 'events_count',
    header: 'Events Joined',
    cell: ({ row }) => (
      <Badge variant="secondary" className="bg-violet-100 text-violet-800">
        {row.original.events_count} {row.original.events_count === 1 ? 'event' : 'events'}
      </Badge>
    )
  }
];

type ColumnMeta = { headerClassName?: string; cellClassName?: string };

function PotentialVolunteersEmptyState({
  activeSearch,
  minEvents,
  onClearFilters,
  onShowAll
}: {
  activeSearch: string;
  minEvents: number;
  onClearFilters: () => void;
  onShowAll: () => void;
}) {
  const hasSearch = Boolean(activeSearch.trim());
  const hasThreshold = minEvents > 1;
  const hasActiveFilters = hasSearch || hasThreshold;

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-[28px] border border-sky-100 bg-linear-to-br from-sky-50/80 via-white to-violet-50/60 text-left shadow-[0_24px_70px_-46px_rgba(14,116,144,0.36)]">
      <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
        <div className="px-6 py-7 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm ring-1 ring-sky-200">
              <Sparkles className="size-5" />
            </span>
            <span className="rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-sky-700 uppercase">
              Candidate radar
            </span>
          </div>

          <div className="mt-5 max-w-2xl space-y-2">
            <p className="text-2xl font-semibold tracking-tight text-neutral-950">
              {hasActiveFilters ? 'No one is landing in this review lane' : 'No potential volunteers yet'}
            </p>
            <p className="text-sm leading-7 text-neutral-600">
              {hasActiveFilters
                ? 'This view is still healthy; the current search and participation threshold are just narrowing the pool too tightly.'
                : 'Once event participants begin showing repeat attendance, they will appear here for roster review.'}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {hasSearch ? (
              <span className="inline-flex h-8 max-w-full items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700">
                <Search className="size-3.5 shrink-0 text-neutral-400" />
                <span className="truncate">Search: {activeSearch}</span>
              </span>
            ) : null}
            <span className="inline-flex h-8 items-center gap-2 rounded-full border border-violet-200 bg-white px-3 text-xs font-medium text-violet-700">
              <Users className="size-3.5" />
              {minEvents}+ event threshold
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {hasActiveFilters ? (
              <Button type="button" onClick={onClearFilters} className="bg-sky-500 text-white hover:bg-sky-600">
                <RotateCcw className="size-4" />
                Reset radar
              </Button>
            ) : null}
            {hasThreshold ? (
              <Button type="button" variant="outline" onClick={onShowAll}>
                <ArrowDown className="size-4" />
                Show 1+ events
              </Button>
            ) : null}
          </div>
        </div>

        <div className="border-t border-sky-100 bg-white/55 px-6 py-6 lg:border-t-0 lg:border-l">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">Review path</p>
          <div className="mt-4 space-y-3">
            {['Attend', 'Return', 'Invite'].map((label, index) => (
              <div key={label} className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-xl bg-sky-50 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
                  {index + 1}
                </span>
                <div className="h-px flex-1 bg-linear-to-r from-sky-200 to-transparent" />
                <span className="w-16 text-right text-xs font-medium text-neutral-600">{label}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-neutral-500">
            Candidates appear after participation is recorded and they are still outside the active volunteer roster.
          </p>
        </div>
      </div>
    </div>
  );
}

function PotentialVolunteersTableContent({
  activeSearch,
  records,
  isLoading,
  error,
  minEvents,
  onClearFilters,
  onShowAll
}: {
  activeSearch: string;
  records: PotentialVolunteerRecord[];
  isLoading?: boolean;
  error?: string | null;
  minEvents: number;
  onClearFilters: () => void;
  onShowAll: () => void;
}) {
  // TanStack Table is intentionally used here for the shadcn data table pattern.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: records,
    columns: potentialVolunteerColumns,
    getCoreRowModel: getCoreRowModel()
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
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
        {records.length === 0 ? (
          <TableRow>
            <TableCell colSpan={potentialVolunteerColumns.length} className="px-4 py-10 sm:px-6">
              <PotentialVolunteersEmptyState activeSearch={activeSearch} minEvents={minEvents} onClearFilters={onClearFilters} onShowAll={onShowAll} />
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
  );
}

export type PotentialVolunteersTableProps = {
  records: PotentialVolunteerRecord[];
  total: number;
  page: number;
  totalPages: number;
  minEvents: number;
  activeSearch: string;
  isLoading?: boolean;
  error?: string | null;
  onPageChange: (page: number) => void;
  onMinEventsChange: (minEvents: number) => void;
  onSearchChange: (search: string) => void;
};

export function PotentialVolunteersTable({
  records,
  total,
  page,
  totalPages,
  minEvents,
  activeSearch,
  isLoading,
  error,
  onPageChange,
  onMinEventsChange,
  onSearchChange
}: PotentialVolunteersTableProps) {
  const [searchInput, setSearchInput] = useState('');

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      onSearchChange(searchInput.trim());
    }
  }

  function handleSearchClear() {
    setSearchInput('');
    onSearchChange('');
  }

  function handleClearFilters() {
    setSearchInput('');
    onSearchChange('');
    if (minEvents !== 1) onMinEventsChange(1);
  }

  function handleShowAll() {
    onMinEventsChange(1);
  }

  return (
    <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
      <CardHeader className="flex flex-col items-start gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Potential volunteers</CardTitle>
          <CardDescription>Users ranked by event participation who have not yet joined the volunteer roster.</CardDescription>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search name, alias or email…"
              className="pl-9"
            />
            {searchInput || activeSearch ? (
              <button
                type="button"
                onClick={handleSearchClear}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          <Select value={String(minEvents)} onValueChange={(value) => onMinEventsChange(Number(value))}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Min events" />
            </SelectTrigger>
            <SelectContent>
              {MIN_EVENTS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <PotentialVolunteersTableContent
          activeSearch={activeSearch}
          records={records}
          isLoading={isLoading}
          error={error}
          minEvents={minEvents}
          onClearFilters={handleClearFilters}
          onShowAll={handleShowAll}
        />
      </CardContent>

      {totalPages > 1 && (
        <CardFooter className="flex items-center justify-between border-t px-6 py-4">
          <p className="text-sm text-neutral-500">
            Page {page} of {totalPages} &middot; {total} candidates
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1 || isLoading}>
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages || isLoading}>
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
