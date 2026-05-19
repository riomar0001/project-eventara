'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import type { ApiEventSession } from '@/hooks/events/use-home-events';

export function useEventRegistrations(eventId: string, sessions: ApiEventSession[]) {
  const { accessToken: token } = useAuthStore();
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [initializing, setInitializing] = useState(true);

  const sessionIds = sessions.map((s) => s.id).join(',');

  useEffect(() => {
    if (!token || !sessionIds) {
      setInitializing(false);
      return;
    }
    const ids = sessionIds.split(',');
    Promise.all(
      ids.map((id) =>
        fetch(`/api/events/${eventId}/session/${id}/register`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((json) => ({ id, registered: json.success && json.data.is_registered }))
          .catch(() => ({ id, registered: false })),
      ),
    )
      .then((results) => {
        setRegisteredIds(new Set(results.filter((r) => r.registered).map((r) => r.id)));
      })
      .finally(() => setInitializing(false));
  }, [token, eventId, sessionIds]);

  return {
    registeredSessions: sessions.filter((s) => registeredIds.has(s.id)),
    initializing,
  };
}
