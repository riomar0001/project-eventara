'use client';

import { useParams } from 'next/navigation';
import { Navbar } from '@/components/navigation/navbar';
import { EventHero } from '@/components/events/event-detail/event-hero';
import { SessionsList } from '@/components/events/event-detail/sessions-list';
import { EventSidebar } from '@/components/events/event-detail/event-sidebar';
import { useEventDetail } from '@/hooks/events/use-event-detail';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { event, sessions, seatsFilled, capacityPct, isFull } = useEventDetail(Number(id));

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-[14px] text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-[1240px] px-6 py-10 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <EventHero event={event} seatsFilled={seatsFilled} capacityPct={capacityPct} isFull={isFull} />
            <SessionsList sessions={sessions} />
          </div>
          <EventSidebar event={event} isFull={isFull} />
        </div>
      </div>
    </div>
  );
}
