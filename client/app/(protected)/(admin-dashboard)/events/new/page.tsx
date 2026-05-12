import { EventForm } from '@/components/admin/events/event-form';
import { PermissionGate } from '@/components/auth/permission-gate';

export default function AdminEventCreatePage() {
  return (
    <PermissionGate feature="events" action="create">
      <EventForm mode="create" />
    </PermissionGate>
  );
}
