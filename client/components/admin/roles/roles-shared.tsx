'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { RolePermissionRecordResponse } from '@/api/types.gen';
import type { RoleFormValues, RolePermissionDraftMap } from '@/types/admin/roles';
import { cn } from '@/lib/utils';

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

export function humanizeRoleSlug(value: string) {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function humanizeAction(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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

export function RolesHeroCard({ description, title }: { description: string; title: string }) {
  return (
    <Card className={cn('overflow-hidden border-0 bg-linear-to-br shadow-none ring-1', 'from-orange-50 via-white to-white text-neutral-950 ring-orange-200')}>
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

export function RolesMetricStrip({ items }: { items: Array<{ detail: string; label: string; value: string | number }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((item, index) => (
        <Card key={item.label} className={cn('overflow-hidden border-0 bg-linear-to-br shadow-none ring-1 ring-neutral-200', 'from-orange-100/70 to-white')}>
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

export function RolesEmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <p className="text-lg font-semibold text-neutral-950">{title}</p>
      <p className="max-w-lg text-sm leading-7 text-neutral-500">{description}</p>
    </div>
  );
}
