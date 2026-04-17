'use client';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { stringifyAuditPayload } from '@/lib/admin/audit-logs/helpers';

interface AuditLogPayloadPanelProps {
  payload: Record<string, unknown> | null;
  title: string;
}

export function AuditLogPayloadPanel({ payload, title }: AuditLogPayloadPanelProps) {
  const itemCount = payload ? Object.keys(payload).length : 0;

  return (
    <section className="rounded-3xl border border-neutral-200 bg-neutral-50/80">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <h4 className="text-sm font-semibold text-neutral-950">{title}</h4>
        <Badge variant="outline" className="rounded-full text-[11px] uppercase">
          {itemCount} keys
        </Badge>
      </div>
      <ScrollArea className="max-h-64">
        <pre className="overflow-x-auto px-4 py-4 text-xs leading-6 whitespace-pre-wrap text-neutral-700">{stringifyAuditPayload(payload)}</pre>
      </ScrollArea>
    </section>
  );
}
