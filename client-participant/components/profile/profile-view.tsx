'use client';

import { Calendar, Settings, Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useUserDetails } from '@/hooks/profile/use-user-details';
import { useAttendedEvents, type MyEventRecord } from '@/hooks/profile/use-attended-events';

function EventCard({ event }: { event: MyEventRecord }) {
  const eventDate = new Date(event.event_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const isAttended = event.status === 'attended';

  return (
    <Link
      href={`/events/${event.event_id}`}
      className="group border-border bg-background hover:border-primary flex gap-4 rounded-2xl border p-4 transition-all hover:shadow-sm"
    >
      {event.event_banner_url ? (
        <img src={event.event_banner_url} alt={event.event_title} className="h-16 w-20 shrink-0 rounded-xl object-cover" />
      ) : (
        <div className="bg-primary/10 h-16 w-20 shrink-0 rounded-xl" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-foreground group-hover:text-primary truncate text-sm font-semibold transition-colors">{event.event_title}</p>
          {isAttended ? (
            <span className="text-primary bg-primary/10 shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide uppercase">
              Attended
            </span>
          ) : (
            <span className="text-muted-foreground bg-muted shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide uppercase">
              Registered
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-0.5 truncate font-mono text-[11px]">{event.session_title}</p>
        <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[12px]">
          <Calendar size={11} />
          {eventDate}
        </div>
      </div>
    </Link>
  );
}

export function ProfileView() {
  const user = useAuthStore((s) => s.user);
  const { userDetails, loading } = useUserDetails();
  const { events: attendedEvents, loading: eventsLoading } = useAttendedEvents();

  const firstName = user?.firstName ?? userDetails?.first_name ?? '';
  const lastName = user?.lastName ?? userDetails?.last_name ?? '';
  const alias = user?.alias ?? userDetails?.alias ?? '';
  const email = user?.email ?? userDetails?.email ?? '';
  const occupation = user?.occupation ?? userDetails?.occupation ?? '';
  const ageGroup = (user?.ageGroup ?? userDetails?.age_group ?? '').replace(/_/g, ' ');
  const gender = user?.gender ?? userDetails?.gender ?? '';
  const educationLevel = (user?.educationLevel ?? userDetails?.education_level ?? '').replace(/_/g, ' ');
  const bio = user?.bio ?? userDetails?.bio ?? '';

  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'Participant';

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-4">
        <div className="border-border bg-card rounded-2xl border p-6">
          <div className="flex flex-col items-center text-center">
            {user?.image ? (
              <img src={user.image} alt="Profile" className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <div className="bg-primary/10 text-primary flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold">{initials}</div>
            )}
            <p className="text-foreground mt-3 text-lg font-bold tracking-[-0.02em]">{displayName}</p>
            {alias && <p className="text-muted-foreground text-sm">@{alias}</p>}
            <span className="bg-primary/10 text-primary mt-2 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wider uppercase">
              Participant
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="bg-background rounded-xl p-3 text-center">
              {eventsLoading ? (
                <Loader2 size={16} className="text-muted-foreground mx-auto animate-spin" />
              ) : (
                <p className="text-foreground text-xl font-bold">{attendedEvents.length}</p>
              )}
              <p className="text-muted-foreground mt-0.5 font-mono text-[10px] tracking-wider uppercase">Events</p>
            </div>
            <div className="bg-background rounded-xl p-3 text-center">
              <p className="text-foreground text-[13px] font-semibold capitalize">{ageGroup || '—'}</p>
              <p className="text-muted-foreground mt-0.5 font-mono text-[10px] tracking-wider uppercase">Age group</p>
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
            { label: 'Email', value: email },
            { label: 'Occupation', value: occupation },
            { label: 'Gender', value: gender },
            { label: 'Education', value: educationLevel }
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">{label}</p>
              <p className="text-foreground mt-0.5 text-[13.5px] font-medium capitalize">{value || '—'}</p>
            </div>
          ))}
        </div>

        {bio && (
          <div className="border-border bg-card rounded-2xl border p-5">
            <p className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">Bio</p>
            <p className="text-muted-foreground mt-2 text-[13.5px] leading-relaxed">{bio}</p>
          </div>
        )}

        <div className="border-primary/20 bg-primary/5 rounded-2xl border p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-xl">
              <Users size={15} className="text-primary" />
            </div>
            <p className="text-foreground text-[13.5px] font-semibold">Volunteer Programme</p>
          </div>
          <p className="text-muted-foreground text-[12.5px] leading-relaxed">
            Join the Eventara volunteer team and help shape memorable events for the Davao tech community.
          </p>
          <Link
            href="/volunteer"
            className="bg-primary text-primary-foreground mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold shadow-[0_6px_18px_-6px_var(--lime-glow)] transition-all hover:-translate-y-0.5"
          >
            Apply to volunteer
          </Link>
          <Link
            href="/volunteer"
            className="text-primary mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 text-[12px] font-medium transition-all hover:underline"
          >
            Learn more →
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-border bg-card rounded-2xl border p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">Events attended</p>
              <p className="text-foreground mt-1 text-xl font-bold tracking-[-0.02em]">
                {eventsLoading ? '…' : `${attendedEvents.length} event${attendedEvents.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <Link
              href="/events"
              className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-[13px] font-semibold shadow-[0_6px_20px_-8px_var(--lime-glow)] transition-all hover:-translate-y-0.5"
            >
              Explore events
            </Link>
          </div>

          {eventsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="text-muted-foreground animate-spin" />
            </div>
          ) : attendedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-primary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-2xl">
                <Calendar size={22} className="text-primary" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">No events attended yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendedEvents.map((ev) => (
                <EventCard key={ev.participant_id} event={ev} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
