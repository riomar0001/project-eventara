'use client';

import { Loader2, PencilLine, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { FeatureRecordResponse } from '@/api/types.gen';
import { RBAC_COPY } from '@/constants/rbac-management';
import { EmptyState, RbacHeroCard, RbacMetricStrip, countEnabledFeatures, humanizeSlug } from '../shared/rbac-management-shared';

interface FeaturesTableProps {
  error: string | null;
  features: FeatureRecordResponse[];
  isEmpty: boolean;
  isLoading: boolean;
  onCreate: () => void;
  onDelete: (feature: FeatureRecordResponse) => void;
  onEdit: (feature: FeatureRecordResponse) => void;
  onRefresh: () => void;
}

export function FeaturesTable({ error, features, isEmpty, isLoading, onCreate, onDelete, onEdit, onRefresh }: FeaturesTableProps) {
  const disabledFeatures = features.length - countEnabledFeatures(features);

  return (
    <div className="space-y-6">
      <RbacHeroCard
        badge={RBAC_COPY.features.badge}
        description={RBAC_COPY.features.description}
        metricLabel="Tracked Features"
        metricValue={features.length}
        title={RBAC_COPY.features.title}
        tone="feature"
      />

      <RbacMetricStrip
        tone="feature"
        items={[
          {
            label: 'Enabled',
            value: countEnabledFeatures(features),
            detail: 'Available for permission checks and admin policy flows.'
          },
          {
            label: 'Disabled',
            value: disabledFeatures,
            detail: 'Still documented in the catalog but currently inactive.'
          },
          {
            label: 'Slugs',
            value: features.length,
            detail: 'Unique backend identifiers used across roles and grants.'
          }
        ]}
      />

      <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
        <CardHeader className="border-b pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <CardTitle>Feature registry</CardTitle>
              <CardDescription>Keep slugs, labels, and availability flags aligned with the access-control surface used across the backend.</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
                Refresh
              </Button>
              <Button onClick={onCreate}>
                <Plus className="size-4" />
                {RBAC_COPY.features.addCta}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <EmptyState description={error} title="Unable to load the feature registry" />
          ) : isEmpty ? (
            <EmptyState description={RBAC_COPY.features.emptyDescription} title={RBAC_COPY.features.emptyTitle} />
          ) : (
            <Table>
              <TableHeader className="bg-neutral-50/80">
                <TableRow>
                  <TableHead className="px-6">Feature</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="px-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }, (_, index) => (
                      <TableRow key={`feature-loading-${index}`}>
                        <TableCell className="px-6 py-5 text-neutral-400" colSpan={5}>
                          Loading feature registry...
                        </TableCell>
                      </TableRow>
                    ))
                  : features.map((feature) => (
                      <TableRow key={feature.id} className="align-top hover:bg-neutral-50/70">
                        <TableCell className="px-6 py-5">
                          <div className="space-y-1">
                            <p className="font-medium text-neutral-950">{humanizeSlug(feature.slug)}</p>
                            <p className="font-mono text-xs text-neutral-500">{feature.slug}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-5 font-medium text-neutral-800">{feature.name}</TableCell>
                        <TableCell className="max-w-sm py-5 text-sm leading-6 whitespace-normal text-neutral-500">
                          {feature.description?.trim() ? feature.description : 'No description yet.'}
                        </TableCell>
                        <TableCell className="py-5">
                          <Badge
                            variant="secondary"
                            className={feature.is_enabled ? 'bg-lime-100 text-lime-800' : 'bg-neutral-100 text-neutral-600'}
                          >
                            {feature.is_enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => onEdit(feature)}>
                              <PencilLine className="size-4" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => onDelete(feature)}>
                              <Trash2 className="size-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
