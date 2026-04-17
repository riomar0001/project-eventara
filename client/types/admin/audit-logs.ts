import type { ActionType } from '@/api/types.gen';

export type AuditLogFilterActionValue = ActionType | 'all';

export type AuditLogFilterValues = {
  actionType: AuditLogFilterActionValue;
  endDate: string;
  limit: number;
  resourceType: string;
  startDate: string;
  userId: string;
};
