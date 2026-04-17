'use client';

import { Fingerprint, Radar } from 'lucide-react';
import { AdminPageHero } from '@/components/admin/shared/admin-page-hero';
import { Button } from '@/components/ui/button';
import { AUDIT_LOGS_TEXT } from '@/constants/admin/audit-logs';

interface AuditLogsHeroProps {
  activeFilterCount: number;
  failureCount: number;
  isLoading: boolean;
  loadedCount: number;
  onRefresh: () => void;
  uniqueActors: number;
}

export function AuditLogsHero({ activeFilterCount, failureCount, isLoading, loadedCount, onRefresh, uniqueActors }: AuditLogsHeroProps) {
  return (
    <AdminPageHero
      actions={
        <Button variant="outline" className="border-white/20 bg-white/6 text-white hover:bg-white/12 hover:text-white" onClick={onRefresh} disabled={isLoading}>
          <Fingerprint className="size-4" />
          Refresh ledger
        </Button>
      }
      description={AUDIT_LOGS_TEXT.description}
      eyebrow={
        <>
          {AUDIT_LOGS_TEXT.eyebrow}
        </>
      }
      metrics={[
        {
          label: 'Loaded Records',
          value: loadedCount,
          hint: 'Rows currently loaded from the cursor-based audit stream.'
        },
        {
          label: 'Failure Events',
          value: failureCount,
          hint: 'Authentication denials, blocked mutations, or rejected server actions in this slice.'
        },
        {
          label: 'Distinct Actors',
          value: uniqueActors,
          hint: 'Unique user or system identities represented in the current review window.'
        },
        {
          label: 'Active Filters',
          value: activeFilterCount,
          hint: 'Signal shaping currently applied to the ledger view.',
          emphasis: 'accent'
        }
      ]}
      metricsColumns={4}
      title="Audit logs with incident-room clarity."
      tone="midnight"
    />
  );
}
