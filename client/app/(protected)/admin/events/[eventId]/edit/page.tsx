import { notFound } from 'next/navigation';
import { EventForm } from '@/components/admin/events/event-form';
import { getEventById } from '@/constants/admin/operations';

export default async function AdminEventEditPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = getEventById(eventId);

  if (!event) {
    notFound();
  }

  return <EventForm mode="edit" event={event} />;
}

