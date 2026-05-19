'use client';

import { useState } from 'react';
import { EventParticipants } from '@/api';

export function useSessionRegister(eventId: string, sessionId: string) {
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function register() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await EventParticipants.registerForSessionEventsEventIdSessionSessionIdRegisterPost({
      path: { event_id: eventId, session_id: sessionId },
    });
    setLoading(false);
    if (err) {
      const msg = (err as { message?: string })?.message ?? 'Registration failed';
      setError(msg);
      return;
    }
    if (data) setIsRegistered(true);
  }

  async function withdraw() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await EventParticipants.withdrawRegistrationEventsEventIdSessionSessionIdRegisterDelete({
      path: { event_id: eventId, session_id: sessionId },
    });
    setLoading(false);
    if (err) {
      const msg = (err as { message?: string })?.message ?? 'Withdrawal failed';
      setError(msg);
      return;
    }
    if (data) setIsRegistered(false);
  }

  return { isRegistered, loading, error, register, withdraw };
}
