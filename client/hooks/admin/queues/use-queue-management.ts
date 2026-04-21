'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { QueueManagement } from '@/api/sdk.gen';
import type { DeadJobResponse, QueueStatsResponse } from '@/api/types.gen';
import { getAccessToken } from '@/store/auth-store';

type QueueActionKind = 'delete' | 'retry' | null;

function extractErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;

  const maybePayload = payload as { detail?: unknown; message?: unknown };

  if (typeof maybePayload.detail === 'string') return maybePayload.detail;

  if (Array.isArray(maybePayload.detail) && maybePayload.detail.length > 0) {
    const first = maybePayload.detail[0];

    if (typeof first === 'string') return first;

    if (first && typeof first === 'object') {
      const validationError = first as { msg?: unknown; message?: unknown };
      if (typeof validationError.msg === 'string') return validationError.msg;
      if (typeof validationError.message === 'string') return validationError.message;
    }
  }

  if (typeof maybePayload.message === 'string') return maybePayload.message;
  return undefined;
}

function getQueueErrorMessage(error: unknown, fallbackMessage: string) {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const responseData = (error as { response?: { data?: unknown } }).response?.data;
    const responseMessage = extractErrorMessage(responseData);
    if (responseMessage) return responseMessage;

    const payloadMessage = extractErrorMessage(error);
    if (payloadMessage) return payloadMessage;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallbackMessage;
}

function getRequestHeaders() {
  const accessToken = getAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

const PAGE_LIMIT = 10;

export function useQueueManagement() {
  const [queueStats, setQueueStats] = useState<QueueStatsResponse | null>(null);
  const [deadJobs, setDeadJobs] = useState<DeadJobResponse[]>([]);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [actionJobId, setActionJobId] = useState<string | null>(null);
  const [actionKind, setActionKind] = useState<QueueActionKind>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadQueueStats() {
      setIsLoadingStats(true);
      setStatsError(null);

      try {
        const result = await QueueManagement.getQueueStatsQueuesGet({
          headers: getRequestHeaders(),
          throwOnError: false
        });

        if (!result.data) {
          throw result.error ?? new Error('Unable to inspect queue state right now.');
        }

        if (!cancelled) {
          setQueueStats(result.data);
        }
      } catch (nextError) {
        if (!cancelled) {
          setQueueStats(null);
          setStatsError(getQueueErrorMessage(nextError, 'Unable to inspect queue state right now.'));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingStats(false);
        }
      }
    }

    async function loadDeadJobs() {
      setIsLoadingJobs(true);
      setJobsError(null);

      try {
        const result = await QueueManagement.listDeadJobsQueuesDlqGet({
          headers: getRequestHeaders(),
          query: { page, limit: PAGE_LIMIT },
          throwOnError: false
        });

        if (!result.data) {
          throw result.error ?? new Error('Unable to load dead-letter jobs right now.');
        }

        if (!cancelled) {
          setDeadJobs(result.data.data);
          setTotalPages(result.data.total_pages);
          setTotalJobs(result.data.total);
        }
      } catch (nextError) {
        if (!cancelled) {
          setDeadJobs([]);
          setJobsError(getQueueErrorMessage(nextError, 'Unable to load dead-letter jobs right now.'));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingJobs(false);
        }
      }
    }

    void Promise.all([loadQueueStats(), loadDeadJobs()]);

    return () => {
      cancelled = true;
    };
  }, [reloadToken, page]);

  function refresh() {
    setPage(1);
    setReloadToken((current) => current + 1);
  }

  async function retryDeadJob(jobId: string) {
    if (actionJobId || isPurging) return null;

    setActionJobId(jobId);
    setActionKind('retry');

    try {
      const result = await QueueManagement.retryDeadJobQueuesDlqJobIdRetryPost({
        headers: getRequestHeaders(),
        path: { job_id: jobId },
        throwOnError: false
      });

      if (!result.data) {
        throw result.error ?? new Error('Unable to retry the failed job right now.');
      }

      toast.success(`Job re-enqueued as ${result.data.new_job_id.slice(0, 12)}.`);
      refresh();
      return result.data;
    } catch (nextError) {
      toast.error(getQueueErrorMessage(nextError, 'Unable to retry the failed job right now.'));
      return null;
    } finally {
      setActionJobId(null);
      setActionKind(null);
    }
  }

  async function deleteDeadJob(jobId: string) {
    if (actionJobId || isPurging) return false;

    setActionJobId(jobId);
    setActionKind('delete');

    try {
      const result = await QueueManagement.deleteDeadJobQueuesDlqJobIdDelete({
        headers: getRequestHeaders(),
        path: { job_id: jobId },
        throwOnError: false
      });

      if (!result.data) {
        throw result.error ?? new Error('Unable to delete the failed job right now.');
      }

      toast.success('Failed job removed from the dead-letter queue.');
      refresh();
      return true;
    } catch (nextError) {
      toast.error(getQueueErrorMessage(nextError, 'Unable to delete the failed job right now.'));
      return false;
    } finally {
      setActionJobId(null);
      setActionKind(null);
    }
  }

  async function purgeDeadJobs() {
    if (actionJobId || isPurging) return null;

    setIsPurging(true);

    try {
      const result = await QueueManagement.purgeDeadJobsQueuesDlqDelete({
        headers: getRequestHeaders(),
        throwOnError: false
      });

      if (!result.data) {
        throw result.error ?? new Error('Unable to purge the dead-letter queue right now.');
      }

      toast.success(`${result.data.deleted_count} failed job${result.data.deleted_count === 1 ? '' : 's'} removed from the dead-letter queue.`);
      refresh();
      return result.data.deleted_count;
    } catch (nextError) {
      toast.error(getQueueErrorMessage(nextError, 'Unable to purge the dead-letter queue right now.'));
      return null;
    } finally {
      setIsPurging(false);
    }
  }

  return {
    actionJobId,
    actionKind,
    deadJobs,
    deleteDeadJob,
    isBusy: isLoadingStats || isLoadingJobs || isPurging || Boolean(actionJobId),
    isEmpty: !isLoadingJobs && !jobsError && totalJobs === 0,
    isLoadingJobs,
    isLoadingStats,
    isPurging,
    jobsError,
    page,
    purgeDeadJobs,
    queueStats,
    refresh,
    retryDeadJob,
    setPage,
    statsError,
    totalJobs,
    totalPages,
  };
}
