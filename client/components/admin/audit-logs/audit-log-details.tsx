'use client';

import { FileSearch, Globe, ScanSearch, UserRoundSearch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AUDIT_LOGS_TEXT } from '@/constants/admin/audit-logs';
import {
  countAuditChanges,
  countAuditContextEntries,
  formatAuditActionType,
  formatAuditActor,
  formatAuditIdentifier,
  formatAuditResourceType,
  formatAuditTimestamp,
  getAuditStatusClasses
} from '@/lib/admin/audit-logs/helpers';
import { AuditLogPayloadPanel } from './audit-log-payload-panel';
import type { AuditLogResponse } from '@/api/types.gen';

interface AuditLogDetailsProps {
  selectedLog: AuditLogResponse | null;
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="mt-2 break-all text-sm leading-6 font-medium text-neutral-950">{value}</p>
    </div>
  );
}

export function AuditLogDetails({ selectedLog }: AuditLogDetailsProps) {
  if (!selectedLog) {
    return (
      <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200 xl:sticky xl:top-6">
        <CardHeader className="border-b border-neutral-200/80">
          <CardTitle>{AUDIT_LOGS_TEXT.detailPlaceholderTitle}</CardTitle>
          <CardDescription>{AUDIT_LOGS_TEXT.detailPlaceholderDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-80 items-center justify-center px-6 py-12">
          <div className="max-w-sm space-y-3 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-neutral-100 text-neutral-500">
              <FileSearch className="size-6" />
            </div>
            <p className="text-base font-medium text-neutral-950">Nothing selected yet</p>
            <p className="text-sm leading-6 text-neutral-500">{AUDIT_LOGS_TEXT.detailPlaceholderDescription}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200 xl:sticky xl:top-6">
      <CardHeader className="border-b border-neutral-200/80">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle>{AUDIT_LOGS_TEXT.detailTitle}</CardTitle>
            <CardDescription className="max-w-sm text-sm leading-6">
              Review the exact event metadata together with any serialized before-or-after snapshots captured by the server.
            </CardDescription>
          </div>
          <Badge className={`rounded-full border px-2.5 py-1 text-[11px] tracking-[0.18em] uppercase ${getAuditStatusClasses(selectedLog.status)}`}>
            {selectedLog.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        <div className="rounded-3xl border border-neutral-200 bg-neutral-950 px-4 py-4 text-white">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-neutral-300 uppercase">{formatAuditActionType(selectedLog.action_type)}</p>
          <p className="mt-2 text-xl font-semibold tracking-tight">{formatAuditResourceType(selectedLog.resource_type)}</p>
          <p className="mt-2 text-sm leading-6 text-neutral-300">{formatAuditTimestamp(selectedLog.timestamp)}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <DetailRow icon={UserRoundSearch} label="Actor" value={formatAuditActor(selectedLog.user_id)} />
          <DetailRow icon={Globe} label="IP address" value={selectedLog.ip_address ?? 'Not captured'} />
          <DetailRow icon={ScanSearch} label="Resource id" value={formatAuditIdentifier(selectedLog.resource_id)} />
          <DetailRow icon={FileSearch} label="User agent" value={selectedLog.user_agent ?? 'Not captured'} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="text-[11px] tracking-[0.18em] text-neutral-500 uppercase">Changed fields</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{countAuditChanges(selectedLog)}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="text-[11px] tracking-[0.18em] text-neutral-500 uppercase">Context entries</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{countAuditContextEntries(selectedLog)}</p>
          </div>
        </div>

        <AuditLogPayloadPanel payload={selectedLog.old_values} title={AUDIT_LOGS_TEXT.oldValuesTitle} />
        <AuditLogPayloadPanel payload={selectedLog.new_values} title={AUDIT_LOGS_TEXT.newValuesTitle} />
        <AuditLogPayloadPanel payload={selectedLog.additional_context} title={AUDIT_LOGS_TEXT.contextTitle} />
      </CardContent>
    </Card>
  );
}
