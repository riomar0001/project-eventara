import { CalendarDays, PencilLine, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ADMIN_OPERATIONS_PATHS, getEventById, getVolunteerById, getVolunteerInitials } from '@/constants/admin/operations';
import { BackLink, DetailList } from './volunteers-shared';

export function VolunteerProfile({ volunteerId }: { volunteerId: string }) {
  const volunteer = getVolunteerById(volunteerId);

  if (!volunteer) {
    notFound();
  }

  const assignedEvents = volunteer.assignedEventIds.map((eventId) => getEventById(eventId)).filter((event) => event !== null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <BackLink href={ADMIN_OPERATIONS_PATHS.volunteers} label="Back to volunteers" />
        <Button asChild variant="outline" size="sm">
          <Link href={ADMIN_OPERATIONS_PATHS.volunteerEdit(volunteer.id)}>
            <PencilLine className="size-4" />
            Edit volunteer
          </Link>
        </Button>
      </div>

      <Card className="border-0 bg-linear-to-br from-emerald-50 via-white to-lime-50 shadow-none ring-1 ring-neutral-200">
        <CardContent className="py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="size-20">
                <AvatarImage src={volunteer.photo} alt={volunteer.name} />
                <AvatarFallback>{getVolunteerInitials(volunteer.name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                    {volunteer.status}
                  </Badge>
                  <Badge variant="secondary" className="bg-white text-neutral-700">
                    {volunteer.availability}
                  </Badge>
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">{volunteer.name}</h1>
                  <p className="text-sm text-neutral-500">
                    {volunteer.primaryRole} • {volunteer.city}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
                <p className="text-xs tracking-[0.16em] text-neutral-500 uppercase">Hours</p>
                <p className="mt-2 text-2xl font-semibold text-neutral-950">{volunteer.hoursContributed}</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
                <p className="text-xs tracking-[0.16em] text-neutral-500 uppercase">Assigned events</p>
                <p className="mt-2 text-2xl font-semibold text-neutral-950">{assignedEvents.length}</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
                <p className="text-xs tracking-[0.16em] text-neutral-500 uppercase">Joined</p>
                <p className="mt-2 text-lg font-semibold text-neutral-950">{volunteer.joinedOn}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
          <CardHeader className="border-b border-neutral-200/80 pb-4">
            <CardTitle>Volunteer profile</CardTitle>
            <CardDescription>Core information for the volunteer record page.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <DetailList
              items={[
                { label: 'Email', value: volunteer.email },
                { label: 'Phone', value: volunteer.phone },
                { label: 'Primary role', value: volunteer.primaryRole },
                { label: 'Shift preference', value: volunteer.shiftPreference },
                { label: 'Availability', value: volunteer.availability },
                { label: 'City', value: volunteer.city }
              ]}
            />
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
          <CardHeader className="border-b border-neutral-200/80 pb-4">
            <CardTitle>Bio</CardTitle>
            <CardDescription>Short narrative summary used on the volunteer profile page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm leading-7 text-neutral-600">{volunteer.bio}</p>
            <div className="flex flex-wrap gap-2">
              {volunteer.skills.map((skill) => (
                <Badge key={skill} variant="outline" className="rounded-full px-3 py-1 text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
        <CardHeader className="border-b border-neutral-200/80 pb-4">
          <CardTitle>Assigned events</CardTitle>
          <CardDescription>Events linked to this volunteer in the shared preview data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          {assignedEvents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-neutral-200 px-5 py-8 text-sm text-neutral-500">
              This volunteer does not have a sample event assignment yet.
            </div>
          ) : (
            assignedEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium text-neutral-950">{event.title}</p>
                  <p className="text-sm text-neutral-500">{event.dateLabel}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-white text-neutral-700">
                    {event.status}
                  </Badge>
                  <Button asChild variant="outline" size="sm">
                    <Link href={ADMIN_OPERATIONS_PATHS.eventDetail(event.id)}>
                      <CalendarDays className="size-4" />
                      View event
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
        <CardContent className="flex items-center gap-3 py-6">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="font-medium text-neutral-950">UI-only profile flow</p>
            <p className="text-sm text-neutral-500">This page is built for design review and navigation testing before volunteer APIs are wired in.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

