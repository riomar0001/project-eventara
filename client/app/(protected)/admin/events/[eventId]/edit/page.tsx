import { notFound } from 'next/navigation';
import { EventForm } from '@/components/admin/events/event-form';
import { getEventDetailById } from '@/constants/admin/operations';

export default async function AdminEventEditPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = getEventDetailById(eventId);

  if (!event) {
    notFound();
  }

  return <EventForm mode="edit" event={event} />;
}
