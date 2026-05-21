import { VolunteerApplicationsPage } from '@/components/admin/volunteers/volunteer-applications';
import { PermissionGate } from '@/components/auth/permission-gate';

export default function AdminVolunteerApplicationsPage() {
  return (
    <PermissionGate feature="volunteer-applications" action="read">
      <VolunteerApplicationsPage />
    </PermissionGate>
  );
}
