'use client';

import type { FormEvent } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Check, Loader2, RefreshCcw, ShieldPlus, ShieldX } from 'lucide-react';
import { formatDateTime, humanizeRoleName, humanizeValue } from '@/components/admin/manage-users/manage-users-ui';
import { FieldHint } from '@/components/system/forms/field-hint';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SPECIAL_PERMISSION_ACTIONS, SPECIAL_PERMISSION_EFFECTS } from '../../../../constants/admin/manage-users';
import type {
  AdminUserAccountSummaryResponse as AdminUserAccountSummary,
  GrantEffect,
  GrantFeatureResponse,
  RoleAction,
  UserGrantResponse
} from '@/api/types.gen';
import { cn } from '@/lib/utils';

interface AdminSpecialPermissionDialogProps {
  effectiveFromDate?: Date;
  effectiveToDate?: Date;
  grantFeatures: GrantFeatureResponse[];
  grantFeaturesError: string | null;
  isLoadingGrantFeatures: boolean;
  isLoadingSpecialPermissions: boolean;
  isSubmitting: boolean;
  onCloseSpecialPermissionDialog: () => void;
  onSpecialPermissionActionToggle: (value: RoleAction) => void;
  onSpecialPermissionEffectChange: (value: GrantEffect) => void;
  onSpecialPermissionFromDateChange: (value: Date | undefined) => void;
  onSpecialPermissionFeatureChange: (value: string) => void;
  onSpecialPermissionDelete: (grantId: string) => void;
  onSpecialPermissionSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSpecialPermissionToDateChange: (value: Date | undefined) => void;
  pendingAction: 'role' | 'email' | 'password-reset' | 'delete' | 'special-permission' | 'delete-special-permission' | null;
  refreshGrantFeatures: () => void;
  selectedFeatureId: string;
  selectedGrantActions: RoleAction[];
  selectedGrantEffect: GrantEffect;
  specialPermissionDialogUser: AdminUserAccountSummary | null;
  specialPermissionError?: string;
  specialPermissions: UserGrantResponse[];
  specialPermissionsError: string | null;
}

export function AdminSpecialPermissionDialog({
  effectiveFromDate,
  effectiveToDate,
  grantFeatures,
  grantFeaturesError,
  isLoadingGrantFeatures,
  isLoadingSpecialPermissions,
  isSubmitting,
  onCloseSpecialPermissionDialog,
  onSpecialPermissionActionToggle,
  onSpecialPermissionEffectChange,
  onSpecialPermissionFromDateChange,
  onSpecialPermissionFeatureChange,
  onSpecialPermissionDelete,
  onSpecialPermissionSubmit,
  onSpecialPermissionToDateChange,
  pendingAction,
  refreshGrantFeatures,
  selectedFeatureId,
  selectedGrantActions,
  selectedGrantEffect,
  specialPermissionDialogUser,
  specialPermissionError,
  specialPermissions,
  specialPermissionsError
}: AdminSpecialPermissionDialogProps) {
  const selectedGrantFeature = grantFeatures.find((feature) => feature.id === selectedFeatureId);
  const grantFeatureMap = new Map(grantFeatures.map((feature) => [feature.id, feature]));

  return (
    <Dialog open={Boolean(specialPermissionDialogUser)} onOpenChange={(open) => !open && onCloseSpecialPermissionDialog()}>
      <DialogContent className="max-h-[85vh] overflow-hidden border-0 bg-white p-0 shadow-xl shadow-neutral-900/5 sm:max-w-3xl">
        <DialogHeader className="px-5 pt-5 pb-4">
          <DialogTitle>Special permissions</DialogTitle>
          <DialogDescription>View, add, and remove user-specific permissions that are managed separately from the user&apos;s system role.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-5.75rem)]">
          <div className="space-y-5 px-5 pb-5">
            <div className="rounded-2xl bg-neutral-50 px-4 py-3">
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-neutral-950">{specialPermissionDialogUser?.name ?? 'Selected user'}</p>
                <p className="text-xs text-neutral-500">Base role: {humanizeRoleName(specialPermissionDialogUser?.role_name, 'No assigned role')}</p>
                <p className="text-xs leading-5 text-neutral-500">
                  Special permissions belong to this user account and are tracked independently from the role&apos;s included permissions.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-neutral-950">User-specific special permissions</p>
                  <p className="text-xs text-neutral-500">These entries are assigned directly to this user and have their own active date range.</p>
                </div>
                <Badge variant="secondary" className="bg-neutral-100 text-[11px] text-neutral-600 shadow-none">
                  {specialPermissions.length} active
                </Badge>
              </div>

              {specialPermissionsError ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{specialPermissionsError}</div>
              ) : isLoadingSpecialPermissions ? (
                <div className="rounded-2xl bg-neutral-50 px-4 py-8">
                  <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                    <Loader2 className="size-4 animate-spin" />
                    Loading special permissions...
                  </div>
                </div>
              ) : specialPermissions.length === 0 ? (
                <div className="rounded-2xl bg-neutral-50 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-neutral-800">No special permissions yet.</p>
                  <p className="mt-1 text-xs text-neutral-500">Use the form below to add the first user-specific permission for this account.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {specialPermissions.map((permission) => {
                    const feature = grantFeatureMap.get(permission.feature_id);

                    return (
                      <div key={permission.id} className="rounded-2xl bg-neutral-50 px-4 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-neutral-950">{feature?.name ?? permission.feature_id}</p>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'px-2 py-0.5 text-[10px] shadow-none',
                                  permission.effect === 'deny' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                )}
                              >
                                {humanizeValue(permission.effect)}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="secondary" className="bg-white text-[10px] text-neutral-600 shadow-none">
                                {humanizeValue(permission.action)}
                              </Badge>
                              {feature?.slug ? (
                                <Badge variant="secondary" className="bg-white text-[10px] text-neutral-500 shadow-none">
                                  {feature.slug}
                                </Badge>
                              ) : null}
                            </div>
                            <div className="space-y-1 text-xs text-neutral-500">
                              <p>From: {formatDateTime(permission.starts_at)}</p>
                              <p>To: {formatDateTime(permission.expires_at)}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onSpecialPermissionDelete(permission.id)}
                            disabled={isSubmitting}
                            className="justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            {pendingAction === 'delete-special-permission' ? <Loader2 className="size-4 animate-spin" /> : <ShieldX className="size-4" />}
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <form className="space-y-4 rounded-3xl bg-neutral-50 px-4 py-4" onSubmit={onSpecialPermissionSubmit}>
              <div>
                <p className="text-sm font-medium text-neutral-950">Add special permission</p>
                <p className="mt-1 text-xs text-neutral-500">Create a user-specific permission entry for a feature, action set, and active date range.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor="admin-special-permission-feature">
                    Feature
                  </label>
                  <Select value={selectedFeatureId || undefined} onValueChange={onSpecialPermissionFeatureChange}>
                    <SelectTrigger
                      className="h-11 w-full rounded-xl border-0 bg-white shadow-none"
                      id="admin-special-permission-feature"
                      disabled={isLoadingGrantFeatures || isSubmitting}
                    >
                      <SelectValue placeholder={isLoadingGrantFeatures ? 'Loading features...' : 'Select a feature'} />
                    </SelectTrigger>
                    <SelectContent>
                      {grantFeatures.map((feature) => (
                        <SelectItem key={feature.id} value={feature.id}>
                          {feature.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor="admin-special-permission-effect">
                    Effect
                  </label>
                  <Select value={selectedGrantEffect} onValueChange={(value) => onSpecialPermissionEffectChange(value as GrantEffect)}>
                    <SelectTrigger
                      className="h-11 min-w-36 rounded-xl border-0 bg-white shadow-none"
                      id="admin-special-permission-effect"
                      disabled={isSubmitting}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIAL_PERMISSION_EFFECTS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor="admin-special-permission-effective-from">
                    Effective from
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="admin-special-permission-effective-from"
                        disabled={isSubmitting}
                        className="h-11 w-full justify-start rounded-xl border-0 bg-white font-normal shadow-none"
                      >
                        <CalendarIcon className="size-4 text-neutral-500" />
                        {effectiveFromDate ? <span>{format(effectiveFromDate, 'PPP')}</span> : <span>Pick a start date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={effectiveFromDate} onSelect={onSpecialPermissionFromDateChange} defaultMonth={effectiveFromDate} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase" htmlFor="admin-special-permission-effective-to">
                    Effective to
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="admin-special-permission-effective-to"
                        disabled={isSubmitting}
                        className="h-11 w-full justify-start rounded-xl border-0 bg-white font-normal shadow-none"
                      >
                        <CalendarIcon className="size-4 text-neutral-500" />
                        {effectiveToDate ? <span>{format(effectiveToDate, 'PPP')}</span> : <span>Pick an end date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={effectiveToDate}
                        onSelect={onSpecialPermissionToDateChange}
                        defaultMonth={effectiveToDate ?? effectiveFromDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase">Actions</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SPECIAL_PERMISSION_ACTIONS.map((action) => {
                    const isSelected = selectedGrantActions.includes(action);

                    return (
                      <button
                        key={action}
                        type="button"
                        onClick={() => onSpecialPermissionActionToggle(action)}
                        disabled={isSubmitting}
                        className={cn(
                          'flex items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition-colors',
                          isSelected ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700'
                        )}
                      >
                        <span>{humanizeValue(action)}</span>
                        {isSelected ? <Check className="size-4" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedGrantFeature ? (
                <div className="rounded-2xl bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-neutral-950">{selectedGrantFeature.name}</p>
                      <p className="text-xs text-neutral-500">
                        {selectedGrantFeature.description?.trim() ? selectedGrantFeature.description : 'No feature description is available.'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 shadow-none">
                      {selectedGrantFeature.slug}
                    </Badge>
                  </div>
                </div>
              ) : null}

              <FieldHint
                error={specialPermissionError ?? grantFeaturesError ?? undefined}
                hint={
                  specialPermissionDialogUser?.role_id
                    ? 'This user-specific permission becomes active at the start date and ends automatically at the optional end date.'
                    : 'Assign a system role first so this user has a base role before adding a separate special permission.'
                }
              />

              {grantFeaturesError ? (
                <Button type="button" variant="outline" size="sm" onClick={refreshGrantFeatures}>
                  <RefreshCcw className="size-4" />
                  Reload features
                </Button>
              ) : null}

              <DialogFooter className="pt-1">
                <Button type="button" variant="outline" onClick={onCloseSpecialPermissionDialog} disabled={isSubmitting}>
                  Close
                </Button>
                <Button type="submit" disabled={isSubmitting || isLoadingGrantFeatures || !specialPermissionDialogUser?.role_id}>
                  {pendingAction === 'special-permission' ? <Loader2 className="size-4 animate-spin" /> : <ShieldPlus className="size-4" />}
                  Add permission
                </Button>
              </DialogFooter>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
