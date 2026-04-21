import { RolesManagement } from '@/components/admin/roles/roles-management';
import { PermissionGate } from '@/components/auth/permission-gate';

export default function AdminRolesPage() {
  return (
    <PermissionGate feature="roles" action="read">
      <RolesManagement />
    </PermissionGate>
  );
}
