import * as React from 'react';

export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{title}</p>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

export function Row({ children, wrap = false, align = 'center' }: { children: React.ReactNode; wrap?: boolean; align?: 'start' | 'center' }) {
  return <div className={`flex gap-3 ${wrap ? 'flex-wrap' : ''} ${align === 'start' ? 'items-start' : 'items-center'}`}>{children}</div>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground w-28 shrink-0 text-[10px]">{children}</span>;
}
