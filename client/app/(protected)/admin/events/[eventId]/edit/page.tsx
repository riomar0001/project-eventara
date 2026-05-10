import { EventEditLoader } from '@/components/admin/events/event-form';

export default async function AdminEventEditPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <EventEditLoader eventId={eventId} />;
}
