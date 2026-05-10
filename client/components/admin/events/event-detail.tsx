import { CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BackLink } from './events-shared';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';

export function EventDetail({ eventId }: { eventId: string }) {
  return (
    <div className="space-y-6">
      <BackLink href={ADMIN_OPERATIONS_PATHS.events} label="Back to events" />

      <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
        <CardContent className="flex min-h-80 flex-col items-center justify-center px-8 py-16 text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-sky-50 ring-1 ring-sky-100">
            <CalendarPlus className="size-6 text-sky-500" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950">Event details are not available yet</h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-neutral-500">
            Event ID {eventId} will render here once the events read endpoint is exposed to the client.
          </p>
          <Button asChild className="mt-6 rounded-xl bg-sky-600 text-white hover:bg-sky-500">
            <Link href={ADMIN_OPERATIONS_PATHS.eventCreate}>Create event</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
