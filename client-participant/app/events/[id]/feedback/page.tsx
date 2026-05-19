'use client';

import { useParams } from 'next/navigation';
import { FeedbackForm } from '@/components/events/feedback/feedback-form';
import { Navbar } from '@/components/navigation/navbar';
import { ALL_EVENTS } from '@/constants/events-directory';

export default function EventFeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const event = ALL_EVENTS.find((e) => e.id === id);

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-[560px] px-5 py-12">
        <FeedbackForm eventId={id} eventTitle={event?.title ?? 'Event'} />
      </div>
    </div>
  );
}
