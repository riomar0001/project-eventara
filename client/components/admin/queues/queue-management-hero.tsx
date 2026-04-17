'use client';

import { RefreshCw, Trash2 } from 'lucide-react';
import { AdminPageHero } from '@/components/admin/shared/admin-page-hero';
import { Button } from '@/components/ui/button';
import { QUEUE_MANAGEMENT_TEXT } from '@/constants/admin/queues';

interface QueueManagementHeroProps {
  deadJobs: number;
  inProgress: number;
  isBusy: boolean;
  onPurge: () => void;
  onRefresh: () => void;
  pending: number;
  totalCompleted: number;
  workerCount: number;
}

export function QueueManagementHero({ deadJobs, inProgress, isBusy, onPurge, onRefresh, pending, totalCompleted, workerCount }: QueueManagementHeroProps) {
  return (
    <AdminPageHero
      actions={
        <>
          <Button variant="outline" className="border-white/20 bg-white/6 text-white hover:bg-white/12 hover:text-white" onClick={onRefresh} disabled={isBusy}>
            <RefreshCw className="size-4" />
            Refresh queue
          </Button>
          <Button
            variant="outline"
            className="border-white/14 bg-white/8 text-rose-100 hover:bg-rose-400/12 hover:text-white"
            onClick={onPurge}
            disabled={isBusy || deadJobs === 0}
          >
            <Trash2 className="size-4" />
            Purge DLQ
          </Button>
        </>
      }
      description={QUEUE_MANAGEMENT_TEXT.description}
      eyebrow={QUEUE_MANAGEMENT_TEXT.eyebrow}
      metrics={[
        {
          label: 'Queued Jobs',
          value: pending,
          hint: 'Jobs currently waiting inside the primary ARQ queue.'
        },
        {
          label: 'In Flight',
          value: inProgress,
          hint: 'Work actively being processed by running workers right now.'
        },
        {
          label: 'Completed',
          value: totalCompleted,
          hint: 'Finished jobs still visible in the current Redis result window.'
        },
        {
          label: 'Dead Letter',
          value: deadJobs,
          hint: `${workerCount} worker heartbeat${workerCount === 1 ? '' : 's'} detected in this snapshot.`,
          emphasis: 'accent'
        }
      ]}
      metricsColumns={4}
      title="Queue control with dead-letter recovery."
      tone="midnight"
    />
  );
}
