'use client';

import { ChevronLeft, ChevronRight, FileWarning, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AuditLogResponse, PaginationMeta } from '@/api/types.gen';
import { AUDIT_LOGS_TEXT } from '@/constants/admin/audit-logs';
import {
  countAuditChanges,
  formatAuditActionType,
  formatAuditActor,
  formatAuditCompactTimestamp,
  formatAuditResourceType,
  getAuditStatusClasses
} from '@/lib/admin/audit-logs/helpers';
import { cn } from '@/lib/utils';

interface AuditLogsTableProps {
  activeFilterCount: number;
  error: string | null;
  isEmpty: boolean;
  isLoading: boolean;
  logs: AuditLogResponse[];
  onClearFilters: () => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onSelectLog: (logId: string) => void;
  pageIndex: number;
  pagination: PaginationMeta;
  selectedLogId: string | null;
}

function LoadingRows() {
  return Array.from({ length: 10 }, (_, index) => (
    <TableRow key={`audit-log-loading-${index}`}>
      <TableCell className="px-6 py-4">
        <Skeleton className="h-6 w-18 rounded-full" />
      </TableCell>
      <TableCell className="py-4">
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell className="py-4">
        <Skeleton className="h-4 w-36" />
      </TableCell>
      <TableCell className="py-4">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="py-4">
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell className="px-6 py-4">
        <Skeleton className="h-4 w-24" />
      </TableCell>
    </TableRow>
  ));
}

export function AuditLogsTable({
  activeFilterCount,
  error,
  isEmpty,
  isLoading,
  logs,
  onClearFilters,
  onNextPage,
  onPreviousPage,
  onSelectLog,
  pageIndex,
  pagination,
  selectedLogId
}: AuditLogsTableProps) {
  return (
    <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200 xl:flex xl:h-190 xl:min-h-190 xl:flex-col">
      <CardHeader className="border-b border-neutral-200/80 pb-5">
        <CardTitle className="text-2xl tracking-tight">{AUDIT_LOGS_TEXT.tableTitle}</CardTitle>
        <CardDescription className="max-w-2xl text-sm leading-6">{AUDIT_LOGS_TEXT.tableDescription}</CardDescription>
      </CardHeader>

      <CardContent className="p-0 xl:flex-1 xl:overflow-hidden">
        {error ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 py-12 text-center xl:h-full">
            <div className="flex size-14 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <FileWarning className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium text-neutral-950">{AUDIT_LOGS_TEXT.errorTitle}</p>
              <p className="text-sm leading-6 text-neutral-500">{error}</p>
            </div>
          </div>
        ) : isEmpty && !isLoading ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 py-12 text-center xl:h-full">
            <div className="flex size-14 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <Loader2 className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium text-neutral-950">{AUDIT_LOGS_TEXT.emptyTitle}</p>
              <p className="text-sm leading-6 text-neutral-500">{AUDIT_LOGS_TEXT.emptyDescription}</p>
            </div>
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto xl:h-full xl:overflow-y-auto">
            <Table className="min-w-220">
              <TableHeader className="bg-neutral-50/80 xl:sticky xl:top-0 xl:z-10">
                <TableRow>
                  <TableHead className="px-6">Status</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead className="px-6">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <LoadingRows />
                ) : (
                  logs.map((log, index) => (
                    <TableRow
                      key={log.id}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-neutral-50',
                        index % 2 !== 0 && 'bg-neutral-50/40',
                        selectedLogId === log.id && 'bg-cyan-50/70 hover:bg-cyan-50/70'
                      )}
                      onClick={() => onSelectLog(log.id)}
                    >
                      <TableCell className="px-6 py-4">
                        <Badge className={`rounded-full border px-2.5 py-1 text-[11px] tracking-[0.18em] uppercase ${getAuditStatusClasses(log.status)}`}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-neutral-950">{formatAuditActionType(log.action_type)}</p>
                          <p className="text-xs text-neutral-500">{log.id.slice(0, 12)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-neutral-900">{formatAuditResourceType(log.resource_type)}</p>
                          <p className="text-xs text-neutral-500">{log.resource_id ? log.resource_id : 'No resource id'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-sm font-medium text-neutral-800">{formatAuditActor(log.user_id)}</TableCell>
                      <TableCell className="py-4 text-sm text-neutral-600">{countAuditChanges(log)} fields</TableCell>
                      <TableCell className="px-6 py-4 text-sm text-neutral-600">{formatAuditCompactTimestamp(log.timestamp)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-neutral-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-neutral-500">
          Page {pagination.total_pages === 0 ? 0 : pageIndex} of {pagination.total_pages}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPreviousPage} disabled={isLoading || !pagination.prev_cursor}>
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={onNextPage} disabled={isLoading || !pagination.next_cursor}>
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
