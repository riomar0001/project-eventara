'use client';

import { useEffect, useState } from 'react';
import { AppFeedback } from '@/api/sdk.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

export type RatingDistribution = { rating: number; count: number; label: string }[];

export type FeedbackAnalytics = {
  averageRating: number;
  total: number;
  distribution: RatingDistribution;
};

export function useFeedbackAnalytics() {
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const result = await AppFeedback.listAppFeedbackAppFeedbackGet({
          query: { page: 1, page_size: 100 },
          headers: getAuthHeaders(),
          throwOnError: false
        });

        if (!result.data) throw result.error ?? new Error('Unable to load analytics.');

        const { feedback, total } = result.data.data;

        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let sum = 0;
        for (const f of feedback) {
          const r = Math.min(5, Math.max(1, Math.round(f.rating))) as 1 | 2 | 3 | 4 | 5;
          counts[r]++;
          sum += f.rating;
        }

        const averageRating = feedback.length > 0 ? sum / feedback.length : 0;
        const distribution: RatingDistribution = [1, 2, 3, 4, 5].map((r) => ({
          rating: r,
          count: counts[r as keyof typeof counts],
          label: `${r} ★`
        }));

        if (!cancelled) setAnalytics({ averageRating, total, distribution });
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load analytics.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { analytics, isLoading, error };
}
