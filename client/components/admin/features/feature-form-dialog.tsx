'use client';

import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { FieldHint } from '@/components/system/forms/field-hint';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { sanitizeSlugInput, toKebabSlug } from './features-shared';
import type { FeatureFormValues } from '@/types/admin/features';
import type { FeatureRecordResponse } from '@/api/types.gen';
import { FEATURE_ACCESS_TEXT } from '@/constants/admin/features/access-control';

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

export function FeatureFormDialog({ error, isSaving, mode, onClose, onSubmit, onValuesChange, open, selectedFeature, values }: FeatureFormDialogProps) {
  const title = mode === 'create' ? FEATURE_ACCESS_TEXT.createTitle : FEATURE_ACCESS_TEXT.editTitle;

  // Track whether the slug is still auto-synced to the name field.
  // True only in create mode; resets whenever the dialog (re)opens.
  const [slugSynced, setSlugSynced] = useState(mode === 'create');
  const prevOpenRef = useRef(open);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setSlugSynced(mode === 'create');
    }
    prevOpenRef.current = open;
  }, [open, mode]);

  function handleNameChange(name: string) {
    if (slugSynced) {
      onValuesChange({ ...values, name, slug: toKebabSlug(name) });
    } else {
      onValuesChange({ ...values, name });
    }
  }

  function handleSlugChange(raw: string) {
    setSlugSynced(false);
    onValuesChange({ ...values, slug: sanitizeSlugInput(raw) });
  }

  function handleResync() {
    setSlugSynced(true);
    onValuesChange({ ...values, slug: toKebabSlug(values.name) });
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl border-0 bg-white p-0 shadow-xl shadow-neutral-950/10">
        <form onSubmit={onSubmit}>
          <DialogHeader className="border-b px-6 pt-6 pb-4">
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-lime-100 text-lime-900">
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
                <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor="feature-name">
                  Name
                </label>
                <Input
                  id="feature-name"
                  value={values.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="User Accounts"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor="feature-slug">
                  Slug
                </label>
                <div className="relative">
                  <Input
                    id="feature-slug"
                    value={values.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="user-accounts"
                    className={slugSynced ? 'pr-14' : values.name ? 'pr-8' : undefined}
                    spellCheck={false}
                    autoComplete="off"
                  />
                  {slugSynced ? (
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded bg-lime-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-lime-700">
                      auto
                    </span>
                  ) : values.name ? (
                    <button
                      type="button"
                      onClick={handleResync}
                      title="Regenerate from name"
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700"
                    >
                      <RotateCcw className="size-3.5" />
                    </button>
                  ) : null}
                </div>
                <p className="text-[11px] text-neutral-400">
                  Lowercase letters, numbers, and hyphens only.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor="feature-description">
                Description
              </label>
              <Textarea
                id="feature-description"
                value={values.description}
                onChange={(event) => onValuesChange({ ...values, description: event.target.value })}
                placeholder="Describe how this feature participates in access control and where it is used."
              />
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <Checkbox
                checked={values.is_enabled}
                onCheckedChange={(checked) => onValuesChange({ ...values, is_enabled: checked === true })}
                id="feature-enabled"
              />
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-900" htmlFor="feature-enabled">
                  Enabled for policy evaluation
                </label>
                <p className="text-sm leading-6 text-neutral-500">
                  Disabled features stay in the catalog but read as inactive in administrative tools and supporting policy flows.
                </p>
              </div>
            </div>

            <FieldHint error={error} hint="Slugs are permanent identifiers — changing them will break any roles or grants that reference this feature." />
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
