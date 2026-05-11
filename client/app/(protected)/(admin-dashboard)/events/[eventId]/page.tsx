import { EventDetail } from '@/components/admin/events/event-detail';

export default async function AdminEventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  return <EventDetail eventId={eventId} />;
}
