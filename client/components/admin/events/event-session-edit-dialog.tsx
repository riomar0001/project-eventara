'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useVenues } from '@/hooks/admin/venues/use-venues';
import { DetailPanel, FieldLabel } from './events-shared';
import { Events } from '@/api/sdk.gen';
import type { EventRecordResponse, EventSessionRecordResponse } from '@/api/types.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

type EventSessionEditDialogProps = {
  event: EventRecordResponse;
  session: EventSessionRecordResponse;
  onClose: () => void;
  onUpdated?: () => void;
};

function toLocalInput(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EventSessionEditDialog({ event, session, onClose, onUpdated }: EventSessionEditDialogProps) {
  const { venues, isLoading: venuesLoading, error: venuesError } = useVenues({ isPartner: true });
  const sortedVenues = useMemo(() => [...venues].sort((a, b) => a.name.localeCompare(b.name)), [venues]);

  const [venueId, setVenueId] = useState(session.venue_id);
  const [title, setTitle] = useState(session.title);
  const [description, setDescription] = useState(session.description ?? '');
  const [startDatetime, setStartDatetime] = useState(() => toLocalInput(session.start_datetime));
  const [endDatetime, setEndDatetime] = useState(() => toLocalInput(session.end_datetime));
  const [maxSlots, setMaxSlots] = useState(session.max_slots !== null ? String(session.max_slots) : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedVenue = useMemo(() => sortedVenues.find((venue) => venue.id === venueId) ?? null, [sortedVenues, venueId]);
  const eventStart = new Date(event.start_date);
  const eventEnd = new Date(event.end_date);
  const maxSlotsValue = maxSlots.trim() ? Number(maxSlots) : null;

  function validate() {
    if (!venueId) return 'Venue is required.';
    if (title.trim().length < 5) return 'Session title must be at least 5 characters.';
    if (!startDatetime) return 'Start datetime is required.';
    if (!endDatetime) return 'End datetime is required.';
    if (Number.isNaN(new Date(startDatetime).getTime()) || Number.isNaN(new Date(endDatetime).getTime())) return 'Please pick valid session datetimes.';

    const start = new Date(startDatetime);
    const end = new Date(endDatetime);
    if (start >= end) return 'Start datetime must be before end datetime.';
    if (start < eventStart) return 'Session start must stay within the event window.';
    if (end > eventEnd) return 'Session end must stay within the event window.';
    if (maxSlotsValue !== null && (!Number.isInteger(maxSlotsValue) || maxSlotsValue <= 0)) return 'Max slots must be a positive whole number.';
    if (selectedVenue && maxSlotsValue !== null && maxSlotsValue > selectedVenue.capacity) {
      return `Max slots cannot exceed ${selectedVenue.name}'s capacity of ${selectedVenue.capacity.toLocaleString()}.`;
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await Events.updateEventSessionEventsEventIdSessionSessionIdPatch({
        path: { event_id: event.id, session_id: session.id },
        body: {
          venue_id: venueId,
          title: title.trim(),
          description: description.trim() || null,
          start_datetime: new Date(startDatetime).toISOString(),
          end_datetime: new Date(endDatetime).toISOString(),
          max_slots: maxSlotsValue ?? selectedVenue?.capacity ?? null
        },
        headers: getAuthHeaders(),
        throwOnError: false
      });

      if (!result.data) throw result.error ?? new Error('Unable to update session right now.');

      toast.success(result.data.message ?? 'Event session updated successfully.');
      onUpdated?.();
      onClose();
    } catch (submitError) {
      toast.error(getApiErrorMessage(submitError, 'Unable to update session right now.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog defaultOpen onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-hidden border-0 bg-white p-0 shadow-2xl sm:max-w-6xl">
        <div className="max-h-[92vh] overflow-y-auto">
          <DialogHeader className="border-b border-neutral-200/80 px-6 pt-6 pb-4">
            <DialogTitle className="text-xl tracking-tight text-neutral-950">Update event session</DialogTitle>
            <DialogDescription className="max-w-2xl text-sm leading-6">
              Update {session.title}. The session schedule must stay inside the event date range.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-6">
            {venuesError && (
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-700">
                <AlertCircle className="size-4 shrink-0" />
                {venuesError}
              </div>
            )}

            <DetailPanel title="Session details" description="Edit the venue, schedule, title, and capacity for this session.">
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <FieldLabel htmlFor="edit-session-venue">Venue *</FieldLabel>
                  <Select value={venueId} onValueChange={setVenueId} disabled={venuesLoading || Boolean(venuesError) || isSubmitting}>
                    <SelectTrigger id="edit-session-venue">
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
                    <p className="text-xs text-neutral-500">Selected venue capacity: {selectedVenue.capacity.toLocaleString()} guests.</p>
                  ) : (
                    <p className="text-xs text-neutral-400">Choose the venue that should host this session.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="edit-session-title">Session title *</FieldLabel>
                  <Input
                    id="edit-session-title"
                    value={title}
                    onChange={(inputEvent) => setTitle(inputEvent.target.value)}
                    placeholder="Opening forum, keynote, workshop, and more"
                    maxLength={255}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="edit-session-description">Session description</FieldLabel>
                  <Textarea
                    id="edit-session-description"
                    value={description}
                    onChange={(inputEvent) => setDescription(inputEvent.target.value)}
                    placeholder="Add a short operational or program note for this session."
                    className="min-h-24"
                    maxLength={5000}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel htmlFor="edit-session-start">Start datetime *</FieldLabel>
                    <DateTimePicker
                      id="edit-session-start"
                      value={startDatetime}
                      onChange={setStartDatetime}
                      minDatetime={eventStart}
                      maxDatetime={eventEnd}
                      disabled={isSubmitting}
                      placeholder="Pick session start"
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel htmlFor="edit-session-end">End datetime *</FieldLabel>
                    <DateTimePicker
                      id="edit-session-end"
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
                  <FieldLabel htmlFor="edit-session-max-slots">Max slots</FieldLabel>
                  <Input
                    id="edit-session-max-slots"
                    type="number"
                    min="1"
                    value={maxSlots}
                    onChange={(inputEvent) => setMaxSlots(inputEvent.target.value)}
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

                <DialogFooter className="border-t border-neutral-200/80 pt-5">
                  <Button type="submit" disabled={isSubmitting || venuesLoading || Boolean(venuesError)} className="rounded-xl">
                    {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    {isSubmitting ? 'Saving…' : 'Save changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                    Cancel
                  </Button>
                </DialogFooter>
              </form>
            </DetailPanel>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
