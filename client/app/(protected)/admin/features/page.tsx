import { FeaturesManagement } from '@/components/admin/features/features-management';
import { PermissionGate } from '@/components/auth/permission-gate';

export default function AdminFeaturesPage() {
  return (
    <PermissionGate feature="features" action="read">
      <FeaturesManagement />
    </PermissionGate>
  );
}
