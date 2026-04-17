'use client';

import { RotateCcw, Trash2, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  selectedJobId: string | null;
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
  return Array.from({ length: 8 }, (_, index) => (
    <TableRow key={`dead-job-loading-${index}`}>
      <TableCell className="px-6 py-4">
        <Skeleton className="h-6 w-24 rounded-full" />
      </TableCell>
      <TableCell className="py-4">
        <Skeleton className="h-4 w-44" />
      </TableCell>
      <TableCell className="py-4">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="py-4">
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell className="py-4">
        <Skeleton className="h-4 w-56" />
      </TableCell>
      <TableCell className="px-6 py-4">
        <Skeleton className="h-8 w-28 rounded-xl" />
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
  selectedJobId
}: DeadLetterQueueTableProps) {
  return (
    <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200 xl:flex xl:h-[760px] xl:min-h-[760px] xl:flex-col">
      <CardHeader className="border-b border-neutral-200/80 pb-4">
        <CardTitle className="text-2xl tracking-tight">{QUEUE_MANAGEMENT_TEXT.deadLetterTitle}</CardTitle>
        <CardDescription className="max-w-3xl text-sm leading-6">{QUEUE_MANAGEMENT_TEXT.deadLetterDescription}</CardDescription>
      </CardHeader>

      <CardContent className="p-0 xl:flex-1 xl:overflow-hidden">
        {jobsError ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 py-12 text-center xl:h-full">
            <div className="flex size-14 items-center justify-center rounded-3xl bg-rose-50 text-rose-600">
              <TriangleAlert className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium text-neutral-950">{QUEUE_MANAGEMENT_TEXT.dlqErrorTitle}</p>
              <p className="text-sm leading-6 text-neutral-500">{jobsError}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto xl:h-full xl:overflow-y-auto">
            <Table className="min-w-240">
              <TableHeader className="bg-neutral-50/80 xl:sticky xl:top-0 xl:z-10">
                <TableRow>
                  <TableHead className="px-6">Status</TableHead>
                  <TableHead>Function</TableHead>
                  <TableHead>Enqueued</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Failure</TableHead>
                  <TableHead className="px-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <LoadingRows />
                ) : isEmpty ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-18 text-center">
                      <div className="mx-auto max-w-md space-y-3">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
                          <RotateCcw className="size-6" />
                        </div>
                        <p className="text-base font-medium text-neutral-950">{QUEUE_MANAGEMENT_TEXT.emptyTitle}</p>
                        <p className="text-sm leading-6 text-neutral-500">{QUEUE_MANAGEMENT_TEXT.emptyDescription}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  deadJobs.map((job, index) => {
                    const isRetrying = actionKind === 'retry' && actionJobId === job.job_id;
                    const isDeleting = actionKind === 'delete' && actionJobId === job.job_id;

                    return (
                      <TableRow
                        key={job.job_id}
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-neutral-50',
                          index % 2 !== 0 && 'bg-neutral-50/40',
                          selectedJobId === job.job_id && 'bg-amber-50/80 hover:bg-amber-50/80'
                        )}
                        onClick={() => onSelectJob(job.job_id)}
                      >
                        <TableCell className="px-6 py-4">
                          <Badge className="rounded-full border border-rose-200 bg-rose-100 px-2.5 py-1 text-[11px] tracking-[0.18em] text-rose-800 uppercase">
                            failed
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <p className="max-w-72 truncate font-medium text-neutral-950">{job.function}</p>
                            <p className="max-w-72 truncate text-xs text-neutral-500">{job.job_id}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-sm text-neutral-600">{formatQueueTime(job.enqueue_time)}</TableCell>
                        <TableCell className="py-4 text-sm font-medium text-neutral-800">{job.job_try}</TableCell>
                        <TableCell className="py-4">
                          <p className="max-w-[28rem] truncate text-sm text-neutral-600">{job.error}</p>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                              onClick={(event) => {
                                event.stopPropagation();
                                void onRetry(job.job_id);
                              }}
                              disabled={Boolean(actionJobId)}
                            >
                              <RotateCcw className="size-3.5" />
                              {isRetrying ? 'Retrying...' : 'Retry'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                              onClick={(event) => {
                                event.stopPropagation();
                                void onDelete(job.job_id);
                              }}
                              disabled={Boolean(actionJobId)}
                            >
                              <Trash2 className="size-3.5" />
                              {isDeleting ? 'Deleting...' : 'Delete'}
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
      </CardContent>
    </Card>
  );
}
