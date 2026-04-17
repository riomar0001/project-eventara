'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_OPTIONS } from '../../../../constants/admin/manage-users';
import { humanizeRoleName } from '../manage-users-ui';
import type { AssignableRoleResponse, UserStatus } from '@/api/types.gen';

interface ManageUsersTableToolbarProps {
  onRoleFilterChange: (value: string | undefined) => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: UserStatus | undefined) => void;
  roleFilter: string | undefined;
  roles: AssignableRoleResponse[];
  search: string;
  statusFilter: UserStatus | undefined;
}

export function ManageUsersTableToolbar({
  onRoleFilterChange,
  onSearchChange,
  onStatusFilterChange,
  roleFilter,
  roles,
  search,
  statusFilter
}: ManageUsersTableToolbarProps) {
  return (
    <div className="relative w-full sm:w-auto">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-auto">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
          <Input
            id="admin-user-search"
            className="h-8 w-full pl-8 text-sm sm:w-90"
            placeholder="Search name, email, alias..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search ? (
            <button
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 transition-colors"
              onClick={() => onSearchChange('')}
              type="button"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
        <Select value={statusFilter ?? 'all'} onValueChange={(value) => onStatusFilterChange(value === 'all' ? undefined : (value as UserStatus))}>
          <SelectTrigger id="admin-user-status-filter" className="h-8 w-full text-sm sm:w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roleFilter ?? 'all'} onValueChange={(value) => onRoleFilterChange(value === 'all' ? undefined : value)}>
          <SelectTrigger id="admin-user-role-filter" className="h-8 w-full text-sm sm:w-36">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.name}>
                {humanizeRoleName(role.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
