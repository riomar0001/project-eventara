'use client';

import { useEffect, useState } from 'react';
import { AppFeedback } from '@/api/sdk.gen';
import type { AppFeedbackRecordResponse } from '@/api/types.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

const PAGE_SIZE = 20;

export function useAppFeedback() {
  const [feedback, setFeedback] = useState<AppFeedbackRecordResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const result = await AppFeedback.listAppFeedbackAppFeedbackGet({
          query: { page, page_size: PAGE_SIZE },
          headers: getAuthHeaders(),
          throwOnError: false
        });

        if (!result.data) throw result.error ?? new Error('Unable to load feedback.');

        if (!cancelled) {
          setFeedback(result.data.data.feedback);
          setTotal(result.data.data.total);
          setTotalPages(result.data.data.total_pages);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load feedback.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return { feedback, total, totalPages, page, pageSize: PAGE_SIZE, isLoading, error, setPage };
}
