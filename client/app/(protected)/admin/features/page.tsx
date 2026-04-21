import { PermissionGate } from '@/components/auth/permission-gate';
import { FeaturesManagement } from '@/components/admin/features/features-management';

export default function AdminFeaturesPage() {
  return (
    <PermissionGate feature="features" action="read">
      <FeaturesManagement />
    </PermissionGate>
  );
}
