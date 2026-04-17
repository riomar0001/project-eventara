'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useQueueManagement } from '@/hooks/admin/queues/use-queue-management';
import { DeadLetterJobDetail } from './dead-letter-job-detail';
import { DeadLetterQueueTable } from './dead-letter-queue-table';
import { PurgeDeadJobsDialog } from './purge-dead-jobs-dialog';
import { QueueLiveOverview } from './queue-live-overview';
import { QueueManagementHero } from './queue-management-hero';

export function QueueManagementPage() {
  const {
    actionJobId,
    actionKind,
    deadJobs,
    deleteDeadJob,
    isBusy,
    isEmpty,
    isLoadingJobs,
    isLoadingStats,
    isPurging,
    jobsError,
    purgeDeadJobs,
    queueStats,
    refresh,
    retryDeadJob,
    statsError
  } = useQueueManagement();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isPurgeDialogOpen, setIsPurgeDialogOpen] = useState(false);

  const effectiveJobId =
    deadJobs.length === 0 ? null : ((deadJobs.some((job) => job.job_id === selectedJobId) ? selectedJobId : null) ?? deadJobs[0]?.job_id ?? null);
  const selectedJob = deadJobs.find((job) => job.job_id === effectiveJobId) ?? null;

  async function handleRetry(jobId: string) {
    await retryDeadJob(jobId);
  }

  async function handleDelete(jobId: string) {
    await deleteDeadJob(jobId);
  }

  async function handlePurge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const deletedCount = await purgeDeadJobs();
    if (deletedCount === null) return;

    setIsPurgeDialogOpen(false);
  }

  return (
    <>
      <div className="space-y-4">
        <QueueManagementHero
          deadJobs={deadJobs.length}
          inProgress={queueStats?.in_progress ?? 0}
          isBusy={isBusy}
          onPurge={() => setIsPurgeDialogOpen(true)}
          onRefresh={refresh}
          pending={queueStats?.pending ?? 0}
          totalCompleted={queueStats?.total_completed ?? 0}
          workerCount={queueStats?.worker_health.length ?? 0}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] xl:items-start">
          <QueueLiveOverview isLoading={isLoadingStats} stats={queueStats} statsError={statsError} />
          <DeadLetterJobDetail selectedJob={selectedJob} />
        </div>

        <DeadLetterQueueTable
          actionJobId={actionJobId}
          actionKind={actionKind}
          deadJobs={deadJobs}
          isEmpty={isEmpty}
          isLoading={isLoadingJobs}
          jobsError={jobsError}
          onDelete={handleDelete}
          onRetry={handleRetry}
          onSelectJob={setSelectedJobId}
          selectedJobId={effectiveJobId}
        />
      </div>

      <PurgeDeadJobsDialog
        deadJobCount={deadJobs.length}
        isPurging={isPurging}
        onClose={() => setIsPurgeDialogOpen(false)}
        onConfirm={handlePurge}
        open={isPurgeDialogOpen}
      />
    </>
  );
}
