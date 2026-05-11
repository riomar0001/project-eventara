import { VenuesCatalog } from '@/components/admin/venues/venues-catalog';
import { PermissionGate } from '@/components/auth/permission-gate';

export default function AdminVenuesPage() {
  return (
    <PermissionGate feature="venues" action="read">
      <VenuesCatalog />
    </PermissionGate>
  );
}
