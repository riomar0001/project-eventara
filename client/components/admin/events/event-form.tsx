'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, MapPin, Plus, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Events, Venues } from '@/api/sdk.gen';
import { getAccessToken } from '@/store/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ui/image-upload';
import { useUpload } from '@/hooks/use-upload';
import { BackLink, FieldLabel, PhotoPanel } from './events-shared';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';
import { resolveStorageImageUrl } from '@/lib/storage/image-url';

// ── API helpers ────────────────────────────────────────────────────────────────

function extractApiError(payload: unknown): string | undefined {
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

function getApiError(error: unknown, fallback: string): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const d = (error as { response?: { data?: unknown } }).response?.data;
    const msg = extractApiError(d) ?? extractApiError(error);
    if (msg) return msg;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function toLocalInput(iso: string) {
  return iso.slice(0, 16); // "2026-07-18T16:30:00+08:00" → "2026-07-18T16:30"
}

function formatLocalDate(local: string) {
  if (!local) return '';
  try {
    return new Date(local).toLocaleDateString('en-PH', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return local;
  }
}

function formatLocalTime(local: string) {
  if (!local) return '';
  try {
    return new Date(local).toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return local;
  }
}

// ── Session form state ─────────────────────────────────────────────────────────

type SessionFormData = {
  key: string;
  existingId?: string;
  venueId: string;
  title: string;
  description: string;
  startDatetime: string;
  endDatetime: string;
  maxSlots: string;
};

let nextKey = 0;
function nextSessionKey(): string {
  nextKey += 1;
  return `session-${nextKey}`;
}

function createBlankSession(venueId?: string): SessionFormData {
  return {
    key: nextSessionKey(),
    venueId: venueId ?? '',
    title: '',
    description: '',
    startDatetime: '',
    endDatetime: '',
    maxSlots: ''
  };
}

// ── Component ──────────────────────────────────────────────────────────────────

type EventDetailRecord = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  photo?: string | null;
  status: 'draft' | 'posted' | 'started' | 'cancelled' | 'ended' | 'postponed';
};

type ExistingEventSession = {
  id: string;
  venueId: string;
  title: string;
  description?: string | null;
  startDatetime: string;
  endDatetime: string;
  maxSlots?: number | null;
};

type EventFormProps = { mode: 'create'; event?: never } | { mode: 'edit'; event: EventDetailRecord };
type EventWithBanner = EventDetailRecord & { banner_url?: string | null };

export function EventForm({ mode, event }: EventFormProps) {
  const router = useRouter();
  const { upload, isUploading: isUploadingBanner } = useUpload();
  const existingSessions: ExistingEventSession[] = [];

  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [bannerUrl, setBannerUrl] = useState(mode === 'edit' ? ((event as EventWithBanner).banner_url ?? event.photo ?? '') : '');
  const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState(event?.startDate ? toLocalInput(event.startDate) : '');
  const [endDate, setEndDate] = useState(event?.endDate ? toLocalInput(event.endDate) : '');
  const [sessions, setSessions] = useState<SessionFormData[]>(() =>
    mode === 'edit' && existingSessions.length > 0
      ? existingSessions.map((s) => ({
          key: s.id,
          existingId: s.id,
          venueId: s.venueId,
          title: s.title,
          description: s.description ?? '',
          startDatetime: toLocalInput(s.startDatetime),
          endDatetime: toLocalInput(s.endDatetime),
          maxSlots: s.maxSlots != null ? String(s.maxSlots) : ''
        }))
      : [{ key: 'session-1', venueId: '', title: '', description: '', startDatetime: '', endDatetime: '', maxSlots: '' }]
  );
  const [removedSessionIds, setRemovedSessionIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [venues, setVenues] = useState<{ id: string; name: string }[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadVenues() {
      try {
        const result = await Venues.listVenuesVenuesGet({
          query: { page_size: 100 },
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          throwOnError: false
        });
        if (result.data && !cancelled) setVenues(result.data.data.map((v) => ({ id: v.id, name: v.name })));
      } catch {
        // leave empty — venue IDs can still be typed manually if needed
      } finally {
        if (!cancelled) setVenuesLoading(false);
      }
    }
    void loadVenues();
    return () => {
      cancelled = true;
    };
  }, []);

  const previewPhoto = resolveStorageImageUrl(bannerUrl) || event?.photo || '';

  function addSession() {
    setSessions((prev) => [...prev, createBlankSession()]);
  }

  function removeSession(index: number) {
    const session = sessions[index];
    if (session?.existingId) {
      setRemovedSessionIds((prev) => [...prev, session.existingId!]);
    }
    setSessions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSession(index: number, patch: Partial<SessionFormData>) {
    setSessions((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function validate(): string | null {
    if (!title.trim()) return 'Event title is required.';
    if (!description.trim()) return 'Event description is required.';
    if (!startDate) return 'Start date is required.';
    if (!endDate) return 'End date is required.';
    if (new Date(startDate) >= new Date(endDate)) return 'Start date must be before end date.';
    if (sessions.length === 0) return 'At least one session is required.';
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      if (!s.title.trim()) return `Session ${i + 1}: title is required.`;
      if (!s.venueId) return `Session ${i + 1}: venue is required.`;
      if (!s.startDatetime) return `Session ${i + 1}: start datetime is required.`;
      if (!s.endDatetime) return `Session ${i + 1}: end datetime is required.`;
      if (new Date(s.startDatetime) >= new Date(s.endDatetime)) return `Session ${i + 1}: start must be before end.`;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent, targetStatus: 'draft' | 'posted') {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);

    const sessionPayload = sessions.map((s) => ({
      existingId: s.existingId,
      venueId: s.venueId,
      title: s.title.trim(),
      description: s.description.trim(),
      startDatetime: s.startDatetime,
      endDatetime: s.endDatetime,
      maxSlots: s.maxSlots
    }));

    try {
      if (mode === 'create') {
        const result = await Events.createEventEventsPost({
          body: {
            title: title.trim(),
            description: description.trim(),
            start_date: startDate,
            end_date: endDate,
            banner_url: pendingBannerFile ? null : bannerUrl || null,
            sessions: sessionPayload.map((s) => ({
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

        if (pendingBannerFile) {
          const uploadedBanner = await upload(pendingBannerFile, 'event-cover-banner', { eventId });
          setBannerUrl(uploadedBanner.publicUrl);
          setPendingBannerFile(null);
        }

        if (targetStatus === 'posted') {
          const statusResult = await Events.updateEventStatusEventsEventIdStatusPatch({
            path: { event_id: eventId },
            body: { new_status: 'posted' },
            headers: { Authorization: `Bearer ${getAccessToken()}` },
            throwOnError: false
          });
          toast.success(statusResult.data ? (statusResult.data.message ?? 'Event published.') : 'Event saved as draft.');
        } else {
          toast.success(result.data.message ?? 'Event saved as draft.');
        }

        router.push(ADMIN_OPERATIONS_PATHS.eventDetail(eventId));
      } else {
        const eventId = event.id;

        const metaResult = await Events.updateEventMetadataEventsEventIdPatch({
          path: { event_id: eventId },
          body: { title: title.trim(), description: description.trim(), start_date: startDate, end_date: endDate, banner_url: bannerUrl || null },
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          throwOnError: false
        });

        if (!metaResult.data) throw metaResult.error ?? new Error('Unable to update event right now.');

        await Promise.allSettled(
          removedSessionIds.map((sid) =>
            Events.deleteEventSessionEventsEventIdSessionSessionIdDelete({
              path: { event_id: eventId, session_id: sid },
              headers: { Authorization: `Bearer ${getAccessToken()}` },
              throwOnError: false
            })
          )
        );

        await Promise.allSettled(
          sessionPayload
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

        const newCount = sessionPayload.filter((s) => !s.existingId).length;
        if (newCount > 0) {
          toast.warning(`${newCount} new session(s) were not saved — adding sessions to an existing event is not yet supported.`);
        }

        if (targetStatus === 'posted' && event.status === 'draft') {
          await Events.updateEventStatusEventsEventIdStatusPatch({
            path: { event_id: eventId },
            body: { new_status: 'posted' },
            headers: { Authorization: `Bearer ${getAccessToken()}` },
            throwOnError: false
          });
          toast.success('Event updated and published.');
        } else {
          toast.success(metaResult.data.message ?? 'Event updated successfully.');
        }

        router.push(ADMIN_OPERATIONS_PATHS.eventDetail(eventId));
      }
    } catch (err) {
      toast.error(getApiError(err, mode === 'create' ? 'Unable to create event right now.' : 'Unable to update event right now.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePost(e: React.FormEvent) {
    void handleSubmit(e, 'posted');
  }

  function handleSaveDraft(e: React.FormEvent) {
    void handleSubmit(e, 'draft');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <BackLink href={ADMIN_OPERATIONS_PATHS.events} label="Back to events" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        {/* ── Form column ─────────────────────────────────────────────────────── */}
        <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
          <CardHeader className="border-b border-neutral-200/80 pb-5">
            <CardTitle>{mode === 'create' ? 'Add event' : `Edit ${event.title}`}</CardTitle>
            <CardDescription>
              {mode === 'create' ? 'Fill in the event details and sessions below.' : 'Update the event details and sessions below.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              {/* ── Core fields ────────────────────────────────────────────────── */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <FieldLabel htmlFor="event-title">Title *</FieldLabel>
                  <Input id="event-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summer Signal Festival" maxLength={255} />
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="event-description">Description *</FieldLabel>
                  <Textarea
                    id="event-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-32"
                    placeholder="Describe the event, its format, and what makes it unique."
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>Event banner</FieldLabel>
                  <ImageUpload
                    value={bannerUrl}
                    onChange={setBannerUrl}
                    resourceType="event-cover-banner"
                    resourceId={mode === 'edit' ? event.id : undefined}
                    deferUpload={mode === 'create'}
                    onFileSelected={setPendingBannerFile}
                    disabled={isSubmitting || isUploadingBanner}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel htmlFor="event-start-date">Start date *</FieldLabel>
                    <Input id="event-start-date" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel htmlFor="event-end-date">End date *</FieldLabel>
                    <Input id="event-end-date" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* ── Sessions sub-form ─────────────────────────────────────────── */}
              <div className="space-y-4 border-t border-neutral-200/80 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-950">Sessions</h3>
                    <p className="text-sm text-neutral-500">At least one session is required. Each session links to a venue and time slot.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addSession}>
                    <Plus className="size-4" />
                    Add session
                  </Button>
                </div>

                {sessions.length === 0 && (
                  <div className="rounded-xl border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-400">
                    No sessions added. Click &ldquo;Add session&rdquo; to create one.
                  </div>
                )}

                {sessions.map((session, index) => (
                  <div key={session.key} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-[0.16em] text-neutral-400 uppercase">Session {index + 1}</span>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeSession(index)} className="text-neutral-400 hover:text-red-600">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <FieldLabel htmlFor={`session-${session.key}-title`}>Session title *</FieldLabel>
                        <Input
                          id={`session-${session.key}-title`}
                          value={session.title}
                          onChange={(e) => updateSession(index, { title: e.target.value })}
                          placeholder="Opening Ceremony & Keynote"
                          maxLength={255}
                        />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <FieldLabel htmlFor={`session-${session.key}-desc`}>Session description</FieldLabel>
                        <Input
                          id={`session-${session.key}-desc`}
                          value={session.description}
                          onChange={(e) => updateSession(index, { description: e.target.value })}
                          placeholder="Brief description (optional)"
                        />
                      </div>

                      <div className="space-y-2">
                        <FieldLabel htmlFor={`session-${session.key}-venue`}>Venue *</FieldLabel>
                        <Select value={session.venueId} onValueChange={(v) => updateSession(index, { venueId: v })} disabled={venuesLoading}>
                          <SelectTrigger id={`session-${session.key}-venue`}>
                            <SelectValue placeholder={venuesLoading ? 'Loading venues…' : 'Select a venue'} />
                          </SelectTrigger>
                          <SelectContent>
                            {venues.map((v) => (
                              <SelectItem key={v.id} value={v.id}>
                                {v.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <FieldLabel htmlFor={`session-${session.key}-slots`}>Max slots</FieldLabel>
                        <Input
                          id={`session-${session.key}-slots`}
                          type="number"
                          value={session.maxSlots}
                          onChange={(e) => updateSession(index, { maxSlots: e.target.value })}
                          placeholder="e.g. 250"
                        />
                      </div>

                      <div className="space-y-2">
                        <FieldLabel htmlFor={`session-${session.key}-start`}>Start datetime *</FieldLabel>
                        <Input
                          id={`session-${session.key}-start`}
                          type="datetime-local"
                          value={session.startDatetime}
                          onChange={(e) => updateSession(index, { startDatetime: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <FieldLabel htmlFor={`session-${session.key}-end`}>End datetime *</FieldLabel>
                        <Input
                          id={`session-${session.key}-end`}
                          type="datetime-local"
                          value={session.endDatetime}
                          onChange={(e) => updateSession(index, { endDatetime: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Submit ─────────────────────────────────────────────────────── */}
              <div className="flex flex-wrap gap-2 border-t border-neutral-200/80 pt-6">
                <Button type="submit" onClick={handlePost} disabled={isSubmitting || isUploadingBanner}>
                  <Send className="size-4" />
                  {isSubmitting || isUploadingBanner ? 'Saving…' : 'Post'}
                </Button>
                <Button type="submit" variant="outline" onClick={handleSaveDraft} disabled={isSubmitting || isUploadingBanner}>
                  {isSubmitting || isUploadingBanner ? 'Saving…' : 'Save as Draft'}
                </Button>
                <Button type="button" variant="ghost" asChild disabled={isSubmitting}>
                  <Link href={ADMIN_OPERATIONS_PATHS.events}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── Preview column ──────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <PhotoPanel photo={previewPhoto} className="min-h-70">
            <div className="flex min-h-70 flex-col justify-between p-6">
              <Badge variant="secondary" className="w-fit bg-white/85 text-neutral-900 capitalize">
                {mode === 'edit' ? event.status : 'New'}
              </Badge>
              <div className="space-y-2">
                <p className="text-xs tracking-[0.18em] text-white/75 uppercase">
                  {startDate ? formatLocalDate(startDate) : 'Start date'} {endDate && startDate ? '·' : ''} {endDate ? formatLocalDate(endDate) : ''}
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-white">{title || 'Untitled event'}</h2>
                <p className="line-clamp-2 max-w-xl text-sm leading-6 text-white/85">
                  {description || 'Your event description will appear here while you edit the form.'}
                </p>
              </div>
            </div>
          </PhotoPanel>

          <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
            <CardHeader className="border-b border-neutral-200/80 pb-4">
              <CardTitle>Sessions preview</CardTitle>
              <CardDescription>
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} configured
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions.map((s) => {
                    const v = venues.find((r) => r.id === s.venueId);
                    return (
                      <div key={s.key} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                        <p className="text-sm font-medium text-neutral-950">{s.title || 'Untitled session'}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                          {v && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3" />
                              {v.name}
                            </span>
                          )}
                          {s.startDatetime && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3" />
                              {formatLocalDate(s.startDatetime)} {formatLocalTime(s.startDatetime)}
                            </span>
                          )}
                          {s.maxSlots && <span>{s.maxSlots} seats</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-neutral-400">No sessions added yet.</p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
