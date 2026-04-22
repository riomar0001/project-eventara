import { EventsCatalog } from '@/components/admin/events/events-catalog';
import { PermissionGate } from '@/components/auth/permission-gate';

export default function AdminEventsPage() {
  return (
    <PermissionGate feature="events" action="read">
      <EventsCatalog />
    </PermissionGate>
  );
}
