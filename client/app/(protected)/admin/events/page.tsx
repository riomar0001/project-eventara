import { PermissionGate } from '@/components/auth/permission-gate';
import { EventsCatalog } from '@/components/admin/events/events-catalog';

export default function AdminEventsPage() {
  return (
    <PermissionGate feature="events" action="read">
      <EventsCatalog />
    </PermissionGate>
  );
}
