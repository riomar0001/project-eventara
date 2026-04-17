import type { AuditLogFilterValues } from '@/types/admin/audit-logs';

export const AUDIT_LOGS_TEXT = {
  eyebrow: 'Admin observability',
  title: 'Audit Ledger',
  description:
    'Trace login events, permission edits, and record mutations through a compact forensic workspace designed for admins and auditors.',
  tableTitle: 'Recorded activity',
  tableDescription: 'Inspect the latest server-side audit trail, then open any row to review captured context and before-or-after payloads.',
  filtersTitle: 'Filter ledger',
  filtersDescription: 'Narrow by actor, action, resource type, and UTC date range without leaving the review surface.',
  emptyTitle: 'No audit records match this filter set',
  emptyDescription: 'Try widening the date range, clearing one of the filters, or refreshing the ledger.',
  errorTitle: 'Unable to load audit logs',
  errorDescription: 'The audit API did not return a usable payload for this request.',
  detailTitle: 'Event detail',
  detailPlaceholderTitle: 'Choose a record',
  detailPlaceholderDescription: 'Select an activity row to inspect the captured payload, context, and event metadata.',
  oldValuesTitle: 'Before snapshot',
  newValuesTitle: 'After snapshot',
  contextTitle: 'Request context'
} as const;

export const DEFAULT_AUDIT_LOG_FILTERS: AuditLogFilterValues = {
  actionType: 'all',
  endDate: '',
  limit: 25,
  resourceType: '',
  startDate: '',
  userId: ''
};

export const AUDIT_LOG_ACTION_OPTIONS = [
  { label: 'All actions', value: 'all' },
  { label: 'Create', value: 'create' },
  { label: 'Read', value: 'read' },
  { label: 'Update', value: 'update' },
  { label: 'Delete', value: 'delete' },
  { label: 'Login', value: 'login' },
  { label: 'Logout', value: 'logout' },
  { label: 'Verify', value: 'verify' },
  { label: 'Export', value: 'export' },
  { label: 'Import', value: 'import' }
] as const;

export const AUDIT_LOG_LIMIT_OPTIONS = [
  { label: '25 rows', value: 25 },
  { label: '50 rows', value: 50 },
  { label: '100 rows', value: 100 }
] as const;
