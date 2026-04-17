'use client';

import { PencilLine, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { RoleRecordResponse } from '@/api/types.gen';
import { PROTECTED_ROLE_DELETE_MESSAGE, ROLE_ACCESS_TEXT } from '@/constants/admin/roles/access-control';
import {
  averageActionsPerFeature,
  countAllowRules,
  countPermissionFeatures,
  countPermissionRows,
  humanizeRoleSlug,
  RolesEmptyState
} from './roles-shared';

interface RolesTableContentProps {
  error: string | null;
  isEmpty: boolean;
  isLoading: boolean;
  onDelete: (role: RoleRecordResponse) => void;
  onEdit: (role: RoleRecordResponse) => void;
  roles: RoleRecordResponse[];
}

function RoleTableLoadingRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <TableRow key={`role-loading-${index}`}>
      <TableCell className="px-6 py-5 text-neutral-400" colSpan={5}>
        Loading role catalog...
      </TableCell>
    </TableRow>
  ));
}

export function RolesTableContent({ error, isEmpty, isLoading, onDelete, onEdit, roles }: RolesTableContentProps) {
  if (error) {
    return <RolesEmptyState description={error} title="Unable to load the role catalog" />;
  }

  if (isEmpty) {
    return <RolesEmptyState description={ROLE_ACCESS_TEXT.emptyDescription} title={ROLE_ACCESS_TEXT.emptyTitle} />;
  }

  return (
    <Table>
      <TableHeader className="bg-neutral-50/80">
        <TableRow>
          <TableHead className="px-6">Role</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Coverage</TableHead>
          <TableHead>Flags</TableHead>
          <TableHead className="px-6 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? RoleTableLoadingRows()
          : roles.map((role) => {
              const isDeleteDisabled = role.is_system && role.name === 'system_administrator';

              return (
                <TableRow key={role.id} className="align-top hover:bg-neutral-50/70">
                  <TableCell className="px-6 py-5">
                    <div className="space-y-1">
                      <p className="font-medium text-neutral-950">{humanizeRoleSlug(role.name)}</p>
                      <p className="font-mono text-xs text-neutral-500">{role.name}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-sm py-5 text-sm leading-6 whitespace-normal text-neutral-500">
                    {role.description?.trim() ? role.description : 'No description yet.'}
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="space-y-1 text-sm text-neutral-600">
                      <p>{countPermissionFeatures(role.permissions)} features</p>
                      <p>
                        {countPermissionRows(role.permissions)} permission rows
                        {countPermissionRows(role.permissions) > 0 ? `, ${averageActionsPerFeature(role.permissions)} per feature` : ''}
                      </p>
                      {countAllowRules(role.permissions) > 0 ? <p>{countAllowRules(role.permissions)} allow rules</p> : null}
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex flex-wrap gap-2">
                      {role.is_default ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                          Default
                        </Badge>
                      ) : null}
                      {role.is_system ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          System
                        </Badge>
                      ) : null}
                      {!role.is_default && !role.is_system ? (
                        <Badge variant="secondary" className="bg-neutral-100 text-neutral-600">
                          Standard
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => onEdit(role)}>
                        <PencilLine className="size-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 disabled:text-neutral-400 disabled:hover:text-neutral-400"
                        disabled={isDeleteDisabled}
                        onClick={() => onDelete(role)}
                        title={isDeleteDisabled ? PROTECTED_ROLE_DELETE_MESSAGE : undefined}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
      </TableBody>
    </Table>
  );
}
