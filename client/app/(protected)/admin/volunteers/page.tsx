import { PermissionGate } from '@/components/auth/permission-gate';
import { VolunteersPage } from '@/components/admin/volunteers/volunteers';

export default function AdminVolunteersPage() {
  return (
    <PermissionGate feature="volunteers" action="read">
      <VolunteersPage />
    </PermissionGate>
  );
}
