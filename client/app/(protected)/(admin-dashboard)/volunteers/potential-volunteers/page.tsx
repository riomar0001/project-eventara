import { PotentialVolunteersPage } from '@/components/admin/volunteers/potential-volunteers';
import { PermissionGate } from '@/components/auth/permission-gate';

export default function AdminPotentialVolunteersPage() {
  return (
    <PermissionGate feature="volunteers" action="read">
      <PotentialVolunteersPage />
    </PermissionGate>
  );
}
