'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, Search, TrendingUp, Users, X } from 'lucide-react';
import { flexRender, getCoreRowModel, getSortedRowModel, type ColumnDef, type SortingState, useReactTable } from '@tanstack/react-table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type PotentialVolunteerRecord = {
  id: string;
  fullName: string;
  alias: string;
  email: string;
  photo: string;
  totalParticipatedEvents: number;
};

type PotentialVolunteerColumnMeta = {
  cellClassName?: string;
  headerClassName?: string;
};

type ParticipationFilter = 'all' | '1-5' | '6-10' | '11+';

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function createAvatarDataUri(fullName: string, startColor: string, endColor: string) {
  const initials = getInitials(fullName);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${fullName}">
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${startColor}" />
          <stop offset="100%" stop-color="${endColor}" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="28" fill="url(#gradient)" />
      <circle cx="48" cy="38" r="16" fill="rgba(255,255,255,0.16)" />
      <text
        x="48"
        y="58"
        text-anchor="middle"
        fill="#ffffff"
        font-family="Arial, sans-serif"
        font-size="28"
        font-weight="700"
      >
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function matchesParticipationFilter(totalEvents: number, filter: ParticipationFilter) {
  if (filter === 'all') return true;
  if (filter === '1-5') return totalEvents >= 1 && totalEvents <= 5;
  if (filter === '6-10') return totalEvents >= 6 && totalEvents <= 10;
  return totalEvents >= 11;
}

function SortIndicator({ sortState }: { sortState: false | 'asc' | 'desc' }) {
  if (sortState === 'asc') return <ArrowUp className="size-3.5" />;
  if (sortState === 'desc') return <ArrowDown className="size-3.5" />;
  return <ArrowUpDown className="size-3.5 opacity-60" />;
}

function PotentialVolunteerToolbar({
  filteredCount,
  hasActiveFilters,
  onClearFilters,
  onParticipationFilterChange,
  onSearchChange,
  participationFilter,
  search,
  totalCount
}: {
  filteredCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onParticipationFilterChange: (value: ParticipationFilter) => void;
  onSearchChange: (value: string) => void;
  participationFilter: ParticipationFilter;
  search: string;
  totalCount: number;
}) {
  return (
    <div className="border-b border-neutral-200/80 bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] px-6 py-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-sky-700 uppercase">
            <Filter className="size-3.5" />
            Filters
          </div>
          <p className="text-sm font-medium text-neutral-950">
            Showing {filteredCount} of {totalCount} candidates
          </p>
          <p className="text-xs text-neutral-500">Search by name, alias, or email. Filter by event participation band.</p>
        </div>

        {hasActiveFilters ? (
          <Button type="button" variant="outline" size="sm" onClick={onClearFilters} className="rounded-xl">
            <X className="size-4" />
            Clear filters
          </Button>
        ) : null}
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search name, alias, or email..."
            className="h-9 rounded-xl border-neutral-200 bg-white pl-9 text-sm"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700"
              aria-label="Clear potential volunteer search"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <Select value={participationFilter} onValueChange={(value) => onParticipationFilterChange(value as ParticipationFilter)}>
          <SelectTrigger className="h-9 w-full rounded-xl border-neutral-200 bg-white text-sm sm:w-52">
            <SelectValue placeholder="Participation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All participation levels</SelectItem>
            <SelectItem value="1-5">1-5 events</SelectItem>
            <SelectItem value="6-10">6-10 events</SelectItem>
            <SelectItem value="11+">11+ events</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

const potentialVolunteers: PotentialVolunteerRecord[] = [
  {
    id: 'potential-volunteer-1',
    fullName: 'Ava Morgan',
    alias: 'avamorgan',
    email: 'ava.morgan@example.org',
    photo: createAvatarDataUri('Ava Morgan', '#0f766e', '#14b8a6'),
    totalParticipatedEvents: 12
  },
  {
    id: 'potential-volunteer-2',
    fullName: 'Jordan Lee',
    alias: 'jordanlee',
    email: 'jordan.lee@example.org',
    photo: createAvatarDataUri('Jordan Lee', '#0ea5e9', '#38bdf8'),
    totalParticipatedEvents: 8
  },
  {
    id: 'potential-volunteer-3',
    fullName: 'Priya Patel',
    alias: 'priyapatel',
    email: 'priya.patel@example.org',
    photo: createAvatarDataUri('Priya Patel', '#16a34a', '#22c55e'),
    totalParticipatedEvents: 15
  },
  {
    id: 'potential-volunteer-4',
    fullName: 'Marcus Reed',
    alias: 'marcusreed',
    email: 'marcus.reed@example.org',
    photo: createAvatarDataUri('Marcus Reed', '#d97706', '#f59e0b'),
    totalParticipatedEvents: 6
  },
  {
    id: 'potential-volunteer-5',
    fullName: 'Sofia Alvarez',
    alias: 'sofiaalvarez',
    email: 'sofia.alvarez@example.org',
    photo: createAvatarDataUri('Sofia Alvarez', '#64748b', '#94a3b8'),
    totalParticipatedEvents: 10
  },
  {
    id: 'potential-volunteer-6',
    fullName: 'Ethan Brooks',
    alias: 'ethanbrooks',
    email: 'ethan.brooks@example.org',
    photo: createAvatarDataUri('Ethan Brooks', '#0f766e', '#22c55e'),
    totalParticipatedEvents: 4
  }
];

const potentialVolunteerColumns: ColumnDef<PotentialVolunteerRecord>[] = [
  {
    id: 'candidate',
    header: 'Candidate',
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex min-w-64 items-center gap-3">
        <Avatar size="lg">
          <AvatarImage src={row.original.photo} alt={row.original.fullName} />
          <AvatarFallback>{getInitials(row.original.fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-950">{row.original.fullName}</p>
          <p className="truncate text-xs text-neutral-500">@{row.original.alias}</p>
        </div>
      </div>
    ),
    meta: {
      headerClassName: 'pl-6',
      cellClassName: 'pl-6'
    } satisfies PotentialVolunteerColumnMeta
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <p className="text-sm font-medium text-neutral-700">{row.original.email}</p>,
    meta: {
      headerClassName: 'px-6',
      cellClassName: 'px-6'
    } satisfies PotentialVolunteerColumnMeta
  },
  {
    accessorKey: 'totalParticipatedEvents',
    header: 'Participated events',
    cell: ({ row }) => {
      const events = row.original.totalParticipatedEvents;

      return (
        <div className="flex justify-end">
          <Badge className="rounded-full bg-sky-100 px-2.5 py-1 text-sky-800 hover:bg-sky-100">
            {events} event{events === 1 ? '' : 's'}
          </Badge>
        </div>
      );
    },
    meta: {
      headerClassName: 'px-6 text-right',
      cellClassName: 'px-6 text-right'
    } satisfies PotentialVolunteerColumnMeta
  },
  {
    id: 'signal',
    header: 'Signal',
    enableSorting: false,
    cell: ({ row }) => {
      const totalEvents = row.original.totalParticipatedEvents;
      const signal = totalEvents >= 11 ? 'High intent' : totalEvents >= 6 ? 'Warm' : 'Early';
      const className =
        totalEvents >= 11 ? 'bg-emerald-50 text-emerald-700' : totalEvents >= 6 ? 'bg-amber-50 text-amber-700' : 'bg-neutral-100 text-neutral-600';

      return (
        <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1', className)}>
            <TrendingUp className="size-3.5" />
            {signal}
          </span>
        </div>
      );
    },
    meta: {
      headerClassName: 'pr-6',
      cellClassName: 'pr-6'
    } satisfies PotentialVolunteerColumnMeta
  }
];

export function PotentialVolunteersTableContent() {
  const [search, setSearch] = useState('');
  const [participationFilter, setParticipationFilter] = useState<ParticipationFilter>('all');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'totalParticipatedEvents', desc: true }]);

  const filteredVolunteers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return potentialVolunteers.filter((volunteer) => {
      const matchesSearch =
        query.length === 0 ||
        volunteer.fullName.toLowerCase().includes(query) ||
        volunteer.alias.toLowerCase().includes(query) ||
        volunteer.email.toLowerCase().includes(query);

      return matchesSearch && matchesParticipationFilter(volunteer.totalParticipatedEvents, participationFilter);
    });
  }, [participationFilter, search]);

  const hasActiveFilters = search.trim().length > 0 || participationFilter !== 'all';

  // TanStack Table is intentionally used here to keep this section aligned with the roster table.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredVolunteers,
    columns: potentialVolunteerColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <div className="space-y-0">
      <PotentialVolunteerToolbar
        filteredCount={filteredVolunteers.length}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() => {
          setSearch('');
          setParticipationFilter('all');
        }}
        onParticipationFilterChange={setParticipationFilter}
        onSearchChange={setSearch}
        participationFilter={participationFilter}
        search={search}
        totalCount={potentialVolunteers.length}
      />

      <Table className="min-w-220">
        <TableHeader className="bg-sky-50/80">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta as PotentialVolunteerColumnMeta | undefined;
                const isRightAligned = meta?.headerClassName?.includes('text-right') ?? false;

                return (
                  <TableHead key={header.id} className={cn('py-3 text-xs font-medium text-neutral-500', meta?.headerClassName)}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div className={cn('flex', isRightAligned ? 'justify-end' : 'justify-start')}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 px-2 text-xs font-medium text-neutral-500 hover:bg-transparent hover:text-neutral-900"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                          <SortIndicator sortState={header.column.getIsSorted()} />
                        </Button>
                      </div>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {filteredVolunteers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={potentialVolunteerColumns.length} className="px-6 py-16 text-center">
                <div className="space-y-2">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <Users className="size-5" />
                  </div>
                  <p className="font-medium text-neutral-950">
                    {hasActiveFilters ? 'No potential volunteers match your filters' : 'No potential volunteers found'}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {hasActiveFilters
                      ? 'Try widening the search or clearing the participation filter.'
                      : 'Add candidates here when the source data is available.'}
                  </p>
                  {hasActiveFilters ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setSearch('');
                        setParticipationFilter('all');
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
              <TableRow key={row.id} className={cn('transition-colors hover:bg-sky-50/60', index % 2 !== 0 && 'bg-sky-50/25')}>
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as PotentialVolunteerColumnMeta | undefined;

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

      <div className="border-t border-neutral-200/80 px-6 py-3 text-xs text-neutral-500">
        Showing {filteredVolunteers.length} potential volunteer{filteredVolunteers.length === 1 ? '' : 's'}.
      </div>
    </div>
  );
}
