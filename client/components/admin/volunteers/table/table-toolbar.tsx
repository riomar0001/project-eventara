'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VolunteersTableToolbarProps {
  availabilityFilter: 'all' | 'Flexible' | 'Weekends' | 'Weeknights';
  onAvailabilityFilterChange: (value: 'all' | 'Flexible' | 'Weekends' | 'Weeknights') => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: 'all' | 'Active' | 'Training' | 'Inactive') => void;
  search: string;
  statusFilter: 'all' | 'Active' | 'Training' | 'Inactive';
}

export function VolunteersTableToolbar({
  availabilityFilter,
  onAvailabilityFilterChange,
  onSearchChange,
  onStatusFilterChange,
  search,
  statusFilter
}: VolunteersTableToolbarProps) {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <div className="relative w-full sm:w-72">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
        <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search volunteers or skills..." className="pl-9" />
        {search ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700"
            aria-label="Clear volunteer search"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as typeof statusFilter)}>
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
      <Select value={availabilityFilter} onValueChange={(value) => onAvailabilityFilterChange(value as typeof availabilityFilter)}>
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
  );
}
