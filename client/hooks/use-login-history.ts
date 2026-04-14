'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { client } from '@/api/client.gen';
import { LOGIN_HISTORY_ENDPOINT, LOGIN_HISTORY_LIMIT } from '@/constants/login-history';
import { getAccessToken } from '@/store/auth-store';

const loginHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  browser: z.string().nullable(),
  os: z.string().nullable(),
  device_type: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  country: z.string().nullable(),
  successful: z.boolean(),
  created_at: z.string()
});

const loginHistoryResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(loginHistoryEntrySchema)
});

export type LoginHistoryEntry = z.infer<typeof loginHistoryEntrySchema>;

function getErrorMessage(error: unknown) {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const maybeResponseData = (error as { response?: { data?: unknown } }).response?.data;
    if (maybeResponseData && typeof maybeResponseData === 'object') {
      const detail = (maybeResponseData as { detail?: unknown }).detail;
      if (typeof detail === 'string') return detail;
    }

    const maybeDetail = (error as { detail?: unknown }).detail;
    if (typeof maybeDetail === 'string') return maybeDetail;

    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') return maybeMessage;
  }

  return 'Unable to load login history right now.';
}

export function useLoginHistory(limit: number = LOGIN_HISTORY_LIMIT) {
  const [entries, setEntries] = useState<LoginHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadLoginHistory() {
      const accessToken = getAccessToken();

      if (!accessToken) {
        if (!cancelled) {
          setEntries([]);
          setError('You need to be signed in to view login history.');
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await client.instance.get(LOGIN_HISTORY_ENDPOINT, {
          params: { limit },
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        const parsed = loginHistoryResponseSchema.parse(response.data);

        if (!cancelled) {
          setEntries(parsed.data);
        }
      } catch (nextError) {
        if (!cancelled) {
          setEntries([]);
          setError(getErrorMessage(nextError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadLoginHistory();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return {
    entries,
    error,
    isEmpty: !isLoading && !error && entries.length === 0,
    isLoading
  };
}
