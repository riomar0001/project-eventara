import { PermissionGate } from '@/components/auth/permission-gate';
import { ManageUser } from '@/components/admin/manage-users/manage-users';

export default function AdminUsersPage() {
  return (
    <PermissionGate feature="user-accounts" action="read">
      <ManageUser />
    </PermissionGate>
  );
}
