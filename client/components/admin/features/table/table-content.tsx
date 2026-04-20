'use client';

import { PencilLine, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FeaturesEmptyState, humanizeFeatureSlug } from '../features-shared';
import type { FeatureRecordResponse } from '@/api/types.gen';
import { FEATURE_ACCESS_TEXT } from '@/constants/admin/features/access-control';

interface FeaturesTableContentProps {
  error: string | null;
  features: FeatureRecordResponse[];
  isEmpty: boolean;
  isLoading: boolean;
  onDelete: (feature: FeatureRecordResponse) => void;
  onEdit: (feature: FeatureRecordResponse) => void;
}

function FeatureTableLoadingRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <TableRow key={`feature-loading-${index}`}>
      <TableCell className="px-6 py-5 text-neutral-400" colSpan={5}>
        Loading feature registry...
      </TableCell>
    </TableRow>
  ));
}

export function FeaturesTableContent({ error, features, isEmpty, isLoading, onDelete, onEdit }: FeaturesTableContentProps) {
  if (error) {
    return <FeaturesEmptyState description={error} title="Unable to load the feature registry" />;
  }

  if (isEmpty) {
    return <FeaturesEmptyState description={FEATURE_ACCESS_TEXT.emptyDescription} title={FEATURE_ACCESS_TEXT.emptyTitle} />;
  }

  return (
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
          ? FeatureTableLoadingRows()
          : features.map((feature) => (
              <TableRow key={feature.id} className="align-top hover:bg-neutral-50/70">
                <TableCell className="px-6 py-5">
                  <div className="space-y-1">
                    <p className="font-medium text-neutral-950">{humanizeFeatureSlug(feature.slug)}</p>
                    <p className="font-mono text-xs text-neutral-500">{feature.slug}</p>
                  </div>
                </TableCell>
                <TableCell className="py-5 font-medium text-neutral-800">{feature.name}</TableCell>
                <TableCell className="max-w-sm py-5 text-sm leading-6 whitespace-normal text-neutral-500">
                  {feature.description?.trim() ? feature.description : 'No description yet.'}
                </TableCell>
                <TableCell className="py-5">
                  <Badge variant="secondary" className={feature.is_enabled ? 'bg-lime-100 text-lime-800' : 'bg-neutral-100 text-neutral-600'}>
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
  );
}
