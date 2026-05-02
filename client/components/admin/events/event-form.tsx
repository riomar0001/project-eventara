'use client';

import { useState } from 'react';
import { CalendarPlus2, Clock, MapPin, Plus, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BackLink, FieldLabel, PhotoPanel } from './events-shared';
import {
  ADMIN_OPERATIONS_PATHS,
  eventDetailRecords,
  getSessionsByEventId,
  venueRecords,
  type EventDbStatus,
  type EventDetailRecord
} from '@/constants/admin/operations';

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: EventDbStatus[] = ['draft', 'posted', 'started', 'cancelled', 'ended', 'postponed'];

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
    venueId: venueId ?? venueRecords[0]?.id ?? '',
    title: '',
    description: '',
    startDatetime: '',
    endDatetime: '',
    maxSlots: ''
  };
}

// ── Component ──────────────────────────────────────────────────────────────────

type EventFormProps = { mode: 'create'; event?: never } | { mode: 'edit'; event: EventDetailRecord };

export function EventForm({ mode, event }: EventFormProps) {
  const existingSessions = mode === 'edit' ? getSessionsByEventId(event.id) : [];

  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [startDate, setStartDate] = useState(event?.startDate ? toLocalInput(event.startDate) : '');
  const [endDate, setEndDate] = useState(event?.endDate ? toLocalInput(event.endDate) : '');
  const [status, setStatus] = useState<EventDbStatus>(event?.status ?? 'draft');
  const [sessions, setSessions] = useState<SessionFormData[]>(() =>
    mode === 'edit' && existingSessions.length > 0
      ? existingSessions.map((s) => ({
          key: s.id,
          venueId: s.venueId,
          title: s.title,
          description: s.description ?? '',
          startDatetime: toLocalInput(s.startDatetime),
          endDatetime: toLocalInput(s.endDatetime),
          maxSlots: s.maxSlots != null ? String(s.maxSlots) : ''
        }))
      : [
          {
            key: 'session-1',
            venueId: venueRecords[0]?.id ?? '',
            title: '',
            description: '',
            startDatetime: '',
            endDatetime: '',
            maxSlots: ''
          }
        ]
  );

  const previewPhoto = event?.photo ?? eventDetailRecords[0]?.photo ?? '';

  function addSession() {
    setSessions((prev) => [...prev, createBlankSession()]);
  }

  function removeSession(index: number) {
    setSessions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSession(index: number, patch: Partial<SessionFormData>) {
    setSessions((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <BackLink href={ADMIN_OPERATIONS_PATHS.events} label="Back to events" />
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs tracking-[0.18em] uppercase">
          UI preview only
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        {/* ── Form column ─────────────────────────────────────────────────────── */}
        <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
          <CardHeader className="border-b border-neutral-200/80 pb-5">
            <CardTitle>{mode === 'create' ? 'Add event' : `Edit ${event.title}`}</CardTitle>
            <CardDescription>Fields map directly to the API schema — drop-in ready when the backend is connected.</CardDescription>
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

                <div className="space-y-2">
                  <FieldLabel htmlFor="event-status">Status</FieldLabel>
                  <Select value={status} onValueChange={(v) => setStatus(v as EventDbStatus)}>
                    <SelectTrigger id="event-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        <Select value={session.venueId} onValueChange={(v) => updateSession(index, { venueId: v })}>
                          <SelectTrigger id={`session-${session.key}-venue`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {venueRecords.map((v) => (
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
                <Button type="submit">
                  <Save className="size-4" />
                  {mode === 'create' ? 'Save event draft' : 'Save event changes'}
                </Button>
                <Button type="button" variant="outline" asChild>
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
                {status}
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
                    const v = venueRecords.find((r) => r.id === s.venueId);
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

          <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
            <CardHeader className="border-b border-neutral-200/80 pb-4">
              <CardTitle>Design notes</CardTitle>
              <CardDescription>Schema mapping reference for the event payload.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6 text-sm leading-6 text-neutral-600">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <p className="font-medium text-neutral-950">API request shape</p>
                <p className="mt-1 font-mono text-xs text-neutral-500">
                  {`{ title, description, start_date, end_date, status, sessions: [{ venue_id, title, description?, start_datetime, end_datetime, max_slots? }] }`}
                </p>
              </div>
              <div className="rounded-xl border border-dashed border-neutral-200 px-4 py-4 text-neutral-500">
                <div className="flex items-center gap-2">
                  <CalendarPlus2 className="size-4" />
                  Scheduling and publishing actions are intentionally left disconnected in this UI pass.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
