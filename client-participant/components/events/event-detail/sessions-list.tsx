import { SessionCard } from './session-card';
import type { EventSession } from '@/constants/sessions';

export function SessionsList({ sessions }: { sessions: EventSession[] }) {
  return (
    <div>
      <h2 className="text-foreground mb-5 text-xl font-bold tracking-[-0.02em]">Programme</h2>
      <div className="space-y-3">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
}
