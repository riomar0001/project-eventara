'use client';

import { useState } from 'react';
import { useAuditLogs } from '@/hooks/admin/audit-logs/use-audit-logs';
import { AuditLogDetails } from './audit-log-details';
import { AuditLogFilters } from './audit-log-filters';
import { AuditLogsHero } from './audit-logs-hero';
import { AuditLogsTable } from './audit-logs-table';
import { getAuditSummary } from '@/lib/admin/audit-logs/helpers';

export function AuditLogsPage() {
  const {
    activeFilterCount,
    clearFilters,
    error,
    filters,
    goToNextPage,
    goToPreviousPage,
    isEmpty,
    isLoading,
    logs,
    pageIndex,
    pagination,
    refresh,
    resourceSuggestions,
    updateFilter
  } = useAuditLogs();
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // Derive the effective ID without an effect:
  // - fall back to the first log if the selected one is no longer in the list
  // - resolve to null if there are no logs
  const effectiveLogId = logs.length === 0 ? null : ((logs.some((log) => log.id === selectedLogId) ? selectedLogId : null) ?? logs[0]?.id ?? null);

  const selectedLog = logs.find((log) => log.id === effectiveLogId) ?? null;
  const summary = getAuditSummary(logs);

  return (
    <div className="space-y-3">
      <AuditLogsHero
        activeFilterCount={activeFilterCount}
        failureCount={summary.failureCount}
        isLoading={isLoading}
        loadedCount={summary.loadedCount}
        onRefresh={refresh}
        uniqueActors={summary.uniqueActors}
      />

      <AuditLogFilters
        activeFilterCount={activeFilterCount}
        filters={filters}
        isLoading={isLoading}
        onClear={clearFilters}
        onRefresh={refresh}
        onUpdateFilter={updateFilter}
        resourceSuggestions={resourceSuggestions}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)] xl:items-start">
        <AuditLogsTable
          activeFilterCount={activeFilterCount}
          error={error}
          isEmpty={isEmpty}
          isLoading={isLoading}
          logs={logs}
          onClearFilters={clearFilters}
          onNextPage={goToNextPage}
          onPreviousPage={goToPreviousPage}
          onSelectLog={setSelectedLogId}
          pageIndex={pageIndex}
          pagination={pagination}
          selectedLogId={effectiveLogId}
        />

        <AuditLogDetails selectedLog={selectedLog} />
      </div>
    </div>
  );
}
