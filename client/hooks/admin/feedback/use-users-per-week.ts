'use client';

import { useEffect, useState } from 'react';
import { AppFeedback } from '@/api/sdk.gen';
import type { WeeklyRegistrationEntry } from '@/api/types.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

export function useUsersPerWeek(weeks = 12) {
  const [entries, setEntries] = useState<WeeklyRegistrationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const result = await AppFeedback.getUsersPerWeekAppFeedbackUsersPerWeekGet({
          query: { weeks },
          headers: getAuthHeaders(),
          throwOnError: false
        });

        if (!result.data) throw result.error ?? new Error('Unable to load user growth data.');

        if (!cancelled) setEntries(result.data.data.entries);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load user growth data.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [weeks]);

  return { entries, isLoading, error };
}
