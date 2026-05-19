import { SessionCard } from './session-card';
import type { ApiEventSession } from '@/hooks/events/use-home-events';

export function SessionsList({ sessions, eventId }: { sessions: ApiEventSession[]; eventId: string }) {
  if (sessions.length === 0) {
    return (
      <div>
        <h2 className="text-foreground mb-5 text-xl font-bold tracking-[-0.02em]">Programme</h2>
        <p className="text-muted-foreground text-[14px]">No sessions scheduled yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-foreground mb-5 text-xl font-bold tracking-[-0.02em]">Programme</h2>
      <div className="space-y-3">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} eventId={eventId} />
        ))}
      </div>
    </div>
  );
}
