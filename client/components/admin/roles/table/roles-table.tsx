'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  countDenyRules,
  countPermissionFeatures,
  countPermissionRows,
  RolesHeroCard,
  RolesMetricStrip
} from '../roles-shared';
import type { RoleRecordResponse } from '@/api/types.gen';
import { ROLE_ACCESS_TEXT } from '@/constants/admin/roles/access-control';
import { RolesTableContent } from './table-content';
import { RolesTableHeader } from './table-header';

interface RolesTableProps {
  error: string | null;
  isEmpty: boolean;
  isLoading: boolean;
  onCreate: () => void;
  onDelete: (role: RoleRecordResponse) => void;
  onEdit: (role: RoleRecordResponse) => void;
  onRefresh: () => void;
  roles: RoleRecordResponse[];
}

export function RolesTable({ error, isEmpty, isLoading, onCreate, onDelete, onEdit, onRefresh, roles }: RolesTableProps) {
  const totalPermissionRows = roles.reduce((count, role) => count + countPermissionRows(role.permissions), 0);
  const totalFeaturesCovered = roles.reduce((count, role) => count + countPermissionFeatures(role.permissions), 0);
  const totalDenyRules = roles.reduce((count, role) => count + countDenyRules(role.permissions), 0);

  return (
    <div className="space-y-6">
      <RolesHeroCard description={ROLE_ACCESS_TEXT.description} title={ROLE_ACCESS_TEXT.title} />

      <RolesMetricStrip
        items={[
          {
            label: 'Permission Rows',
            value: totalPermissionRows,
            detail: 'Total action-level rules distributed across the current role catalog.'
          },
          {
            label: 'Feature Coverage',
            value: totalFeaturesCovered,
            detail: 'Combined feature mappings used by the active reusable roles.'
          },
          {
            label: 'Deny Rules',
            value: totalDenyRules,
            detail: 'Explicit deny entries used to sharpen restrictive role behavior.'
          }
        ]}
      />

      <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
        <RolesTableHeader isLoading={isLoading} onCreate={onCreate} onRefresh={onRefresh} />
        <CardContent className="p-0">
          <RolesTableContent error={error} isEmpty={isEmpty} isLoading={isLoading} onDelete={onDelete} onEdit={onEdit} roles={roles} />
        </CardContent>
      </Card>
    </div>
  );
}
