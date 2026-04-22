import { VolunteersPage } from '@/components/admin/volunteers/volunteers';
import { PermissionGate } from '@/components/auth/permission-gate';

export default function AdminVolunteersPage() {
  return (
    <PermissionGate feature="volunteers" action="read">
      <VolunteersPage />
    </PermissionGate>
  );
}
