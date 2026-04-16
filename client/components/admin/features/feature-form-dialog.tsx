'use client';

import type { FormEvent } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { FieldHint } from '@/components/shared/field-hint';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { FeatureRecordResponse } from '@/api/types.gen';
import { RBAC_COPY } from '@/constants/rbac-management';
import type { FeatureFormValues } from '../shared/rbac-management-shared';

interface FeatureFormDialogProps {
  error?: string;
  isSaving: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onValuesChange: (values: FeatureFormValues) => void;
  open: boolean;
  selectedFeature?: FeatureRecordResponse | null;
  values: FeatureFormValues;
}

export function FeatureFormDialog({
  error,
  isSaving,
  mode,
  onClose,
  onSubmit,
  onValuesChange,
  open,
  selectedFeature,
  values
}: FeatureFormDialogProps) {
  const title = mode === 'create' ? RBAC_COPY.features.createTitle : RBAC_COPY.features.editTitle;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl border-0 bg-white p-0 shadow-xl shadow-neutral-950/10">
        <form onSubmit={onSubmit}>
          <DialogHeader className="border-b px-6 pt-6 pb-4">
            <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-lime-100 text-lime-900">
              <Sparkles className="size-5" />
            </div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="leading-6">
              {mode === 'create'
                ? 'Define a backend feature slug that routes, roles, and per-user grants can all reference consistently.'
                : `Adjust labels and availability for ${selectedFeature?.name ?? 'this feature'} without drifting from the backend registry.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor="rbac-feature-name">
                  Name
                </label>
                <Input
                  id="rbac-feature-name"
                  value={values.name}
                  onChange={(event) => onValuesChange({ ...values, name: event.target.value })}
                  placeholder="User Accounts"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor="rbac-feature-slug">
                  Slug
                </label>
                <Input
                  id="rbac-feature-slug"
                  value={values.slug}
                  onChange={(event) => onValuesChange({ ...values, slug: event.target.value })}
                  placeholder="user-accounts"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor="rbac-feature-description">
                Description
              </label>
              <Textarea
                id="rbac-feature-description"
                value={values.description}
                onChange={(event) => onValuesChange({ ...values, description: event.target.value })}
                placeholder="Describe how this feature participates in RBAC and where it is used."
              />
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <Checkbox
                checked={values.is_enabled}
                onCheckedChange={(checked) => onValuesChange({ ...values, is_enabled: checked === true })}
                id="rbac-feature-enabled"
              />
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-900" htmlFor="rbac-feature-enabled">
                  Enabled for policy evaluation
                </label>
                <p className="text-sm leading-6 text-neutral-500">
                  Disabled features stay in the catalog but read as inactive in administrative tools and supporting policy flows.
                </p>
              </div>
            </div>

            <FieldHint error={error} hint="Use lowercase kebab-case slugs to keep permission checks stable." />
          </div>

          <DialogFooter className="border-t px-6 py-5">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode === 'create' ? 'Create feature' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
