'use client';

import { PencilLine } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveStorageImageUrl } from '@/lib/storage/image-url';
import { getDisplayName, getInitials, getProfileHandle, getRoleLabel, humanizeProfileValue } from '@/lib/user/profile';
import { useAuthStore } from '@/store/auth-store';

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

export default function UserProfilePage() {
  const user = useAuthStore((state) => state.user);

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
                <AvatarImage src={resolveStorageImageUrl(user.imageFileId)} alt={displayName} />
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

              <div className="mt-8 rounded-xl bg-neutral-50 px-4 py-3">
                <p className="text-muted-foreground text-xs font-medium tracking-[0.16em] uppercase">Bio</p>
                <p className="mt-2 text-sm leading-6">{user.bio?.trim() ? user.bio : 'No bio added yet.'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none ring-1 ring-neutral-200">
            <CardHeader>
              <CardTitle className="text-xl font-medium">Events</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">Event activity will appear here once profile event history is available from the API.</p>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-dashed bg-neutral-50 px-5 py-8 text-sm text-neutral-500">No event activity is available.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
