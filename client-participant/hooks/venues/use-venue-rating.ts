'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { humanizeApiError } from '@/lib/api-error';

interface MyRating {
  id: string;
  rating: number;
  comment: string | null;
}

interface UseVenueRatingState {
  average: number | null;
  count: number;
  myRating: MyRating | null;
  loadingAverage: boolean;
  loadingMine: boolean;
  submitting: boolean;
  error: string | null;
}

export interface UseVenueRatingReturn extends UseVenueRatingState {
  submitRating: (rating: number, comment: string) => Promise<boolean>;
  updateRating: (rating: number, comment: string) => Promise<boolean>;
  deleteRating: () => Promise<boolean>;
  clearError: () => void;
}

export function useVenueRating(venueId: string | null): UseVenueRatingReturn {
  const { accessToken: token } = useAuthStore();

  const [average, setAverage] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [myRating, setMyRating] = useState<MyRating | null>(null);
  const [loadingAverage, setLoadingAverage] = useState(false);
  const [loadingMine, setLoadingMine] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!venueId) return;
    setLoadingAverage(true);
    fetch(`/api/venues/${venueId}/ratings/average`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setAverage(json.data.average);
          setCount(json.data.count);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAverage(false));
  }, [venueId]);

  useEffect(() => {
    if (!venueId || !token) {
      setMyRating(null);
      return;
    }
    setLoadingMine(true);
    fetch(`/api/venues/${venueId}/ratings/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.status === 404 ? null : r.json()))
      .then((json) => {
        if (json?.success) {
          setMyRating({ id: json.data.id, rating: json.data.rating, comment: json.data.comment });
        } else {
          setMyRating(null);
        }
      })
      .catch(() => setMyRating(null))
      .finally(() => setLoadingMine(false));
  }, [venueId, token]);

  const submitRating = useCallback(async (rating: number, comment: string): Promise<boolean> => {
    if (!venueId || !token) return false;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/venues/${venueId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) { setError(humanizeApiError(json.message, "Couldn't submit your rating. Please try again.")); return false; }
      setMyRating({ id: json.data.id, rating: json.data.rating, comment: json.data.comment });
      setCount((c) => c + 1);
      // Refresh average
      fetch(`/api/venues/${venueId}/ratings/average`)
        .then((r) => r.json())
        .then((j) => { if (j.success) { setAverage(j.data.average); setCount(j.data.count); } })
        .catch(() => {});
      return true;
    } catch {
      setError('Something went wrong submitting your rating. Please try again.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [venueId, token]);

  const updateRating = useCallback(async (rating: number, comment: string): Promise<boolean> => {
    if (!venueId || !token) return false;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/venues/${venueId}/ratings/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) { setError(humanizeApiError(json.message, "Couldn't update your rating. Please try again.")); return false; }
      setMyRating({ id: json.data.id, rating: json.data.rating, comment: json.data.comment });
      fetch(`/api/venues/${venueId}/ratings/average`)
        .then((r) => r.json())
        .then((j) => { if (j.success) { setAverage(j.data.average); setCount(j.data.count); } })
        .catch(() => {});
      return true;
    } catch {
      setError('Something went wrong updating your rating. Please try again.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [venueId, token]);

  const deleteRating = useCallback(async (): Promise<boolean> => {
    if (!venueId || !token) return false;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/venues/${venueId}/ratings/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const j = await res.json(); setError(humanizeApiError(j.message, "Couldn't remove your rating. Please try again.")); return false; }
      setMyRating(null);
      fetch(`/api/venues/${venueId}/ratings/average`)
        .then((r) => r.json())
        .then((j) => { if (j.success) { setAverage(j.data.average); setCount(j.data.count); } })
        .catch(() => {});
      return true;
    } catch {
      setError('Something went wrong removing your rating. Please try again.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [venueId, token]);

  const clearError = useCallback(() => setError(null), []);

  return { average, count, myRating, loadingAverage, loadingMine, submitting, error, submitRating, updateRating, deleteRating, clearError };
}
