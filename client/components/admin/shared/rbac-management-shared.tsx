'use client';

import { Blocks, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { FeatureRecordResponse, GrantEffect, RoleAction, RolePermissionRecordResponse } from '@/api/types.gen';
import { cn } from '@/lib/utils';

export type FeatureFormValues = {
  description: string;
  is_enabled: boolean;
  name: string;
  slug: string;
};

export type RoleFormValues = {
  description: string;
  is_default: boolean;
  is_system: boolean;
  name: string;
};

export type RolePermissionDraft = {
  actions: RoleAction[];
  effect: GrantEffect;
};

export type RolePermissionDraftMap = Record<string, RolePermissionDraft>;

export function createEmptyFeatureForm(): FeatureFormValues {
  return {
    description: '',
    is_enabled: true,
    name: '',
    slug: ''
  };
}

export function createEmptyRoleForm(): RoleFormValues {
  return {
    description: '',
    is_default: false,
    is_system: false,
    name: ''
  };
}

export function createRolePermissionDraftMap(permissions?: RolePermissionRecordResponse[]): RolePermissionDraftMap {
  return (permissions ?? []).reduce<RolePermissionDraftMap>((accumulator, permission) => {
    const existing = accumulator[permission.feature_id];

    if (existing) {
      if (!existing.actions.includes(permission.action)) {
        existing.actions.push(permission.action);
      }
      existing.effect = permission.effect;
      return accumulator;
    }

    accumulator[permission.feature_id] = {
      actions: [permission.action],
      effect: permission.effect
    };

    return accumulator;
  }, {});
}

export function humanizeSlug(value: string) {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function humanizeAction(value: RoleAction) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function countEnabledFeatures(features: FeatureRecordResponse[]) {
  return features.filter((feature) => feature.is_enabled).length;
}

export function countPermissionFeatures(permissions?: RolePermissionRecordResponse[]) {
  return new Set((permissions ?? []).map((permission) => permission.feature_id)).size;
}

export function countPermissionRows(permissions?: RolePermissionRecordResponse[]) {
  return permissions?.length ?? 0;
}

export function countAllowRules(permissions?: RolePermissionRecordResponse[]) {
  return (permissions ?? []).filter((permission) => permission.effect === 'allow').length;
}

export function countDenyRules(permissions?: RolePermissionRecordResponse[]) {
  return (permissions ?? []).filter((permission) => permission.effect === 'deny').length;
}

export function averageActionsPerFeature(permissions?: RolePermissionRecordResponse[]) {
  const featureCount = countPermissionFeatures(permissions);
  if (!featureCount) return '0.0';
  return (countPermissionRows(permissions) / featureCount).toFixed(1);
}

export function RbacHeroCard({
  badge,
  description,
  metricLabel,
  metricValue,
  title,
  tone
}: {
  badge: string;
  description: string;
  metricLabel: string;
  metricValue: string | number;
  title: string;
  tone: 'feature' | 'role';
}) {
  const accentClassName =
    tone === 'feature'
      ? 'from-lime-50 via-white to-white text-neutral-950 ring-lime-200'
      : 'from-orange-50 via-white to-white text-neutral-950 ring-orange-200';

  const metricAccentClassName =
    tone === 'feature' ? 'border-lime-200 bg-lime-50 text-lime-950' : 'border-orange-200 bg-orange-50 text-orange-950';

  const icon = tone === 'feature' ? <Blocks className="size-5 text-neutral-900" /> : <ShieldCheck className="size-5 text-neutral-900" />;

  return (
    <Card className={cn('overflow-hidden border-0 bg-linear-to-br shadow-none ring-1', accentClassName)}>
      <CardContent className="px-6 py-6 sm:px-7 sm:py-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white shadow-sm">{icon}</div>
              <Badge variant="secondary" className="rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white uppercase">
                {badge}
              </Badge>
            </div>

            <div className="space-y-2">
              <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-4xl">{title}</h1>
              <p className="max-w-2xl text-sm leading-7 text-neutral-600 sm:text-[15px]">{description}</p>
            </div>
          </div>

          <div className={cn('min-w-52 rounded-[1.8rem] border px-5 py-5 shadow-sm', metricAccentClassName)}>
            <p className="text-[11px] font-semibold tracking-[0.24em] uppercase">{metricLabel}</p>
            <p className="mt-3 text-4xl leading-none font-semibold tracking-[-0.05em]">{metricValue}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RbacMetricStrip({
  items,
  tone
}: {
  items: Array<{ label: string; value: string | number; detail: string }>;
  tone: 'feature' | 'role';
}) {
  const accentClassName = tone === 'feature' ? 'from-lime-100/70 to-white' : 'from-orange-100/70 to-white';

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((item, index) => (
        <Card key={item.label} className={cn('overflow-hidden border-0 bg-linear-to-br shadow-none ring-1 ring-neutral-200', accentClassName)}>
          <CardContent className="relative px-5 py-5">
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

export function EmptyState({
  description,
  title
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm">
        <Sparkles className="size-5 text-neutral-500" />
      </div>
      <p className="text-lg font-semibold text-neutral-950">{title}</p>
      <p className="max-w-lg text-sm leading-7 text-neutral-500">{description}</p>
    </div>
  );
}
