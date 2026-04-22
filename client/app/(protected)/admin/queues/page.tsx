import { QueueManagementPage } from '@/components/admin/queues/queue-management';
import { PermissionGate } from '@/components/auth/permission-gate';

export default function AdminQueuesPage() {
  return (
    <PermissionGate feature="queues" action="read">
      <QueueManagementPage />
    </PermissionGate>
  );
}
