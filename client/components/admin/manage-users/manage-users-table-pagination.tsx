'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AdminUserAccountPaginationResponse as AdminUserAccountPagination } from '@/api/types.gen';

interface ManageUsersTablePaginationProps {
  isLoading: boolean;
  onPageChange: (page: number) => void;
  pagination: AdminUserAccountPagination;
  usersCount: number;
}

export function ManageUsersTablePagination({ isLoading, onPageChange, pagination, usersCount }: ManageUsersTablePaginationProps) {
  const showingFrom = usersCount === 0 ? 0 : (pagination.page - 1) * pagination.page_size + 1;
  const showingTo = usersCount === 0 ? 0 : showingFrom + usersCount - 1;
  const pageLabel = pagination.total_pages === 0 ? 0 : pagination.page;

  return (
    <>
      <p className="text-muted-foreground text-xs">
        Showing {showingFrom}-{showingTo} of {pagination.total_count}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, pagination.page - 1))} disabled={isLoading || !pagination.has_previous}>
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <span className="text-muted-foreground min-w-24 text-center text-xs">
          Page {pageLabel} of {pagination.total_pages}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(pagination.page + 1)} disabled={isLoading || !pagination.has_next}>
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
