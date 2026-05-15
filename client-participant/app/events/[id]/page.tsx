'use client';

import { useParams } from 'next/navigation';
import { EventHero } from '@/components/events/event-detail/event-hero';
import { EventSidebar } from '@/components/events/event-detail/event-sidebar';
import { SessionsList } from '@/components/events/event-detail/sessions-list';
import { Navbar } from '@/components/navigation/navbar';
import { useEventDetail } from '@/hooks/events/use-event-detail';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { event, sessions, seatsFilled, capacityPct, isFull } = useEventDetail(Number(id));

  if (!event) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-[14px]">Event not found.</p>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
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
