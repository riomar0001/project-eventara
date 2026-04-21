'use client';

import { useState } from 'react';
import { FileWarning, Info, PackageSearch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DeadJobResponse } from '@/api/types.gen';
import { QUEUE_MANAGEMENT_TEXT } from '@/constants/admin/queues';
import { cn } from '@/lib/utils';

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

type PayloadTab = 'args' | 'kwargs';

export function DeadLetterJobDetail({ selectedJob }: DeadLetterJobDetailProps) {
  const [activeTab, setActiveTab] = useState<PayloadTab>('args');

  if (!selectedJob) {
    return (
      <Card className="flex flex-col border-0 bg-white shadow-none ring-1 ring-neutral-200">
        <CardHeader className="border-b border-neutral-200/80 pb-4">
          <CardTitle className="text-base">{QUEUE_MANAGEMENT_TEXT.detailTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="max-w-xs space-y-3 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
              <PackageSearch className="size-5" />
            </div>
            <p className="text-sm font-medium text-neutral-700">{QUEUE_MANAGEMENT_TEXT.detailPlaceholderTitle}</p>
            <p className="text-xs leading-5 text-neutral-400">{QUEUE_MANAGEMENT_TEXT.detailPlaceholderDescription}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tabs: { id: PayloadTab; label: string; tip: string }[] = [
    {
      id: 'args',
      label: 'Arguments',
      tip: 'Positional arguments passed to the job function in order. These are the unnamed values the worker received when the task was enqueued.'
    },
    {
      id: 'kwargs',
      label: 'Keyword Arguments',
      tip: "Named keyword arguments passed to the job function. These are key-value pairs that map directly to the function's parameter names."
    }
  ];

  const activePayload = activeTab === 'args' ? selectedJob.args : selectedJob.kwargs;

  return (
    <Card className="flex h-200 flex-col border-0 bg-white shadow-none ring-1 ring-neutral-200">
      {/* Header */}
      <CardHeader className="shrink-0 border-b border-neutral-200/80 pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{QUEUE_MANAGEMENT_TEXT.detailTitle}</CardTitle>
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-rose-700 uppercase">
            dead letter
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        {/* Function identity */}
        <div className="shrink-0 rounded-xl bg-neutral-950 px-4 py-3 text-white">
          <p className="text-[10px] font-semibold tracking-[0.22em] text-neutral-400 uppercase">Function</p>
          <p className="mt-1.5 truncate text-sm font-semibold tracking-tight" title={selectedJob.function}>
            {selectedJob.function}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-neutral-400" title={selectedJob.job_id}>
            {selectedJob.job_id}
          </p>
        </div>

        {/* Stats row */}
        <div className="shrink-0 grid grid-cols-4 gap-2">
          {[
            { label: 'Attempt', value: selectedJob.job_try },
            { label: 'Args', value: selectedJob.args.length },
            { label: 'Enqueued', value: formatQueueTime(selectedJob.enqueue_time), small: true },
            { label: 'Finished', value: formatQueueTime(selectedJob.finish_time), small: true }
          ].map(({ label, value, small }) => (
            <div key={label} className="rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-2">
              <p className="text-[10px] tracking-[0.16em] text-neutral-400 uppercase">{label}</p>
              <p className={cn('mt-1 font-semibold text-neutral-900 leading-tight', small ? 'text-[11px]' : 'text-lg')}>{value}</p>
            </div>
          ))}
        </div>

        {/* Exception */}
        <div className="shrink-0 rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] text-rose-700 uppercase">
            <FileWarning className="size-3" />
            Final exception
          </div>
          <p className="mt-1.5 text-xs leading-5 wrap-break-word text-neutral-700">{selectedJob.error}</p>
        </div>

        {/* Payload tabs */}
        <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-neutral-200 bg-neutral-50/80">
          <div className="flex shrink-0 border-b border-neutral-200">
            <TooltipProvider delayDuration={300}>
              {tabs.map((tab) => (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-1.5 px-3.5 py-2.5 text-[11px] font-semibold transition-colors first:rounded-tl-xl last:rounded-tr-xl',
                        activeTab === tab.id
                          ? 'bg-white text-neutral-950 shadow-[inset_0_-2px_0_0] shadow-neutral-900'
                          : 'text-neutral-500 hover:text-neutral-700'
                      )}
                    >
                      {tab.label}
                      <Info className="size-3 shrink-0 opacity-50" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-64 text-center text-xs leading-5">
                    {tab.tip}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
          <ScrollArea className="flex-1 overflow-y-auto">
            <pre className="px-4 py-3 text-[11px] leading-5 whitespace-pre-wrap wrap-break-word text-neutral-700">
              {JSON.stringify(activePayload, null, 2)}
            </pre>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
