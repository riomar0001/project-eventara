import { Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BackLink } from './volunteers-shared';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';

export function VolunteerProfile({ volunteerId }: { volunteerId: string }) {
  return (
    <div className="space-y-6">
      <BackLink href={ADMIN_OPERATIONS_PATHS.volunteers} label="Back to volunteers" />

      <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
        <CardContent className="flex min-h-80 flex-col items-center justify-center px-8 py-16 text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
            <Users className="size-6 text-emerald-600" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950">Volunteer details are not available yet</h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-neutral-500">
            Volunteer ID {volunteerId} will render here once the volunteers read endpoint is exposed to the client.
          </p>
          <Button asChild className="mt-6 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500">
            <Link href={ADMIN_OPERATIONS_PATHS.volunteerCreate}>Add volunteer</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
