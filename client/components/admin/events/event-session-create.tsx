'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Events } from '@/api/sdk.gen';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';
import { useEvent } from '@/hooks/admin/events/use-event';
import { useVenues } from '@/hooks/admin/venues/use-venues';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';
import { BackLink, DetailPanel, FieldLabel } from './events-shared';

function toLocalInput(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addHours(iso: string, hours: number) {
  const next = new Date(iso);
  next.setHours(next.getHours() + hours);
  return next.toISOString();
}

function CreateSessionSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="space-y-6 rounded-[28px] bg-white p-6 ring-1 ring-neutral-200/80">
        <div className="h-5 w-1/3 rounded bg-neutral-200" />
        <div className="space-y-4">
          <div className="h-12 rounded-2xl bg-neutral-100" />
          <div className="h-12 rounded-2xl bg-neutral-100" />
          <div className="h-24 rounded-2xl bg-neutral-100" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-12 rounded-2xl bg-neutral-100" />
            <div className="h-12 rounded-2xl bg-neutral-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventSessionCreateLoader({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { event, sessions, isLoading, error } = useEvent(eventId);
  const { venues, isLoading: venuesLoading, error: venuesError } = useVenues();

  const sortedVenues = useMemo(() => [...venues].sort((a, b) => a.name.localeCompare(b.name)), [venues]);

  const [venueId, setVenueId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [maxSlots, setMaxSlots] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!event) return;
    setStartDatetime((current) => current || toLocalInput(event.start_date));
    setEndDatetime((current) => current || toLocalInput(addHours(event.start_date, 1)));
  }, [event]);

  const selectedVenue = useMemo(() => sortedVenues.find((venue) => venue.id === venueId) ?? null, [sortedVenues, venueId]);
  const eventStart = event ? new Date(event.start_date) : undefined;
  const eventEnd = event ? new Date(event.end_date) : undefined;
  const maxSlotsValue = maxSlots.trim() ? Number(maxSlots) : null;

  function validate() {
    if (!event) return 'Event not loaded.';
    if (!venueId) return 'Venue is required.';
    if (title.trim().length < 5) return 'Session title must be at least 5 characters.';
    if (!startDatetime) return 'Start datetime is required.';
    if (!endDatetime) return 'End datetime is required.';
    if (Number.isNaN(new Date(startDatetime).getTime()) || Number.isNaN(new Date(endDatetime).getTime())) return 'Please pick valid session datetimes.';

    const start = new Date(startDatetime);
    const end = new Date(endDatetime);
    if (start >= end) return 'Start datetime must be before end datetime.';
    if (eventStart && start < eventStart) return 'Session start must stay within the event window.';
    if (eventEnd && end > eventEnd) return 'Session end must stay within the event window.';
    if (maxSlotsValue !== null && (!Number.isInteger(maxSlotsValue) || maxSlotsValue <= 0)) return 'Max slots must be a positive whole number.';
    if (selectedVenue && maxSlotsValue !== null && maxSlotsValue > selectedVenue.capacity) {
      return `Max slots cannot exceed ${selectedVenue.name}'s capacity of ${selectedVenue.capacity.toLocaleString()}.`;
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting || !event) return;

    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await Events.createEventSessionEventsEventIdSessionPost({
        path: { event_id: event.id },
        body: {
          venue_id: venueId,
          title: title.trim(),
          description: description.trim() || null,
          start_datetime: new Date(startDatetime).toISOString(),
          end_datetime: new Date(endDatetime).toISOString(),
          max_slots: maxSlotsValue ?? (selectedVenue?.capacity ?? null),
        },
        headers: getAuthHeaders(),
        throwOnError: false
      });

      if (!result.data) throw result.error ?? new Error('Unable to create session right now.');

      toast.success(result.data.message ?? 'Event session created successfully.');
      router.push(ADMIN_OPERATIONS_PATHS.eventDetail(event.id));
    } catch (submitError) {
      toast.error(getApiErrorMessage(submitError, 'Unable to create session right now.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <BackLink href={ADMIN_OPERATIONS_PATHS.eventDetail(eventId)} label="Back to event" />
        </div>
        <CreateSessionSkeleton />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <BackLink href={ADMIN_OPERATIONS_PATHS.eventDetail(eventId)} label="Back to event" />
        </div>
        <div className="rounded-[24px] border border-red-100 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-red-700">{error ?? 'Event not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <BackLink href={ADMIN_OPERATIONS_PATHS.eventDetail(event.id)} label="Back to event" />
      </div>

      {venuesError && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-700">
          <AlertCircle className="size-4 shrink-0" />
          {venuesError}
        </div>
      )}

      <DetailPanel
        title="Session details"
        description="Create one session for this event. The schedule must stay inside the event date range."
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <FieldLabel htmlFor="session-venue">Venue *</FieldLabel>
              <Select value={venueId} onValueChange={setVenueId} disabled={venuesLoading || Boolean(venuesError) || isSubmitting}>
                <SelectTrigger id="session-venue">
                  <SelectValue placeholder={venuesLoading ? 'Loading venues…' : 'Select a venue'} />
                </SelectTrigger>
                <SelectContent>
                  {sortedVenues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name} · {venue.city} · {venue.capacity.toLocaleString()} seats
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVenue ? (
                <p className="text-xs text-neutral-500">
                  Selected venue capacity: {selectedVenue.capacity.toLocaleString()} guests.
                </p>
              ) : (
                <p className="text-xs text-neutral-400">Choose the venue that should host this session.</p>
              )}
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="session-title">Session title *</FieldLabel>
              <Input
                id="session-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Opening forum, keynote, workshop, and more"
                maxLength={255}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="session-description">Session description</FieldLabel>
              <Textarea
                id="session-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add a short operational or program note for this session."
                className="min-h-24"
                maxLength={5000}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="session-start">Start datetime *</FieldLabel>
                <DateTimePicker
                  id="session-start"
                  value={startDatetime}
                  onChange={setStartDatetime}
                  minDatetime={eventStart}
                  maxDatetime={eventEnd}
                  disabled={isSubmitting}
                  placeholder="Pick session start"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="session-end">End datetime *</FieldLabel>
                <DateTimePicker
                  id="session-end"
                  value={endDatetime}
                  onChange={setEndDatetime}
                  minDatetime={startDatetime ? new Date(startDatetime) : eventStart}
                  maxDatetime={eventEnd}
                  disabled={isSubmitting}
                  placeholder="Pick session end"
                />
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="session-max-slots">Max slots</FieldLabel>
              <Input
                id="session-max-slots"
                type="number"
                min="1"
                value={maxSlots}
                onChange={(event) => setMaxSlots(event.target.value)}
                placeholder={selectedVenue ? `Leave blank to use ${selectedVenue.capacity.toLocaleString()} seats` : 'Optional'}
                disabled={isSubmitting}
              />
              {selectedVenue ? (
                maxSlotsValue !== null && maxSlotsValue > selectedVenue.capacity ? (
                  <p className="flex items-center gap-1.5 text-xs text-amber-600">
                    <AlertCircle className="size-3 shrink-0" />
                    Exceeds venue capacity of {selectedVenue.capacity.toLocaleString()} seats
                  </p>
                ) : (
                  <p className="text-xs text-neutral-500">Leave blank to use the venue capacity automatically.</p>
                )
              ) : (
                <p className="text-xs text-neutral-400">Optional capacity limit for this session.</p>
              )}
            </div>

          <div className="flex flex-wrap gap-2 border-t border-neutral-200/80 pt-5">
            <Button type="submit" disabled={isSubmitting || venuesLoading || Boolean(venuesError)} className="rounded-xl">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {isSubmitting ? 'Creating…' : 'Create session'}
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={ADMIN_OPERATIONS_PATHS.eventDetail(event.id)}>Cancel</Link>
            </Button>
          </div>
        </form>
      </DetailPanel>
    </div>
  );
}