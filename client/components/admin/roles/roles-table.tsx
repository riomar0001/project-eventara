'use client';

import { Loader2, PencilLine, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { RoleRecordResponse } from '@/api/types.gen';
import { RBAC_COPY, RBAC_PROTECTED_ROLE_DELETE_MESSAGE } from '@/constants/rbac-management';
import { EmptyState, RbacHeroCard, RbacMetricStrip, averageActionsPerFeature, countAllowRules, countDenyRules, countPermissionFeatures, countPermissionRows, humanizeSlug } from '../shared/rbac-management-shared';

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
      <RbacHeroCard
        badge={RBAC_COPY.roles.badge}
        description={RBAC_COPY.roles.description}
        metricLabel="Curated Roles"
        metricValue={roles.length}
        title={RBAC_COPY.roles.title}
        tone="role"
      />

      <RbacMetricStrip
        tone="role"
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
        <CardHeader className="border-b pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <CardTitle>Role catalog</CardTitle>
              <CardDescription>Bundle reusable permissions across multiple RBAC features, actions, and allow or deny effects.</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
                Refresh
              </Button>
              <Button onClick={onCreate}>
                <Plus className="size-4" />
                {RBAC_COPY.roles.addCta}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <EmptyState description={error} title="Unable to load the role catalog" />
          ) : isEmpty ? (
            <EmptyState description={RBAC_COPY.roles.emptyDescription} title={RBAC_COPY.roles.emptyTitle} />
          ) : (
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
                  ? Array.from({ length: 5 }, (_, index) => (
                      <TableRow key={`role-loading-${index}`}>
                        <TableCell className="px-6 py-5 text-neutral-400" colSpan={5}>
                          Loading role catalog...
                        </TableCell>
                      </TableRow>
                    ))
                  : roles.map((role) => {
                      const isDeleteDisabled = role.is_system && role.name === 'system_administrator';

                      return (
                      <TableRow key={role.id} className="align-top hover:bg-neutral-50/70">
                        <TableCell className="px-6 py-5">
                          <div className="space-y-1">
                            <p className="font-medium text-neutral-950">{humanizeSlug(role.name)}</p>
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
                              title={isDeleteDisabled ? RBAC_PROTECTED_ROLE_DELETE_MESSAGE : undefined}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
