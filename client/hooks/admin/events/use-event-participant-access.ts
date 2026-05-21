'use client';

import { useEffect, useMemo, useState } from 'react';
import { EventParticipants } from '@/api/sdk.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';
import { useAuthStore } from '@/store/auth-store';

const PRIVILEGED_ROLES = ['community_leader', 'system_administrator'];

export function useEventParticipantAccess(eventId: string, eventOwnerId?: string | null) {
  const user = useAuthStore((state) => state.user);
  const isPrivileged = useMemo(() => Boolean(user?.role && PRIVILEGED_ROLES.includes(user.role)), [user?.role]);
  const isOwner = useMemo(
    () => isPrivileged || Boolean(eventOwnerId && user?.id === eventOwnerId),
    [isPrivileged, eventOwnerId, user?.id]
  );
  const [canAccess, setCanAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!eventOwnerId || !user?.id) {
      setCanAccess(false);
      setIsLoading(false);
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    if (isOwner) {
      setCanAccess(true);
      setIsLoading(false);
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await EventParticipants.getEventParticipantsEventsEventIdParticipantsGet({
          path: { event_id: eventId },
          query: { limit: 1, offset: 0 },
          headers: getAuthHeaders(),
          throwOnError: false
        });

        if (!cancelled) {
          setCanAccess(Boolean(result.data));
          setError(result.data ? null : getApiErrorMessage(result.error, 'Event participants are restricted to assigned volunteers.'));
        }
      } catch (err) {
        if (!cancelled) {
          setCanAccess(false);
          setError(getApiErrorMessage(err, 'Event participants are restricted to assigned volunteers.'));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId, eventOwnerId, isOwner, user?.id]);

  return { canAccess, error, isLoading, isOwner };
}
