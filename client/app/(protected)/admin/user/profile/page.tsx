'use client';

import { CalendarDays, Clock3, MapPin, PencilLine, Ticket } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDisplayName, getInitials, getProfileHandle, getRoleLabel, humanizeProfileValue } from '@/lib/user/profile';
import { useAuthStore } from '@/store/auth-store';

const profileEvents = [
  {
    month: 'APR',
    day: '18',
    title: 'Eventara Venue Expo',
    slot: '10:00 - 13:30',
    location: 'Main Hall',
    status: 'Upcoming',
    fee: '$120'
  },
  {
    month: 'APR',
    day: '24',
    title: 'Community Fundraiser Night',
    slot: '16:30 - 20:00',
    location: 'Riverside Deck',
    status: 'Confirmed',
    fee: '$80'
  },
  {
    month: 'MAY',
    day: '03',
    title: 'Volunteer Orientation',
    slot: '09:30 - 11:00',
    location: 'Studio Room B',
    status: 'Pending',
    fee: 'Free'
  },
  {
    month: 'MAY',
    day: '11',
    title: 'Creative Partner Meetup',
    slot: '18:00 - 21:00',
    location: 'Skyline Lounge',
    status: 'Completed',
    fee: '$50'
  }
] as const;

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-neutral-100 p-2">
      <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-2 text-sm font-medium wrap-break-word text-neutral-900">{value}</p>
    </div>
  );
}

function EventStatusBadge({ status }: { status: (typeof profileEvents)[number]['status'] }) {
  if (status === 'Upcoming') return <Badge className="bg-sky-500 text-white hover:bg-sky-500">{status}</Badge>;
  if (status === 'Confirmed') return <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">{status}</Badge>;
  if (status === 'Pending') return <Badge variant="secondary">{status}</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default function UserProfilePage() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-dashed bg-white p-8 text-center">
        <div className="space-y-2">
          <p className="text-lg font-semibold">No profile data available</p>
          <p className="text-muted-foreground text-sm">Sign in again to reload your profile.</p>
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(user);
  const initials = getInitials(user);
  const handle = getProfileHandle(user);
  const roleLabel = getRoleLabel(user.role);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="border-0 bg-linear-to-b from-lime-50 via-neutral-50 to-amber-100/60 shadow-none ring-1 ring-neutral-200">
          <CardContent className="flex h-full flex-col px-6 py-7">
            <div className="flex flex-col items-center text-center">
              <Avatar className="size-32 shadow-sm">
                <AvatarFallback className="bg-white text-2xl font-semibold">{initials}</AvatarFallback>
              </Avatar>

              <div className="mt-4 space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">{displayName}</h1>
                <p className="text-muted-foreground text-sm">{handle}</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Badge variant="outline">{roleLabel}</Badge>
                </div>
              </div>
            </div>

            <Button asChild className="mt-6 w-full">
              <Link href="/admin/user/settings/profile">
                <PencilLine className="size-4" />
                Edit profile
              </Link>
            </Button>

            <div className="mt-6 space-y-3">
              <InfoTile label="Email" value={user.email} />
              <InfoTile label="Gender" value={humanizeProfileValue(user.gender)} />
              <InfoTile label="Profile status" value={user.doneOnboarding ? 'Ready to join events' : 'Complete your setup'} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-0 shadow-none ring-1 ring-neutral-200">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl font-medium">Personal Information</CardTitle>
                  <p className="text-muted-foreground mt-1 text-sm">Your personal details and profile information.</p>
                </div>
                <Button asChild size="xs" variant="outline">
                  <Link href="/admin/user/settings/profile">
                    Edit
                    <PencilLine className="size-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-x-10 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
                <DetailRow label="First Name" value={user.firstName ?? 'Not set'} />
                <DetailRow label="Last Name" value={user.lastName ?? 'Not set'} />
                <DetailRow label="Age Group" value={humanizeProfileValue(user.ageGroup)} />
                <DetailRow label="Email Address" value={user.email} />
                <DetailRow label="Occupation" value={user.occupation ?? 'Not set'} />
                <DetailRow label="User Role" value={roleLabel} />
                <DetailRow label="Alias" value={user.alias ? `@${user.alias}` : 'Not set'} />
                <DetailRow label="Gender" value={humanizeProfileValue(user.gender)} />
                <DetailRow label="Education" value={humanizeProfileValue(user.educationLevel)} />
              </div>

              <div className="mt-8 rounded-2xl bg-neutral-50 px-4 py-3">
                <p className="text-muted-foreground text-xs font-medium tracking-[0.16em] uppercase">Bio</p>
                <p className="mt-2 text-sm leading-6">{user.bio?.trim() ? user.bio : 'No bio added yet.'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none ring-1 ring-neutral-200">
            <CardHeader className="">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl font-medium">Events</CardTitle>
                  <p className="text-muted-foreground mt-1 text-sm">Recent and upcoming event activity arranged in a client-profile style list.</p>
                </div>
                <Badge variant="outline" className="w-fit gap-1">
                  <Ticket className="size-3" />
                  {profileEvents.length} listed
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-3">
              <div className="space-y-1">
                {profileEvents.map((event, index) => (
                  <div
                    key={`${event.title}-${event.day}`}
                    className="flex flex-col gap-4 rounded-2xl px-2 py-4 transition-colors hover:bg-neutral-50 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-4 sm:w-28 sm:flex-none">
                      <div className="flex size-12.5 flex-col items-center justify-center overflow-hidden rounded-2xl border bg-amber-100 text-center shadow-xs">
                        <div className="text-muted-foreground w-full border-b text-[10px] font-semibold tracking-[0.18em]">{event.month}</div>
                        <div className="h-full w-full bg-white text-lg font-semibold">{event.day}</div>
                      </div>
                      <div className="sm:hidden">
                        <EventStatusBadge status={event.status} />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{event.title}</p>
                          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-xs">
                            <span className="flex items-center gap-1">
                              <Clock3 className="size-3.5" />
                              {event.slot}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3.5" />
                              {event.location}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="hidden sm:block">
                            <EventStatusBadge status={event.status} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {index < profileEvents.length - 1 ? <div className="mt-4 border-t sm:hidden" /> : null}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm">
                  <CalendarDays className="size-4" />
                  View calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

