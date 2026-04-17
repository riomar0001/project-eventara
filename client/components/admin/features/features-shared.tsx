'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { FeatureRecordResponse } from '@/api/types.gen';
import type { FeatureFormValues } from '@/types/admin/features';
import { cn } from '@/lib/utils';

export function createEmptyFeatureForm(): FeatureFormValues {
  return {
    description: '',
    is_enabled: true,
    name: '',
    slug: ''
  };
}

export function humanizeFeatureSlug(value: string) {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function countEnabledFeatures(features: FeatureRecordResponse[]) {
  return features.filter((feature) => feature.is_enabled).length;
}

export function FeaturesHeroCard({ description, title }: { description: string; title: string }) {
  return (
    <Card className={cn('overflow-hidden border-0 bg-linear-to-br shadow-none ring-1', 'from-lime-50 via-white to-white text-neutral-950 ring-lime-200')}>
      <CardContent className="px-6 sm:px-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-4xl">{title}</h1>
              <p className="max-w-2xl text-sm leading-7 text-neutral-600 sm:text-[15px]">{description}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FeaturesMetricStrip({ items }: { items: Array<{ detail: string; label: string; value: string | number }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((item, index) => (
        <Card key={item.label} className={cn('overflow-hidden border-0 bg-linear-to-br shadow-none ring-1 ring-neutral-200', 'from-lime-100/70 to-white')}>
          <CardContent className="relative px-5">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-neutral-400 uppercase">
              {String(index + 1).padStart(2, '0')} {item.label}
            </p>
            <p className="mt-4 text-3xl leading-none font-semibold tracking-[-0.05em] text-neutral-950">{item.value}</p>
            <p className="mt-3 text-sm leading-6 text-neutral-600">{item.detail}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FeaturesEmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <p className="text-lg font-semibold text-neutral-950">{title}</p>
      <p className="max-w-lg text-sm leading-7 text-neutral-500">{description}</p>
    </div>
  );
}
