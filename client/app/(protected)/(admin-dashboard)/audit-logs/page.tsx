import { AuditLogsPage } from '@/components/admin/audit-logs/audit-logs';
import { PermissionGate } from '@/components/auth/permission-gate';

export default function AdminAuditLogsPage() {
  return (
    <PermissionGate feature="audit-logs" action="read">
      <AuditLogsPage />
    </PermissionGate>
  );
}
