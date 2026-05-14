'use client';

import { useParams } from 'next/navigation';
import { Navbar } from '@/components/navigation/navbar';
import { FeedbackForm } from '@/components/events/feedback/feedback-form';
import { ALL_EVENTS } from '@/constants/events-directory';

export default function EventFeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const event = ALL_EVENTS.find((e) => e.id === Number(id));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-[560px] px-5 py-12">
        <FeedbackForm eventId={Number(id)} eventTitle={event?.title ?? 'Event'} />
      </div>
    </div>
  );
}
