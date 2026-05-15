'use client';

import { Calendar, MapPin, Settings, Users } from 'lucide-react';
import Link from 'next/link';

type AttendedEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  sessionCount: number;
};

const MOCK_EVENTS: AttendedEvent[] = [
  { id: '1', title: 'Web3 Manila Summit 2024', date: 'Nov 12, 2024', location: 'SMX Convention Center, Pasay', sessionCount: 4 },
  { id: '2', title: 'PH Tech Founders Forum', date: 'Sep 28, 2024', location: 'One Ayala, Makati', sessionCount: 2 },
  { id: '3', title: 'AI & Society: Open Forum', date: 'Jul 5, 2024', location: 'UP Ayala Technohub, QC', sessionCount: 3 }
];

const MOCK_USER = {
  firstName: 'Alex',
  lastName: 'Rivera',
  alias: 'alex_dfi',
  occupation: 'Smart Contract Developer',
  email: 'alex@example.com',
  gender: 'Prefer not to say',
  ageGroup: '25–34',
  education: "Bachelor's",
  bio: 'Building the decentralized future, one contract at a time.',
  tier: 'Participant',
  eventsAttended: 3,
  joinedDate: 'January 2024'
};

function EventCard({ event }: { event: AttendedEvent }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group border-border bg-background hover:border-primary flex gap-4 rounded-2xl border p-4 transition-all hover:shadow-sm"
    >
      <div className="bg-primary/10 h-16 w-20 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-foreground group-hover:text-primary truncate text-sm font-semibold transition-colors">{event.title}</p>
        <div className="text-muted-foreground mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {event.date}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            {event.location}
          </span>
          <span className="flex items-center gap-1">
            <Users size={11} />
            {event.sessionCount} {event.sessionCount === 1 ? 'session' : 'sessions'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProfileView() {
  const u = MOCK_USER;
  const initials = `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-4">
        <div className="border-border bg-card rounded-2xl border p-6">
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 text-primary flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold">{initials}</div>
            <p className="text-foreground mt-3 text-lg font-bold tracking-[-0.02em]">
              {u.firstName} {u.lastName}
            </p>
            <p className="text-muted-foreground text-sm">@{u.alias}</p>
            <span className="bg-primary/10 text-primary mt-2 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wider uppercase">
              {u.tier}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="bg-background rounded-xl p-3 text-center">
              <p className="text-foreground text-xl font-bold">{u.eventsAttended}</p>
              <p className="text-muted-foreground mt-0.5 font-mono text-[10px] tracking-wider uppercase">Events</p>
            </div>
            <div className="bg-background rounded-xl p-3 text-center">
              <p className="text-foreground text-[13px] font-semibold">{u.joinedDate}</p>
              <p className="text-muted-foreground mt-0.5 font-mono text-[10px] tracking-wider uppercase">Joined</p>
            </div>
          </div>

          <Link
            href="/profile/settings/profile"
            className="border-border text-muted-foreground hover:border-muted-foreground hover:bg-muted/50 mt-4 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-all"
          >
            <Settings size={13} />
            Edit profile
          </Link>
        </div>

        <div className="border-border bg-card space-y-3 rounded-2xl border p-5">
          {[
            { label: 'Email', value: u.email },
            { label: 'Occupation', value: u.occupation },
            { label: 'Age group', value: u.ageGroup },
            { label: 'Gender', value: u.gender },
            { label: 'Education', value: u.education }
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">{label}</p>
              <p className="text-foreground mt-0.5 text-[13.5px] font-medium">{value || '—'}</p>
            </div>
          ))}
        </div>

        {u.bio && (
          <div className="border-border bg-card rounded-2xl border p-5">
            <p className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">Bio</p>
            <p className="text-muted-foreground mt-2 text-[13.5px] leading-relaxed">{u.bio}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="border-border bg-card rounded-2xl border p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">Events attended</p>
              <p className="text-foreground mt-1 text-xl font-bold tracking-[-0.02em]">{MOCK_EVENTS.length} events</p>
            </div>
            <Link
              href="/events"
              className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-[13px] font-semibold shadow-[0_6px_20px_-8px_var(--lime-glow)] transition-all hover:-translate-y-0.5"
            >
              Explore events
            </Link>
          </div>

          {MOCK_EVENTS.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-primary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-2xl">
                <Calendar size={22} className="text-primary" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">No events attended yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {MOCK_EVENTS.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
