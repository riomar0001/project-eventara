import { PermissionGate } from '@/components/auth/permission-gate';
import { QueueManagementPage } from '@/components/admin/queues/queue-management';

export default function AdminQueuesPage() {
  return (
    <PermissionGate feature="queues" action="read">
      <QueueManagementPage />
    </PermissionGate>
  );
}
