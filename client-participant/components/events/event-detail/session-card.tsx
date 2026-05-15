import { SESSION_TYPE_META, type EventSession } from '@/constants/sessions';

export function SessionCard({ session }: { session: EventSession }) {
  const meta = SESSION_TYPE_META[session.type];

  return (
    <div className="border-border bg-card hover:border-muted-foreground flex items-start gap-4 rounded-2xl border p-5 transition-all">
      <div className="min-w-[56px] shrink-0 text-center">
        <div className="text-primary font-mono text-[13px] font-semibold">{session.time}</div>
        <div className="text-muted-foreground mt-0.5 font-mono text-[10px]">{session.duration}</div>
      </div>

      <div className="bg-border h-full min-h-[36px] w-px shrink-0" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-foreground text-[15px] font-semibold tracking-[-0.01em]">{session.title}</p>
          <span className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] uppercase ${meta.bg} ${meta.color}`}>{meta.label}</span>
        </div>
        {session.speaker && (
          <p className="text-muted-foreground mt-1 text-[13px]">
            {session.speaker}
            {session.role && <span className="text-muted-foreground"> · {session.role}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
