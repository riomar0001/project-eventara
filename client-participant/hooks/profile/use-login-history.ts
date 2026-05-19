'use client';

import { useState, useEffect } from 'react';
import { AccountSettings } from '@/api/sdk.gen';
import type { LoginHistoryEntryResponse } from '@/api/types.gen';

export type { LoginHistoryEntryResponse };

export function useLoginHistory() {
  const [sessions, setSessions] = useState<LoginHistoryEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AccountSettings.getLoginHistoryUserLoginHistoryGet({ query: { limit: 20 } }).then(({ data, error: apiError }) => {
      if (apiError || !data) {
        setError('Failed to load login history.');
      } else {
        setSessions(data.data);
      }
      setLoading(false);
    });
  }, []);

  return { sessions, loading, error };
}
