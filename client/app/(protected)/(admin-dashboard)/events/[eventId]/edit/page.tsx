import { EventEditLoader } from '@/components/admin/events/event-form';
import { PermissionGate } from '@/components/auth/permission-gate';

export default async function AdminEventEditPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return (
    <PermissionGate feature="events" action="update">
      <EventEditLoader eventId={eventId} />
    </PermissionGate>
  );
}
