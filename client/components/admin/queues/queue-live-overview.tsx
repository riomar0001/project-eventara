'use client';

import { Activity, Bot, Gauge, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { QueueStatsResponse, WorkerHealthEntrySchema } from '@/api/types.gen';
import { QUEUE_MANAGEMENT_TEXT } from '@/constants/admin/queues';
import { cn } from '@/lib/utils';

interface QueueLiveOverviewProps {
  isLoading: boolean;
  stats: QueueStatsResponse | null;
  statsError: string | null;
}

function formatWorkerTimestamp(value: string | null) {
  if (!value) return 'No timestamp';

  if (/^[A-Za-z]{3}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(value)) {
    const [monthDay, time] = value.split(' ');
    const [month, day] = monthDay.split('-');
    return `${month} ${day} · ${time}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(parsed);
}

function WorkerHealthRow({ entry }: { entry: WorkerHealthEntrySchema }) {
  const hasFailures = entry.j_failed > 0;
  const isBusy = entry.j_ongoing > 0;
  const completedLabel = entry.j_complete === 1 ? 'job cleared' : 'jobs cleared';
  const pressureLabel = entry.queued > 0 ? 'queue carrying load' : 'queue caught up';

  return (
    <div className="rounded-[24px] border border-neutral-200 bg-white/90 p-3 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.28)]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold tracking-[-0.03em] text-neutral-950">Heartbeat snapshot</p>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-neutral-600 uppercase">
              {formatWorkerTimestamp(entry.timestamp)}
            </span>
          </div>
          <p className="text-xs leading-5 text-neutral-500">
            {entry.j_complete} {completedLabel}, {entry.queued > 0 ? `${entry.queued} pending` : 'no backlog'}, {pressureLabel}.
          </p>
        </div>
        <div
          className={cn(
            'rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase',
            hasFailures ? 'bg-rose-100 text-rose-700' : isBusy ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
          )}
        >
          {hasFailures ? 'degraded' : isBusy ? 'busy' : 'steady'}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs xl:grid-cols-5">
        <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50 px-2.5 py-2.5">
          <p className="text-neutral-500 uppercase">Completed</p>
          <p className="mt-1 text-sm font-semibold text-neutral-950">{entry.j_complete}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50 px-2.5 py-2.5">
          <p className="text-neutral-500 uppercase">Queued</p>
          <p className="mt-1 text-sm font-semibold text-neutral-950">{entry.queued}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50 px-2.5 py-2.5">
          <p className="text-neutral-500 uppercase">Ongoing</p>
          <p className="mt-1 text-sm font-semibold text-neutral-950">{entry.j_ongoing}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50 px-2.5 py-2.5">
          <p className="text-neutral-500 uppercase">Retried</p>
          <p className="mt-1 text-sm font-semibold text-neutral-950">{entry.j_retried}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50 px-2.5 py-2.5">
          <p className="text-neutral-500 uppercase">Failed</p>
          <p className="mt-1 text-sm font-semibold text-neutral-950">{entry.j_failed}</p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 px-3 py-2">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-neutral-500 uppercase">Worker signal</p>
        <p className="mt-1 font-mono text-[11px] leading-5 break-all text-neutral-600">{entry.raw}</p>
      </div>
    </div>
  );
}

export function QueueLiveOverview({ isLoading, stats, statsError }: QueueLiveOverviewProps) {
  return (
    <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200 xl:flex xl:min-h-[620px] xl:flex-col">
      <CardHeader className="border-b border-neutral-200/80 pb-4">
        <CardTitle className="text-xl tracking-tight">{QUEUE_MANAGEMENT_TEXT.liveOverviewTitle}</CardTitle>
        <CardDescription className="max-w-2xl text-sm leading-6">{QUEUE_MANAGEMENT_TEXT.liveOverviewDescription}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col xl:overflow-hidden">
        {statsError ? (
          <div className="flex h-full min-h-52 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-rose-200 bg-rose-50/60 px-6 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
              <ShieldAlert className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium text-neutral-950">{QUEUE_MANAGEMENT_TEXT.statsErrorTitle}</p>
              <p className="text-sm leading-6 text-neutral-500">{statsError}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              {isLoading ? (
                Array.from({ length: 4 }, (_, index) => <Skeleton key={`queue-stat-${index}`} className="h-24 rounded-3xl" />)
              ) : (
                <>
                  <div className="rounded-[24px] border border-sky-200 bg-sky-50/70 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold tracking-[0.22em] text-sky-700 uppercase">Queue</p>
                      <Gauge className="size-4 text-sky-700" />
                    </div>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">{stats?.queue_name ?? 'arq:queue'}</p>
                    <p className="mt-1 text-xs leading-5 text-neutral-600">Primary queue namespace currently serving async admin workloads.</p>
                  </div>
                  <div className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold tracking-[0.22em] text-amber-700 uppercase">Pending</p>
                      <Activity className="size-4 text-amber-700" />
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">{stats?.pending ?? 0}</p>
                    <p className="mt-1 text-xs leading-5 text-neutral-600">Jobs waiting for a worker slot.</p>
                  </div>
                  <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold tracking-[0.22em] text-emerald-700 uppercase">Completed</p>
                      <Bot className="size-4 text-emerald-700" />
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">{stats?.total_completed ?? 0}</p>
                    <p className="mt-1 text-xs leading-5 text-neutral-600">Finished jobs still visible in result storage.</p>
                  </div>
                  <div className="rounded-[24px] border border-rose-200 bg-rose-50/70 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold tracking-[0.22em] text-rose-700 uppercase">Failed</p>
                      <ShieldAlert className="size-4 text-rose-700" />
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">{stats?.total_failed ?? 0}</p>
                    <p className="mt-1 text-xs leading-5 text-neutral-600">Failed jobs retained for dead-letter review.</p>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-[28px] border border-neutral-200 bg-neutral-50/70 p-3 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col xl:overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-1 pb-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-950">Worker heartbeat ledger</p>
                  <p className="text-xs leading-5 text-neutral-500">Recent health-check entries emitted by the live ARQ workers.</p>
                </div>
                <div className="rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-white uppercase">
                  {stats?.worker_health.length ?? 0} workers
                </div>
              </div>

              <ScrollArea className="mt-3 xl:min-h-0 xl:flex-1">
                <div className="space-y-3 pr-3 pb-3">
                  {isLoading ? (
                    Array.from({ length: 3 }, (_, index) => <Skeleton key={`queue-worker-${index}`} className="h-32 rounded-3xl" />)
                  ) : stats?.worker_health.length ? (
                    stats.worker_health.map((entry, index) => <WorkerHealthRow key={`${entry.raw}-${index}`} entry={entry} />)
                  ) : (
                    <div className="flex min-h-44 items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-white/80 px-6 text-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-neutral-950">No worker heartbeats detected</p>
                        <p className="text-sm leading-6 text-neutral-500">Start the ARQ worker process to populate this health ledger.</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
