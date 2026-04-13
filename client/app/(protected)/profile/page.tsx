'use client';

import Link from 'next/link';
import { CalendarDays, Mail, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getDisplayName, getInitials, getProfileHandle, getRoleLabel, humanizeProfileValue } from '@/lib/auth-user';
import { useAuthStore } from '@/store/auth-store';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium text-balance">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const displayName = getDisplayName(user);
  const initials = getInitials(user);
  const handle = getProfileHandle(user);
  const role = getRoleLabel(user?.roleId);

  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-5">
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex flex-col items-start gap-4">
              <Avatar className="size-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">{initials}</AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold">{displayName}</h1>
                  <Badge variant="secondary">{role}</Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">{handle}</p>
                <p className="mt-3 text-sm leading-6 text-neutral-700">{user?.bio || 'No bio added yet.'}</p>
              </div>

              <div className="grid w-full grid-cols-2 gap-3">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground text-xs">Status</p>
                  <p className="mt-1 text-sm font-semibold">{user?.doneOnboarding ? 'Active' : 'Setup pending'}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-muted-foreground text-xs">Events</p>
                  <p className="mt-1 text-sm font-semibold">0 attended</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Settings shortcuts</CardTitle>
            <CardDescription>Quick access to common account actions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/forgot-password">Change Password</Link>
            </Button>
            <Button variant="outline" className="justify-start" disabled>
              Login History
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Basic account details from the current session.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Mail className="text-muted-foreground size-4" />
                {user?.email || 'No email found'}
              </div>
              <Separator className="my-3" />
              <InfoRow label="Alias" value={user?.alias || 'Not set'} />
              <Separator />
              <InfoRow label="First name" value={user?.firstName || 'Not set'} />
              <Separator />
              <InfoRow label="Last name" value={user?.lastName || 'Not set'} />
              <Separator />
              <InfoRow label="Role" value={role} />
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Profile details</CardTitle>
              <CardDescription>Extra information currently available on the token payload.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm font-medium">
                <UserRound className="text-muted-foreground size-4" />
                {displayName}
              </div>
              <Separator className="my-3" />
              <InfoRow label="Age group" value={humanizeProfileValue(user?.ageGroup)} />
              <Separator />
              <InfoRow label="Gender" value={humanizeProfileValue(user?.gender)} />
              <Separator />
              <InfoRow label="Education" value={humanizeProfileValue(user?.educationLevel)} />
              <Separator />
              <InfoRow label="Occupation" value={user?.occupation || 'Not set'} />
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Attended events</CardTitle>
            <CardDescription>Placeholder section for the member&apos;s event history.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-dashed border-border p-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="text-muted-foreground size-4" />
                  <p className="text-sm font-medium">Recent events</p>
                </div>
                <p className="text-muted-foreground mt-2 text-sm">No events yet.</p>
              </div>
              <div className="rounded-xl border border-dashed border-border p-4">
                <p className="text-sm font-medium">Upcoming activity</p>
                <p className="text-muted-foreground mt-2 text-sm">This area can show registrations and reminders.</p>
              </div>
              <div className="rounded-xl border border-dashed border-border p-4">
                <p className="text-sm font-medium">Participation summary</p>
                <p className="text-muted-foreground mt-2 text-sm">Attendance stats can live here once connected.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
