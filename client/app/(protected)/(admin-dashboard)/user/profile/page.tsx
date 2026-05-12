'use client';

import { CalendarDays, Loader2, MapPin, PencilLine } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AccountSettings } from '@/api/sdk.gen';
import type { AttendedEventResponse, UserDetailsData } from '@/api/types.gen';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveStorageImageUrl } from '@/lib/storage/image-url';
import { getDisplayName, getInitials, getProfileHandle, getRoleLabel, humanizeProfileValue } from '@/lib/user/profile';
import { type AuthUser, useAuthStore } from '@/store/auth-store';

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

function mapDetailsToAuthUser(details: UserDetailsData): Partial<AuthUser> {
  return {
    id: details.user_id,
    email: details.email,
    alias: details.alias,
    firstName: details.first_name,
    lastName: details.last_name,
    image: details.image ?? undefined,
    ageGroup: details.age_group,
    gender: details.gender,
    educationLevel: details.education_level,
    occupation: details.occupation ?? undefined,
    bio: details.bio ?? undefined,
    role: details.role ?? undefined,
    doneOnboarding: true
  };
}

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function EventHistoryItem({ event }: { event: AttendedEventResponse }) {
  const bannerUrl = resolveStorageImageUrl(event.event_banner_url);

  return (
    <div className="grid gap-4 border-b py-4 last:border-b-0 md:grid-cols-[96px_minmax(0,1fr)]">
      <div className="h-20 overflow-hidden rounded-lg bg-neutral-100">
        {bannerUrl ? (
          <Image src={bannerUrl} alt={event.event_title} width={96} height={80} unoptimized className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <CalendarDays className="size-5 text-neutral-400" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium text-neutral-900">{event.event_title}</p>
            <p className="text-muted-foreground mt-1 text-sm">{event.session_title}</p>
          </div>
          <Badge variant="secondary">Attended</Badge>
        </div>
        <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" />
            {formatEventDate(event.session_start_datetime)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" />
            Session
          </span>
        </div>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [profileDetails, setProfileDetails] = useState<UserDetailsData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileDetails() {
      setIsLoadingProfile(true);
      setProfileError(null);
      const result = await AccountSettings.getUserDetailsUserProfileGet({
        query: { attended_events_limit: 8 },
        throwOnError: false
      });

      if (cancelled) return;

      if (result.error || !result.data) {
        setProfileError('Unable to load the latest profile details.');
        setIsLoadingProfile(false);
        return;
      }

      setProfileDetails(result.data.data);
      updateUser(mapDetailsToAuthUser(result.data.data));
      setIsLoadingProfile(false);
    }

    loadProfileDetails().catch(() => {
      if (!cancelled) {
        setProfileError('Unable to load the latest profile details.');
        setIsLoadingProfile(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [updateUser]);

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center rounded-xl border border-dashed bg-white p-8 text-center">
        <div className="space-y-2">
          <p className="text-lg font-semibold">No profile data available</p>
          <p className="text-muted-foreground text-sm">Sign in again to reload your profile.</p>
        </div>
      </div>
    );
  }

  const hydratedUser = profileDetails ? { ...user, ...mapDetailsToAuthUser(profileDetails) } : user;
  const displayName = getDisplayName(hydratedUser);
  const initials = getInitials(hydratedUser);
  const handle = getProfileHandle(hydratedUser);
  const roleLabel = getRoleLabel(hydratedUser.role);
  const attendedEvents = profileDetails?.events_attended ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="border-0 bg-linear-to-b from-lime-50 via-neutral-50 to-amber-100/60 shadow-none ring-1 ring-neutral-200">
          <CardContent className="flex h-full flex-col px-6 py-7">
            <div className="flex flex-col items-center text-center">
              <Avatar className="size-32 shadow-sm">
                <AvatarImage src={resolveStorageImageUrl(hydratedUser.image)} alt={displayName} />
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
              <Link href="/user/settings/profile">
                <PencilLine className="size-4" />
                Edit profile
              </Link>
            </Button>

            <div className="mt-6 space-y-3">
              <InfoTile label="Email" value={hydratedUser.email} />
              <InfoTile label="Gender" value={humanizeProfileValue(hydratedUser.gender)} />
              <InfoTile label="Profile status" value={hydratedUser.doneOnboarding ? 'Ready to join events' : 'Complete your setup'} />
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
                  <Link href="/user/settings/profile">
                    Edit
                    <PencilLine className="size-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-x-10 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
                <DetailRow label="First Name" value={hydratedUser.firstName ?? 'Not set'} />
                <DetailRow label="Last Name" value={hydratedUser.lastName ?? 'Not set'} />
                <DetailRow label="Age Group" value={humanizeProfileValue(hydratedUser.ageGroup)} />
                <DetailRow label="Email Address" value={hydratedUser.email} />
                <DetailRow label="Occupation" value={hydratedUser.occupation ?? 'Not set'} />
                <DetailRow label="User Role" value={roleLabel} />
                <DetailRow label="Alias" value={hydratedUser.alias ? `@${hydratedUser.alias}` : 'Not set'} />
                <DetailRow label="Gender" value={humanizeProfileValue(hydratedUser.gender)} />
                <DetailRow label="Education" value={humanizeProfileValue(hydratedUser.educationLevel)} />
              </div>

              <div className="mt-8 rounded-xl bg-neutral-50 px-4 py-3">
                <p className="text-muted-foreground text-xs font-medium tracking-[0.16em] uppercase">Bio</p>
                <p className="mt-2 text-sm leading-6">{hydratedUser.bio?.trim() ? hydratedUser.bio : 'No bio added yet.'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none ring-1 ring-neutral-200">
            <CardHeader>
              <CardTitle className="text-xl font-medium">Events Attended</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">Your recent event attendance history.</p>
            </CardHeader>
            <CardContent>
              {isLoadingProfile ? (
                <div className="flex items-center gap-2 rounded-xl border border-dashed bg-neutral-50 px-5 py-8 text-sm text-neutral-500">
                  <Loader2 className="size-4 animate-spin" />
                  Loading event activity
                </div>
              ) : profileError ? (
                <div className="rounded-xl border border-dashed bg-neutral-50 px-5 py-8 text-sm text-neutral-500">{profileError}</div>
              ) : attendedEvents.length > 0 ? (
                <div className="divide-y">{attendedEvents.map((event) => <EventHistoryItem key={event.participant_id} event={event} />)}</div>
              ) : (
                <div className="rounded-xl border border-dashed bg-neutral-50 px-5 py-8 text-sm text-neutral-500">No attended events yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
