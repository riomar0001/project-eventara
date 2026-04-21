import { PermissionGate } from '@/components/auth/permission-gate';
import { RolesManagement } from '@/components/admin/roles/roles-management';

export default function AdminRolesPage() {
  return (
    <PermissionGate feature="roles" action="read">
      <RolesManagement />
    </PermissionGate>
  );
}
