'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Trash2, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DeadJobResponse } from '@/api/types.gen';
import { QUEUE_MANAGEMENT_TEXT } from '@/constants/admin/queues';
import { cn } from '@/lib/utils';

interface DeadLetterQueueTableProps {
  actionJobId: string | null;
  actionKind: 'delete' | 'retry' | null;
  deadJobs: DeadJobResponse[];
  isEmpty: boolean;
  isLoading: boolean;
  jobsError: string | null;
  onDelete: (jobId: string) => void;
  onRetry: (jobId: string) => void;
  onSelectJob: (jobId: string) => void;
  onPageChange: (page: number) => void;
  page: number;
  selectedJobId: string | null;
  totalJobs: number;
  totalPages: number;
}

function formatQueueTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short'
  }).format(new Date(value));
}

function LoadingRows() {
  return Array.from({ length: 6 }, (_, i) => (
    <TableRow key={`dead-job-loading-${i}`}>
      <TableCell className="px-5 py-3.5">
        <Skeleton className="h-5 w-12 rounded-full" />
      </TableCell>
      <TableCell className="py-3.5">
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-52" />
          <Skeleton className="h-3 w-36" />
        </div>
      </TableCell>
      <TableCell className="py-3.5">
        <Skeleton className="h-3.5 w-24" />
      </TableCell>
      <TableCell className="py-3.5">
        <Skeleton className="h-3.5 w-6" />
      </TableCell>
      <TableCell className="px-5 py-3.5">
        <div className="flex justify-end gap-2">
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
      </TableCell>
    </TableRow>
  ));
}

export function DeadLetterQueueTable({
  actionJobId,
  actionKind,
  deadJobs,
  isEmpty,
  isLoading,
  jobsError,
  onDelete,
  onRetry,
  onSelectJob,
  onPageChange,
  page,
  selectedJobId,
  totalJobs,
  totalPages,
}: DeadLetterQueueTableProps) {
  return (
    <Card className="flex flex-col border-0 bg-white shadow-none ring-1 ring-neutral-200">
      <CardHeader className="shrink-0 border-b border-neutral-200/80 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">{QUEUE_MANAGEMENT_TEXT.deadLetterTitle}</CardTitle>
            <CardDescription className="text-xs leading-5">{QUEUE_MANAGEMENT_TEXT.deadLetterDescription}</CardDescription>
          </div>
          {!isEmpty && !isLoading && (
            <span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-rose-700 uppercase">
              {deadJobs.length} failed
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        {jobsError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <TriangleAlert className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-900">{QUEUE_MANAGEMENT_TEXT.dlqErrorTitle}</p>
              <p className="text-xs leading-5 text-neutral-500">{jobsError}</p>
            </div>
          </div>
        ) : isEmpty && !isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <RotateCcw className="size-5" />
            </div>
            <p className="text-sm font-medium text-neutral-900">{QUEUE_MANAGEMENT_TEXT.emptyTitle}</p>
            <p className="text-xs leading-5 text-neutral-500">{QUEUE_MANAGEMENT_TEXT.emptyDescription}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-neutral-50/95 backdrop-blur-sm">
                <TableRow className="border-neutral-200/80 hover:bg-transparent">
                  <TableHead className="px-5 py-3 text-[10px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">Status</TableHead>
                  <TableHead className="py-3 text-[10px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">Function</TableHead>
                  <TableHead className="py-3 text-[10px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">Enqueued</TableHead>
                  <TableHead className="py-3 text-center text-[10px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">Try</TableHead>
                  <TableHead className="px-5 py-3 text-right text-[10px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <LoadingRows />
                ) : (
                  deadJobs.map((job) => {
                    const isRetrying = actionKind === 'retry' && actionJobId === job.job_id;
                    const isDeleting = actionKind === 'delete' && actionJobId === job.job_id;
                    const isSelected = selectedJobId === job.job_id;

                    return (
                      <TableRow
                        key={job.job_id}
                        onClick={() => onSelectJob(job.job_id)}
                        className={cn(
                          'cursor-pointer border-neutral-100 transition-colors',
                          isSelected ? 'bg-amber-50/60 hover:bg-amber-50/60' : 'hover:bg-neutral-50'
                        )}
                      >
                        <TableCell className="px-5 py-3.5">
                          <Badge className="rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-rose-700 uppercase shadow-none">
                            failed
                          </Badge>
                        </TableCell>

                        <TableCell className="py-3.5">
                          <p className="max-w-64 truncate text-xs font-medium text-neutral-900">{job.function}</p>
                          <p className="mt-0.5 max-w-64 truncate text-[11px] text-neutral-400">{job.job_id}</p>
                        </TableCell>

                        <TableCell className="py-3.5 text-xs text-neutral-500 tabular-nums">
                          {formatQueueTime(job.enqueue_time)}
                        </TableCell>

                        <TableCell className="py-3.5 text-center text-xs font-semibold text-neutral-800 tabular-nums">
                          {job.job_try}
                        </TableCell>

                        <TableCell className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 border-emerald-200 bg-emerald-50 px-3 text-[11px] text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                              onClick={(e) => { e.stopPropagation(); void onRetry(job.job_id); }}
                              disabled={Boolean(actionJobId)}
                            >
                              <RotateCcw className="size-3" />
                              {isRetrying ? 'Retrying…' : 'Retry'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 border-rose-200 bg-rose-50 px-3 text-[11px] text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                              onClick={(e) => { e.stopPropagation(); void onDelete(job.job_id); }}
                              disabled={Boolean(actionJobId)}
                            >
                              <Trash2 className="size-3" />
                              {isDeleting ? 'Deleting…' : 'Delete'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!jobsError && !isEmpty && (
          <div className="flex shrink-0 items-center justify-between border-t border-neutral-100 px-5 py-3">
            <p className="text-xs text-neutral-500">
              {isLoading ? (
                <span className="inline-block h-3.5 w-24 animate-pulse rounded bg-neutral-200" />
              ) : (
                <>
                  Page <span className="font-medium text-neutral-800">{page}</span> of{' '}
                  <span className="font-medium text-neutral-800">{totalPages}</span>
                  {' · '}
                  <span className="font-medium text-neutral-800">{totalJobs}</span> total
                </>
              )}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isLoading}
                className="flex size-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="flex size-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
