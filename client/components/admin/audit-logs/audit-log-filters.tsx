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

function FilterLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-[10px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
      {children}
    </label>
  );
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

      <CardContent className="pt-3">
        <div className="grid gap-x-3 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_160px_160px_160px]">
          {/* User ID */}
          <div className="space-y-1.5">
            <FilterLabel htmlFor="audit-log-user-id">User ID</FilterLabel>
            <Input
              id="audit-log-user-id"
              placeholder="Filter by actor ID"
              value={filters.userId}
              onChange={(e) => onUpdateFilter('userId', e.target.value)}
            />
          </div>

          {/* Resource type */}
          <div className="space-y-1.5">
            <FilterLabel htmlFor="audit-log-resource-type">Resource type</FilterLabel>
            <Input
              id="audit-log-resource-type"
              list="audit-log-resource-suggestions"
              placeholder="users, roles, sessions…"
              value={filters.resourceType}
              onChange={(e) => onUpdateFilter('resourceType', e.target.value)}
            />
            <datalist id="audit-log-resource-suggestions">
              {resourceSuggestions.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>

          {/* Action */}
          <div className="space-y-1.5">
            <FilterLabel htmlFor="audit-log-action-type">Action</FilterLabel>
            <Select value={filters.actionType} onValueChange={(v) => onUpdateFilter('actionType', v as AuditLogFilterValues['actionType'])}>
              <SelectTrigger id="audit-log-action-type">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                {AUDIT_LOG_ACTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start date */}
          <div className="space-y-1.5">
            <FilterLabel htmlFor="audit-log-start-date">Start date</FilterLabel>
            <Input
              id="audit-log-start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) => onUpdateFilter('startDate', e.target.value)}
            />
          </div>

          {/* End date */}
          <div className="space-y-1.5">
            <FilterLabel htmlFor="audit-log-end-date">End date</FilterLabel>
            <Input
              id="audit-log-end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) => onUpdateFilter('endDate', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
