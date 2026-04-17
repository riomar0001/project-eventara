'use client';

import { AdminPageHero } from '@/components/admin/shared/admin-page-hero';
import { Card, CardContent } from '@/components/ui/card';
import { countDenyRules, countPermissionFeatures, countPermissionRows } from '../roles-shared';
import { RolesTableContent } from './table-content';
import { RolesTableHeader } from './table-header';
import type { RoleRecordResponse } from '@/api/types.gen';
import { ROLE_ACCESS_TEXT } from '@/constants/admin/roles/access-control';

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
      <AdminPageHero
        description={ROLE_ACCESS_TEXT.description}
        eyebrow={ROLE_ACCESS_TEXT.badge}
        metrics={[
          {
            label: 'Permission Rows',
            value: totalPermissionRows,
            hint: 'Action-level rules currently distributed across the reusable role catalog.'
          },
          {
            label: 'Feature Coverage',
            value: totalFeaturesCovered,
            hint: 'Combined feature mappings used to shape access footprints across the system.'
          },
          {
            label: 'Deny Rules',
            value: totalDenyRules,
            hint: 'Explicit lockouts used to sharpen restrictive behavior and edge-case coverage.',
            emphasis: 'accent'
          }
        ]}
        title={ROLE_ACCESS_TEXT.title}
        tone="orange"
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
