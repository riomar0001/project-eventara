'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { FeatureRecordResponse } from '@/api/types.gen';
import { FEATURE_ACCESS_TEXT } from '@/constants/admin/features/access-control';
import { FeaturesHeroCard, FeaturesMetricStrip, countEnabledFeatures } from './features-shared';
import { FeaturesTableContent } from './features-table-content';
import { FeaturesTableHeader } from './features-table-header';

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
      <FeaturesHeroCard description={FEATURE_ACCESS_TEXT.description} title={FEATURE_ACCESS_TEXT.title} />

      <FeaturesMetricStrip
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
        <FeaturesTableHeader isLoading={isLoading} onCreate={onCreate} onRefresh={onRefresh} />
        <CardContent className="p-0">
          <FeaturesTableContent error={error} features={features} isEmpty={isEmpty} isLoading={isLoading} onDelete={onDelete} onEdit={onEdit} />
        </CardContent>
      </Card>
    </div>
  );
}
