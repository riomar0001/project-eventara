import { PermissionGate } from '@/components/auth/permission-gate';
import { VenuesCatalog } from '@/components/admin/venues/venues-catalog';

export default function AdminVenuesPage() {
  return (
    <PermissionGate feature="venues" action="read">
      <VenuesCatalog />
    </PermissionGate>
  );
}
