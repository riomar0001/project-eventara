'use client';

import type { FormEvent } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { FieldHint } from '@/components/system/forms/field-hint';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { RoleFormValues, RolePermissionDraftMap } from '@/types/admin/roles';
import { humanizeAction, humanizeRoleSlug } from './roles-shared';
import type { FeatureRecordResponse, GrantEffect, RoleAction, RoleRecordResponse } from '@/api/types.gen';
import { ACCESS_EFFECT_OPTIONS, ROLE_ACTION_OPTIONS, ROLE_ACCESS_TEXT } from '@/constants/admin/roles/access-control';
import { cn } from '@/lib/utils';

interface RoleFormDialogProps {
  availableFeatures: FeatureRecordResponse[];
  error?: string;
  isLoadingFeatures: boolean;
  isSaving: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onPermissionActionToggle: (featureId: string, action: RoleAction) => void;
  onPermissionEffectChange: (featureId: string, effect: GrantEffect) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onValuesChange: (values: RoleFormValues) => void;
  open: boolean;
  permissionDrafts: RolePermissionDraftMap;
  selectedRole?: RoleRecordResponse | null;
  values: RoleFormValues;
}

export function RoleFormDialog({
  availableFeatures,
  error,
  isLoadingFeatures,
  isSaving,
  mode,
  onClose,
  onPermissionActionToggle,
  onPermissionEffectChange,
  onSubmit,
  onValuesChange,
  open,
  permissionDrafts,
  selectedRole,
  values
}: RoleFormDialogProps) {
  const title = mode === 'create' ? ROLE_ACCESS_TEXT.createTitle : ROLE_ACCESS_TEXT.editTitle;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden border-0 bg-white p-0 shadow-xl shadow-neutral-950/10 sm:max-w-4xl">
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b px-6 pt-6 pb-4">
            <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
              <ShieldCheck className="size-5" />
            </div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="leading-6">
              {mode === 'create'
                ? 'Compose a reusable role definition by combining feature coverage, action scopes, and allow or deny behavior.'
                : `Adjust ${selectedRole?.name ?? 'this role'} without losing sight of which features and actions it governs.`}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-6 px-6 py-5">
              <div className="grid gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor="role-name">
                      Name
                    </label>
                    <Input
                      id="role-name"
                      value={values.name}
                      onChange={(event) => onValuesChange({ ...values, name: event.target.value })}
                      placeholder="system_auditor"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor="role-description">
                      Description
                    </label>
                    <Textarea
                      id="role-description"
                      value={values.description}
                      onChange={(event) => onValuesChange({ ...values, description: event.target.value })}
                      placeholder="Summarize what this role can access and where it should be assigned."
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4">
                  <p className="text-xs font-semibold tracking-[0.16em] text-amber-800 uppercase">Role posture</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-amber-200/70 bg-white/80 px-4 py-3">
                      <Checkbox
                        id="role-default"
                        checked={values.is_default}
                        onCheckedChange={(checked) => onValuesChange({ ...values, is_default: checked === true })}
                      />
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-neutral-900" htmlFor="role-default">
                          Default role
                        </label>
                        <p className="text-sm leading-6 text-neutral-500">Users without an explicit role can inherit this baseline access bundle.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-amber-200/70 bg-white/80 px-4 py-3">
                      <Checkbox
                        id="role-system"
                        checked={values.is_system}
                        onCheckedChange={(checked) => onValuesChange({ ...values, is_system: checked === true })}
                      />
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-neutral-900" htmlFor="role-system">
                          System role
                        </label>
                        <p className="text-sm leading-6 text-neutral-500">
                          Mark internal platform roles that should stay clearly separated from ad hoc access bundles.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase">Coverage snapshot</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white p-3 ring-1 ring-neutral-200">
                      <p className="text-xs text-neutral-500">Features</p>
                      <p className="mt-2 text-2xl font-semibold text-neutral-950">{Object.keys(permissionDrafts).length}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 ring-1 ring-neutral-200">
                      <p className="text-xs text-neutral-500">Actions</p>
                      <p className="mt-2 text-2xl font-semibold text-neutral-950">
                        {Object.values(permissionDrafts).reduce((count, permission) => count + permission.actions.length, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-neutral-950">Permission matrix</p>
                    <p className="text-sm leading-6 text-neutral-500">
                      Select the features this role can touch, then choose which actions are allowed or explicitly denied.
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-neutral-100 text-neutral-600">
                    {availableFeatures.length} features
                  </Badge>
                </div>

                <div className="grid gap-3">
                  {isLoadingFeatures ? (
                    <div className="rounded-3xl border border-dashed border-neutral-200 px-5 py-8 text-sm text-neutral-500">Loading feature catalog...</div>
                  ) : availableFeatures.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-neutral-200 px-5 py-8 text-sm text-neutral-500">
                      Create at least one feature before assigning role permissions.
                    </div>
                  ) : (
                    availableFeatures.map((feature) => {
                      const draft = permissionDrafts[feature.id];
                      const selectedActions = draft?.actions ?? [];
                      const selectedEffect = draft?.effect ?? 'allow';

                      return (
                        <div
                          key={feature.id}
                          className={cn(
                            'rounded-3xl border px-4 py-4 transition-colors',
                            selectedActions.length > 0 ? 'border-amber-300 bg-amber-50/60' : 'border-neutral-200 bg-white'
                          )}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-neutral-950">{feature.name}</p>
                                <Badge variant="outline" className="text-[10px] text-neutral-500">
                                  {feature.slug}
                                </Badge>
                                <Badge variant="secondary" className={feature.is_enabled ? 'bg-lime-100 text-lime-800' : 'bg-neutral-100 text-neutral-600'}>
                                  {feature.is_enabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                              </div>
                              <p className="text-sm leading-6 text-neutral-500">
                                {feature.description?.trim() ? feature.description : humanizeRoleSlug(feature.slug)}
                              </p>
                            </div>

                            <div className="w-full lg:max-w-44">
                              <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase">Effect</label>
                              <Select value={selectedEffect} onValueChange={(value) => onPermissionEffectChange(feature.id, value as GrantEffect)}>
                                <SelectTrigger className="mt-2 bg-white">
                                  <SelectValue placeholder="Select effect" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ACCESS_EFFECT_OPTIONS.map((effectOption) => (
                                    <SelectItem key={effectOption.value} value={effectOption.value}>
                                      {effectOption.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {ROLE_ACTION_OPTIONS.map((action) => (
                              <label
                                key={`${feature.id}-${action}`}
                                className={cn(
                                  'flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition-colors',
                                  selectedActions.includes(action)
                                    ? 'border-amber-300 bg-white text-neutral-950'
                                    : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                                )}
                              >
                                <Checkbox checked={selectedActions.includes(action)} onCheckedChange={() => onPermissionActionToggle(feature.id, action)} />
                                <span>{humanizeAction(action)}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <FieldHint error={error} hint="Use stable role identifiers so assignments and backend checks stay predictable over time." />
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-5">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode === 'create' ? 'Create role' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
