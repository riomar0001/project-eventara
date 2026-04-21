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
    <section className="rounded-xl border border-neutral-200 bg-neutral-50/80">
      <div className="flex items-center justify-between border-b border-neutral-200 px-3.5 py-2.5">
        <h4 className="text-[13px] font-semibold text-neutral-950">{title}</h4>
        <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] uppercase">
          {itemCount} keys
        </Badge>
      </div>
      <ScrollArea className="max-h-56 overflow-y-auto">
        <pre className="overflow-x-auto px-3.5 py-3 text-[11px] leading-5 whitespace-pre-wrap text-neutral-700">{stringifyAuditPayload(payload)}</pre>
      </ScrollArea>
    </section>
  );
}
