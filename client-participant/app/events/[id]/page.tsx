'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EventHero } from '@/components/events/event-detail/event-hero';
import { EventSidebar } from '@/components/events/event-detail/event-sidebar';
import { SessionsList } from '@/components/events/event-detail/sessions-list';
import { FeedbackModal } from '@/components/modals/feedback-modal';
import { Navbar } from '@/components/navigation/navbar';
import { Footer } from '@/components/footer/footer';
import { useEventDetail } from '@/hooks/events/use-event-detail';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { event, loading, error, totalSlots, seatsFilled, capacityPct, isFull } = useEventDetail(id);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-[1240px] px-6 py-10 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <div className="bg-card animate-pulse rounded-2xl" style={{ minHeight: 300 }} />
              <div className="bg-card animate-pulse rounded-2xl" style={{ minHeight: 200 }} />
            </div>
            <div className="space-y-4">
              <div className="bg-card animate-pulse rounded-2xl" style={{ minHeight: 180 }} />
              <div className="bg-card animate-pulse rounded-2xl" style={{ minHeight: 160 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground text-[14px]">{error ?? 'Event not found.'}</p>
          <Link href="/events" className="text-primary hover:underline inline-flex items-center gap-1.5 text-[13px]">
            <ArrowLeft size={14} /> Back to events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-[1240px] px-6 py-10 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <EventHero event={event} />
            <SessionsList sessions={event.sessions} eventId={event.id} />
          </div>
          <EventSidebar
            event={event}
            totalSlots={totalSlots}
            isFull={isFull}
            onFeedbackClick={() => setFeedbackOpen(true)}
          />
        </div>
      </div>
      <Footer />

      <FeedbackModal
        eventId={id}
        eventTitle={event.title}
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </div>
  );
}
