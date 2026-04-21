import { PermissionGate } from '@/components/auth/permission-gate';
import { AuditLogsPage } from '@/components/admin/audit-logs/audit-logs';

export default function AdminAuditLogsPage() {
  return (
    <PermissionGate feature="audit-logs" action="read">
      <AuditLogsPage />
    </PermissionGate>
  );
}
