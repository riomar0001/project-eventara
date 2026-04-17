import type { AuditLogFilterValues } from '@/types/admin/audit-logs';
import type { ActionType, AuditLogResponse, AuditLogStatus } from '@/api/types.gen';

const actionLabels: Record<ActionType, string> = {
  create: 'Create',
  read: 'Read',
  update: 'Update',
  delete: 'Delete',
  login: 'Login',
  logout: 'Logout',
  verify: 'Verify',
  export: 'Export',
  import: 'Import'
};

export function formatAuditActionType(actionType: ActionType) {
  return actionLabels[actionType];
}

export function formatAuditResourceType(resourceType: string) {
  return resourceType
    .split(/[_/-]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function formatAuditTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(timestamp));
}

export function formatAuditCompactTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short'
  }).format(new Date(timestamp));
}

export function formatAuditActor(userId: string | null) {
  if (!userId) return 'System';
  return userId;
}

export function formatAuditIdentifier(value: string | null) {
  if (!value) return 'Not captured';
  return value;
}

export function formatAuditDateBoundary(value: string, boundary: 'start' | 'end') {
  if (!value) return null;

  const timestamp = boundary === 'start' ? `${value}T00:00:00.000Z` : `${value}T23:59:59.999Z`;
  return new Date(timestamp).toISOString();
}

export function countAuditChanges(log: AuditLogResponse) {
  const changeKeys = new Set<string>();

  if (log.old_values) {
    for (const key of Object.keys(log.old_values)) changeKeys.add(key);
  }

  if (log.new_values) {
    for (const key of Object.keys(log.new_values)) changeKeys.add(key);
  }

  return changeKeys.size;
}

export function countAuditContextEntries(log: AuditLogResponse) {
  return log.additional_context ? Object.keys(log.additional_context).length : 0;
}

export function stringifyAuditPayload(payload: Record<string, unknown> | null) {
  if (!payload) return 'No captured payload.';
  return JSON.stringify(payload, null, 2);
}

export function getAuditStatusClasses(status: AuditLogStatus) {
  if (status === 'success') {
    return 'border-emerald-200 bg-emerald-100 text-emerald-900';
  }

  return 'border-rose-200 bg-rose-100 text-rose-900';
}

export function getAuditSummary(logs: AuditLogResponse[]) {
  const actors = new Set(logs.map((log) => log.user_id ?? 'system'));
  const resources = new Set(logs.map((log) => log.resource_type));

  return {
    failureCount: logs.filter((log) => log.status === 'failure').length,
    loadedCount: logs.length,
    successCount: logs.filter((log) => log.status === 'success').length,
    uniqueActors: actors.size,
    uniqueResources: resources.size
  };
}

export function countActiveAuditFilters(filters: AuditLogFilterValues) {
  let count = 0;

  if (filters.actionType !== 'all') count += 1;
  if (filters.userId.trim()) count += 1;
  if (filters.resourceType.trim()) count += 1;
  if (filters.startDate) count += 1;
  if (filters.endDate) count += 1;

  return count;
}
