'use client';

import { FileWarning, PackageSearch } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DeadJobResponse } from '@/api/types.gen';
import { QUEUE_MANAGEMENT_TEXT } from '@/constants/admin/queues';

interface DeadLetterJobDetailProps {
  selectedJob: DeadJobResponse | null;
}

function formatQueueTime(value: string | null) {
  if (!value) return 'Not captured';

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function PayloadBlock({ payload, title }: { payload: unknown; title: string }) {
  const serialized = JSON.stringify(payload, null, 2);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-50/80">
      <div className="border-b border-neutral-200 px-3.5 py-2.5">
        <h4 className="text-[13px] font-semibold text-neutral-950">{title}</h4>
      </div>
      <ScrollArea className="max-h-52">
        <pre className="overflow-x-auto px-3.5 py-3 text-[11px] leading-5 whitespace-pre-wrap text-neutral-700">{serialized}</pre>
      </ScrollArea>
    </section>
  );
}

export function DeadLetterJobDetail({ selectedJob }: DeadLetterJobDetailProps) {
  if (!selectedJob) {
    return (
      <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200 xl:flex xl:h-[540px] xl:min-h-[540px] xl:flex-col">
        <CardHeader className="border-b border-neutral-200/80 pb-4">
          <CardTitle>{QUEUE_MANAGEMENT_TEXT.detailPlaceholderTitle}</CardTitle>
          <CardDescription>{QUEUE_MANAGEMENT_TEXT.detailPlaceholderDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-64 items-center justify-center px-6 py-10 xl:flex-1">
          <div className="max-w-sm space-y-2.5 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
              <PackageSearch className="size-5" />
            </div>
            <p className="text-base font-medium text-neutral-950">{QUEUE_MANAGEMENT_TEXT.detailPlaceholderTitle}</p>
            <p className="text-sm leading-5 text-neutral-500">{QUEUE_MANAGEMENT_TEXT.detailPlaceholderDescription}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200 xl:flex xl:h-[540px] xl:min-h-[540px] xl:flex-col">
      <CardHeader className="border-b border-neutral-200/80">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{QUEUE_MANAGEMENT_TEXT.detailTitle}</CardTitle>
            <CardDescription className="max-w-sm text-sm">Inspect the failed job payload before retrying or clearing the dead-letter record.</CardDescription>
          </div>
          <div className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-rose-700 uppercase">dead letter</div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 overflow-y-auto p-4 xl:flex-1">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-950 px-3.5 py-3 text-white">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-neutral-300 uppercase">Function</p>
          <p className="mt-1.5 text-lg font-semibold tracking-tight break-all">{selectedJob.function}</p>
          <p className="mt-1 text-[13px] leading-5 text-neutral-300">Job id {selectedJob.job_id}</p>
        </div>

        <div className="grid gap-2.5 md:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <p className="text-[11px] tracking-[0.18em] text-neutral-500 uppercase">Attempt</p>
            <p className="mt-1.5 text-xl font-semibold tracking-tight text-neutral-950">{selectedJob.job_try}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <p className="text-[11px] tracking-[0.18em] text-neutral-500 uppercase">Enqueued</p>
            <p className="mt-1.5 text-sm leading-5 font-medium text-neutral-950">{formatQueueTime(selectedJob.enqueue_time)}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <p className="text-[11px] tracking-[0.18em] text-neutral-500 uppercase">Finished</p>
            <p className="mt-1.5 text-sm leading-5 font-medium text-neutral-950">{formatQueueTime(selectedJob.finish_time)}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <p className="text-[11px] tracking-[0.18em] text-neutral-500 uppercase">Argument count</p>
            <p className="mt-1.5 text-xl font-semibold tracking-tight text-neutral-950">{selectedJob.args.length}</p>
          </div>
        </div>

        <section className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-rose-700 uppercase">
            <FileWarning className="size-3.5" />
            Final exception
          </div>
          <p className="mt-2 text-sm leading-6 break-words text-neutral-800">{selectedJob.error}</p>
        </section>

        <PayloadBlock payload={selectedJob.args} title="Arguments" />
        <PayloadBlock payload={selectedJob.kwargs} title="Keyword payload" />
      </CardContent>
    </Card>
  );
}
