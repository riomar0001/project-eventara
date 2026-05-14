'use client';

import { useState } from 'react';

export function useEventFeedback() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const activeRating = hovered || rating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    // TODO: call feedback API (POST /app-feedback)
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
  }

  return {
    rating,
    hovered,
    activeRating,
    comment,
    submitting,
    submitted,
    setRating,
    setHovered,
    setComment,
    handleSubmit
  };
}
