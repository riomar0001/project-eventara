'use client';

import { Filter, RotateCcw, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AuditLogFilterValues } from '@/types/admin/audit-logs';
import { AUDIT_LOG_ACTION_OPTIONS, AUDIT_LOGS_TEXT } from '@/constants/admin/audit-logs';

interface AuditLogFiltersProps {
  activeFilterCount: number;
  filters: AuditLogFilterValues;
  isLoading: boolean;
  onClear: () => void;
  onRefresh: () => void;
  onUpdateFilter: <Key extends keyof AuditLogFilterValues>(key: Key, value: AuditLogFilterValues[Key]) => void;
  resourceSuggestions: string[];
}

export function AuditLogFilters({ activeFilterCount, filters, isLoading, onClear, onRefresh, onUpdateFilter, resourceSuggestions }: AuditLogFiltersProps) {
  return (
    <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
      <CardHeader className="border-b border-neutral-200/80 pb-2.5">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] tracking-[0.18em] text-cyan-700 uppercase">
                <Filter className="size-3" />
                Live filters
              </Badge>
              <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] tracking-[0.18em] uppercase">
                {activeFilterCount} active
              </Badge>
            </div>
            <CardTitle className="text-base tracking-tight">{AUDIT_LOGS_TEXT.filtersTitle}</CardTitle>
            <CardDescription className="max-w-2xl text-[12px] leading-4">{AUDIT_LOGS_TEXT.filtersDescription}</CardDescription>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" size="sm" className="h-8 sm:min-w-24" onClick={onRefresh} disabled={isLoading}>
              <Search className="size-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="h-8 sm:min-w-24" onClick={onClear} disabled={isLoading && activeFilterCount === 0}>
              <RotateCcw className="size-4" />
              Clear filters
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 pt-3">
        <div className="grid gap-2 lg:grid-cols-12">
          <div className="space-y-1 lg:col-span-5">
            <label htmlFor="audit-log-user-id" className="text-xs font-semibold tracking-[0.18em] text-neutral-500 uppercase">
              User ID
            </label>
            <Input
              id="audit-log-user-id"
              placeholder="Filter by actor id"
              value={filters.userId}
              onChange={(event) => onUpdateFilter('userId', event.target.value)}
            />
          </div>

          <div className="space-y-1 lg:col-span-5">
            <label htmlFor="audit-log-resource-type" className="text-xs font-semibold tracking-[0.18em] text-neutral-500 uppercase">
              Resource type
            </label>
            <Input
              id="audit-log-resource-type"
              list="audit-log-resource-suggestions"
              placeholder="users, roles, sessions..."
              value={filters.resourceType}
              onChange={(event) => onUpdateFilter('resourceType', event.target.value)}
            />
            <datalist id="audit-log-resource-suggestions">
              {resourceSuggestions.map((resourceType) => (
                <option key={resourceType} value={resourceType} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1 lg:col-span-2">
            <label htmlFor="audit-log-action-type" className="text-xs font-semibold tracking-[0.18em] text-neutral-500 uppercase">
              Action
            </label>
            <Select value={filters.actionType} onValueChange={(value) => onUpdateFilter('actionType', value as AuditLogFilterValues['actionType'])}>
              <SelectTrigger id="audit-log-action-type">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                {AUDIT_LOG_ACTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2">
            <div className="space-y-1">
              <label htmlFor="audit-log-start-date" className="text-xs font-semibold tracking-[0.18em] text-neutral-500 uppercase">
                Start date
              </label>
              <Input id="audit-log-start-date" type="date" value={filters.startDate} onChange={(event) => onUpdateFilter('startDate', event.target.value)} />
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2">
            <div className="space-y-1">
              <label htmlFor="audit-log-end-date" className="text-xs font-semibold tracking-[0.18em] text-neutral-500 uppercase">
                End date
              </label>
              <Input id="audit-log-end-date" type="date" value={filters.endDate} onChange={(event) => onUpdateFilter('endDate', event.target.value)} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
