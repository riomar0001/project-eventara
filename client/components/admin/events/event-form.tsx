'use client';

import { useState } from 'react';
import { CalendarPlus2, Save } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BackLink, FieldLabel, PhotoPanel } from './events-shared';
import { ADMIN_OPERATIONS_PATHS, eventRecords, type EventRecord, venueRecords } from '@/constants/admin/operations';

const hostTeamOptions = ['Programming', 'Partnerships', 'Guest Experience', 'Production', 'Registration', 'Donor Relations'];

export function EventForm({ event, mode }: { event?: EventRecord; mode: 'create' | 'edit' }) {
  const [title, setTitle] = useState(event?.title ?? '');
  const [headline, setHeadline] = useState(event?.headline ?? '');
  const [summary, setSummary] = useState(event?.summary ?? '');
  const [dateLabel, setDateLabel] = useState(event?.dateLabel ?? 'November 06, 2026');
  const [priceLabel, setPriceLabel] = useState(event?.priceLabel ?? 'Free RSVP');
  const [registrationLabel, setRegistrationLabel] = useState(event?.registrationLabel ?? '0 / 250 RSVPs');
  const [venueId, setVenueId] = useState(event?.venueId ?? venueRecords[0]?.id ?? '');
  const [status, setStatus] = useState<EventRecord['status']>(event?.status ?? 'Draft');
  const [audience, setAudience] = useState(event?.audience ?? 'Public showcase');
  const [selectedHosts, setSelectedHosts] = useState<string[]>(event?.hostTeam ?? hostTeamOptions.slice(0, 2));
  const previewPhoto = event?.photo ?? eventRecords[0]?.photo ?? '';

  function toggleHost(host: string) {
    setSelectedHosts((current) => (current.includes(host) ? current.filter((item) => item !== host) : [...current, host]));
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
        <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
          <CardHeader className="border-b border-neutral-200/80 pb-5">
            <CardTitle>{mode === 'create' ? 'Add event' : `Edit ${event?.title ?? 'event'}`}</CardTitle>
            <CardDescription>All event form interactions are local to the page for design review and layout testing.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <FieldLabel htmlFor="event-title">Event title</FieldLabel>
                  <Input id="event-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Summer Signal Festival" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <FieldLabel htmlFor="event-headline">Headline</FieldLabel>
                  <Textarea
                    id="event-headline"
                    value={headline}
                    onChange={(event) => setHeadline(event.target.value)}
                    placeholder="A short, photo-friendly line used in hero areas."
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="event-date">Date label</FieldLabel>
                  <Input id="event-date" value={dateLabel} onChange={(event) => setDateLabel(event.target.value)} placeholder="August 18, 2026" />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="event-price">Price label</FieldLabel>
                  <Input id="event-price" value={priceLabel} onChange={(event) => setPriceLabel(event.target.value)} placeholder="From $28" />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="event-registration">Registration label</FieldLabel>
                  <Input
                    id="event-registration"
                    value={registrationLabel}
                    onChange={(event) => setRegistrationLabel(event.target.value)}
                    placeholder="120 / 400 registered"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="event-audience">Audience</FieldLabel>
                  <Input id="event-audience" value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="Public festival" />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="event-venue">Venue</FieldLabel>
                  <Select value={venueId} onValueChange={setVenueId}>
                    <SelectTrigger id="event-venue">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {venueRecords.map((venueOption) => (
                        <SelectItem key={venueOption.id} value={venueOption.id}>
                          {venueOption.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="event-status">Status</FieldLabel>
                  <Select value={status} onValueChange={(value) => setStatus(value as EventRecord['status'])}>
                    <SelectTrigger id="event-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="On Sale">On Sale</SelectItem>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="event-summary">Summary</FieldLabel>
                <Textarea
                  id="event-summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  className="min-h-32"
                  placeholder="Describe the event concept, operational mood, and what makes the format memorable."
                />
              </div>

              <div className="space-y-3">
                <FieldLabel>Host teams</FieldLabel>
                <div className="grid gap-3 md:grid-cols-2">
                  {hostTeamOptions.map((host) => (
                    <label
                      key={host}
                      className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700"
                    >
                      <Checkbox checked={selectedHosts.includes(host)} onCheckedChange={() => toggleHost(host)} />
                      <span>{host}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
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

        <div className="space-y-6">
          <PhotoPanel photo={previewPhoto} className="min-h-70">
            <div className="flex min-h-70 flex-col justify-between p-6">
              <Badge variant="secondary" className="w-fit bg-white/85 text-neutral-900">
                Event preview
              </Badge>
              <div className="space-y-2">
                <p className="text-xs tracking-[0.18em] text-white/75 uppercase">{dateLabel || 'Date label'}</p>
                <h2 className="text-3xl font-semibold tracking-tight text-white">{title || 'Untitled event'}</h2>
                <p className="max-w-xl text-sm leading-6 text-white/85">{headline || 'Your event headline will appear here while you edit the form.'}</p>
              </div>
            </div>
          </PhotoPanel>

          <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
            <CardHeader className="border-b border-neutral-200/80 pb-4">
              <CardTitle>Design notes</CardTitle>
              <CardDescription>A quick reference panel for the mock event surface.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6 text-sm leading-6 text-neutral-600">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <p className="font-medium text-neutral-950">Selected host teams</p>
                <p className="mt-1">{selectedHosts.length > 0 ? selectedHosts.join(', ') : 'No host teams selected yet.'}</p>
              </div>
              <div className="rounded-2xl border border-dashed border-neutral-200 px-4 py-4 text-neutral-500">
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
