import { EventForm } from '@/components/admin/events/event-form';
import { getEventById } from '@/constants/event-management';
import { notFound } from 'next/navigation';

export default async function AdminEventEditPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = getEventById(eventId);

  if (!event) {
    notFound();
  }

  return <EventForm mode="edit" event={event} />;
}
