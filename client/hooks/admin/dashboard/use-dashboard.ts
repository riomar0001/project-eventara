'use client';

import { useEffect, useState } from 'react';
import { Dashboard } from '@/api/sdk.gen';
import type { DashboardMetricsResponse } from '@/api/types.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const result = await Dashboard.getDashboardDataDashboardGet({
          headers: getAuthHeaders(),
          throwOnError: false
        });

        if (!result.data) throw result.error ?? new Error('Unable to load dashboard data.');

        if (!cancelled) setMetrics(result.data.data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load dashboard data.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return { metrics, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
