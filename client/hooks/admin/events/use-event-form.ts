'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Events } from '@/api/sdk.gen';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';
import { getAccessToken } from '@/store/auth-store';

function extractErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as { detail?: unknown; message?: unknown };
  if (typeof p.detail === 'string') return p.detail;
  if (Array.isArray(p.detail) && p.detail.length > 0) {
    const first = p.detail[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') {
      const ve = first as { msg?: unknown; message?: unknown };
      if (typeof ve.msg === 'string') return ve.msg;
      if (typeof ve.message === 'string') return ve.message;
    }
  }
  if (typeof p.message === 'string') return p.message;
  return undefined;
}

function getEventErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const d = (error as { response?: { data?: unknown } }).response?.data;
    const msg = extractErrorMessage(d) ?? extractErrorMessage(error);
    if (msg) return msg;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export type SessionSubmitData = {
  existingId?: string;
  venueId: string;
  title: string;
  description: string;
  startDatetime: string;
  endDatetime: string;
  maxSlots: string;
};

export type EventFormSubmitData = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  sessions: SessionSubmitData[];
};

export function useEventForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitCreate(data: EventFormSubmitData, targetStatus: 'draft' | 'posted') {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const result = await Events.createEventEventsPost({
        body: {
          title: data.title,
          description: data.description,
          start_date: data.startDate,
          end_date: data.endDate,
          sessions: data.sessions.map((s) => ({
            venue_id: s.venueId,
            title: s.title,
            description: s.description || null,
            start_datetime: s.startDatetime,
            end_datetime: s.endDatetime,
            max_slots: s.maxSlots ? parseInt(s.maxSlots, 10) : null
          }))
        },
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        throwOnError: false
      });

      if (!result.data) throw result.error ?? new Error('Unable to create event right now.');

      const eventId = result.data.data.id;

      if (targetStatus === 'posted') {
        const statusResult = await Events.updateEventStatusEventsEventIdStatusPatch({
          path: { event_id: eventId },
          body: { new_status: 'posted' },
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          throwOnError: false
        });
        toast.success(statusResult.data?.message ?? (statusResult.data ? 'Event published.' : 'Event saved as draft.'));
      } else {
        toast.success(result.data.message ?? 'Event saved as draft.');
      }

      router.push(ADMIN_OPERATIONS_PATHS.eventDetail(eventId));
    } catch (error) {
      toast.error(getEventErrorMessage(error, 'Unable to create event right now.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitEdit(eventId: string, data: EventFormSubmitData, removedSessionIds: string[], targetStatus: 'draft' | 'posted', currentStatus: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const metaResult = await Events.updateEventMetadataEventsEventIdPatch({
        path: { event_id: eventId },
        body: {
          title: data.title,
          description: data.description,
          start_date: data.startDate,
          end_date: data.endDate
        },
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        throwOnError: false
      });

      if (!metaResult.data) throw metaResult.error ?? new Error('Unable to update event right now.');

      await Promise.allSettled(
        removedSessionIds.map((sessionId) =>
          Events.deleteEventSessionEventsEventIdSessionSessionIdDelete({
            path: { event_id: eventId, session_id: sessionId },
            headers: { Authorization: `Bearer ${getAccessToken()}` },
            throwOnError: false
          })
        )
      );

      await Promise.allSettled(
        data.sessions
          .filter((s) => s.existingId)
          .map((s) =>
            Events.updateEventSessionEventsEventIdSessionSessionIdPatch({
              path: { event_id: eventId, session_id: s.existingId! },
              body: {
                venue_id: s.venueId,
                title: s.title,
                description: s.description || null,
                start_datetime: s.startDatetime,
                end_datetime: s.endDatetime,
                max_slots: s.maxSlots ? parseInt(s.maxSlots, 10) : null
              },
              headers: { Authorization: `Bearer ${getAccessToken()}` },
              throwOnError: false
            })
          )
      );

      const newSessionCount = data.sessions.filter((s) => !s.existingId).length;
      if (newSessionCount > 0) {
        toast.warning(`${newSessionCount} new session(s) were not saved — adding sessions to an existing event is not yet supported.`);
      }

      if (targetStatus === 'posted' && currentStatus === 'draft') {
        const statusResult = await Events.updateEventStatusEventsEventIdStatusPatch({
          path: { event_id: eventId },
          body: { new_status: 'posted' },
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          throwOnError: false
        });
        toast.success(statusResult.data ? 'Event updated and published.' : 'Event updated but could not be published at this time.');
      } else {
        toast.success(metaResult.data.message ?? 'Event updated successfully.');
      }

      router.push(ADMIN_OPERATIONS_PATHS.eventDetail(eventId));
    } catch (error) {
      toast.error(getEventErrorMessage(error, 'Unable to update event right now.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return { submitCreate, submitEdit, isSubmitting };
}
