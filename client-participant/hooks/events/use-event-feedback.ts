'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { humanizeApiError } from '@/lib/api-error';

type StatusState = 'loading' | 'not-checked-in' | 'already-submitted' | 'eligible';

export function useEventFeedback(eventId: string) {
  const { accessToken: token } = useAuthStore();
  const [status, setStatus] = useState<StatusState>('loading');
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRating = hovered || rating;

  useEffect(() => {
    if (!eventId || !token) {
      setStatus('not-checked-in');
      return;
    }

    setStatus('loading');
    fetch(`/api/events/${eventId}/feedback/my-status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) { setStatus('not-checked-in'); return; }
        if (json.data.has_submitted_feedback) { setStatus('already-submitted'); return; }
        if (!json.data.is_checked_in) { setStatus('not-checked-in'); return; }
        setStatus('eligible');
      })
      .catch(() => setStatus('not-checked-in'));
  }, [eventId, token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0 || !token) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/events/${eventId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment: comment || null, suggestion: suggestion || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(humanizeApiError(json.message, "Your feedback couldn't be submitted. Please try again."));
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try submitting your feedback again.');
    } finally {
      setSubmitting(false);
    }
  }

  return {
    status,
    rating,
    hovered,
    activeRating,
    comment,
    suggestion,
    submitting,
    submitted,
    error,
    setRating,
    setHovered,
    setComment,
    setSuggestion,
    handleSubmit,
  };
}
