import { VolunteerForm } from '@/components/admin/volunteers/volunteer-form';
import { PermissionGate } from '@/components/auth/permission-gate';

export default function AdminVolunteerCreatePage() {
  return (
    <PermissionGate feature="volunteers" action="create">
      <VolunteerForm mode="create" />
    </PermissionGate>
  );
}
