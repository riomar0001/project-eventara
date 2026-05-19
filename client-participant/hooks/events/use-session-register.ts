'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { EventParticipants } from '@/api';
import { humanizeApiError } from '@/lib/api-error';

const COOLDOWN_MS = 5_000;

export function useSessionRegister(eventId: string, sessionId: string) {
  const { accessToken: token } = useAuthStore();
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownMsg, setCooldownMsg] = useState<string | null>(null);

  const cooldownUntil = useRef(0);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) {
      setInitializing(false);
      return;
    }
    fetch(`/api/events/${eventId}/session/${sessionId}/register`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setIsRegistered(json.data.is_registered);
      })
      .catch(() => {})
      .finally(() => setInitializing(false));
  }, [token, eventId, sessionId]);

  function armCooldown() {
    cooldownUntil.current = Date.now() + COOLDOWN_MS;
  }

  function flashCooldownMsg(msg: string) {
    setCooldownMsg(msg);
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    cooldownTimer.current = setTimeout(() => setCooldownMsg(null), 3_000);
  }

  async function register(): Promise<boolean> {
    if (Date.now() < cooldownUntil.current) {
      flashCooldownMsg('Please wait a moment before registering again.');
      return false;
    }
    setLoading(true);
    setError(null);
    setCooldownMsg(null);
    const { data, error: err } = await EventParticipants.registerForSessionEventsEventIdSessionSessionIdRegisterPost({
      path: { event_id: eventId, session_id: sessionId },
    });
    setLoading(false);
    if (err) {
      const msg = humanizeApiError((err as { message?: string })?.message, "Couldn't register for this session. Please try again.");
      setError(msg);
      return false;
    }
    if (data) {
      setIsRegistered(true);
      armCooldown();
      return true;
    }
    return false;
  }

  async function withdraw(): Promise<boolean> {
    if (Date.now() < cooldownUntil.current) {
      flashCooldownMsg('Please wait a moment before withdrawing.');
      return false;
    }
    setLoading(true);
    setError(null);
    setCooldownMsg(null);
    const { data, error: err } = await EventParticipants.withdrawRegistrationEventsEventIdSessionSessionIdRegisterDelete({
      path: { event_id: eventId, session_id: sessionId },
    });
    setLoading(false);
    if (err) {
      const msg = humanizeApiError((err as { message?: string })?.message, "Couldn't withdraw your registration. Please try again.");
      setError(msg);
      return false;
    }
    if (data) {
      setIsRegistered(false);
      armCooldown();
      return true;
    }
    return false;
  }

  return { isRegistered, initializing, loading, error, cooldownMsg, register, withdraw };
}
