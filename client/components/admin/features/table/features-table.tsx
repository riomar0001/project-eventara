'use client';

import { AdminPageHero } from '@/components/admin/shared/admin-page-hero';
import { Card, CardContent } from '@/components/ui/card';
import { countEnabledFeatures } from '../features-shared';
import { FeaturesTableContent } from './table-content';
import { FeaturesTableHeader } from './table-header';
import type { FeatureRecordResponse } from '@/api/types.gen';
import { FEATURE_ACCESS_TEXT } from '@/constants/admin/features/access-control';

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
      <AdminPageHero
        description={FEATURE_ACCESS_TEXT.description}
        eyebrow={FEATURE_ACCESS_TEXT.badge}
        metrics={[
          {
            label: 'Enabled',
            value: countEnabledFeatures(features),
            hint: 'Available right now for route guards, grants, and permission checks.'
          },
          {
            label: 'Disabled',
            value: disabledFeatures,
            hint: 'Still modeled in the registry but intentionally inactive in policy flows.'
          },
          {
            label: 'Slugs',
            value: features.length,
            hint: 'Unique backend identifiers used across reusable roles and custom grants.',
            emphasis: 'accent'
          }
        ]}
        title={FEATURE_ACCESS_TEXT.title}
        tone="lime"
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
