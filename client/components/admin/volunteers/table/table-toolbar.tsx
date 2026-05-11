'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { VolunteerStatus } from '@/api/types.gen';

const ALL_SENTINEL = '__all__';

interface VolunteersTableToolbarProps {
  statusFilter: VolunteerStatus | null;
  onStatusFilterChange: (value: VolunteerStatus | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function VolunteersTableToolbar({ statusFilter, onStatusFilterChange, search, onSearchChange }: VolunteersTableToolbarProps) {
  function handleStatusChange(value: string) {
    onStatusFilterChange(value === ALL_SENTINEL ? null : (value as VolunteerStatus));
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <div className="relative w-full sm:w-72">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
        <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search by name, alias or email..." className="pl-9" />
        {search ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      <Select value={statusFilter ?? ALL_SENTINEL} onValueChange={handleStatusChange}>
        <SelectTrigger className="sm:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_SENTINEL}>All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="suspended">Suspended</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
