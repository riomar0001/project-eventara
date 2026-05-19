'use client';

import { MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ApiEventSession } from '@/hooks/events/use-home-events';
import { useSessionRegister } from '@/hooks/events/use-session-register';
import { useAuthStore } from '@/store/auth-store';

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  scheduled: { bg: 'bg-primary/10', color: 'text-primary', label: 'Scheduled' },
  posted: { bg: 'bg-primary/10', color: 'text-primary', label: 'Scheduled' },
  started: { bg: 'bg-orange-400/10', color: 'text-orange-400', label: 'Live' },
  ended: { bg: 'bg-muted', color: 'text-muted-foreground', label: 'Ended' },
  cancelled: { bg: 'bg-destructive/10', color: 'text-destructive', label: 'Cancelled' },
};

function formatDuration(startIso: string, endIso: string): string {
  const mins = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

interface SessionCardProps {
  session: ApiEventSession;
  eventId: string;
}

export function SessionCard({ session, eventId }: SessionCardProps) {
  const timeStr = new Date(session.start_datetime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const duration = formatDuration(session.start_datetime, session.end_datetime);
  const meta = STATUS_STYLES[session.status] ?? { bg: 'bg-muted', color: 'text-muted-foreground', label: session.status };
  const venue = [session.venue_name, session.venue_location].filter(Boolean).join(', ');

  const canRegister = session.status === 'scheduled' || session.status === 'posted';
  const { isRegistered, loading, error, register, withdraw } = useSessionRegister(eventId, session.id);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  function handleRegister() {
    if (!user) {
      router.push('/login');
      return;
    }
    register();
  }

  return (
    <div className="border-border bg-card flex items-start gap-4 rounded-2xl border p-5 transition-all hover:border-muted-foreground">
      <div className="min-w-[56px] shrink-0 text-center">
        <div className="text-primary font-mono text-[13px] font-semibold">{timeStr}</div>
        <div className="text-muted-foreground mt-0.5 font-mono text-[10px]">{duration}</div>
      </div>

      <div className="bg-border h-full min-h-[36px] w-px shrink-0" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-foreground text-[15px] font-semibold tracking-[-0.01em]">{session.title}</p>
          <span className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] uppercase ${meta.bg} ${meta.color}`}>
            {meta.label}
          </span>
        </div>
        {session.description && (
          <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">{session.description}</p>
        )}
        {venue && (
          <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-[12px]">
            <MapPin size={12} />
            {venue}
          </div>
        )}
        {session.max_slots != null && (
          <p className="text-muted-foreground mt-1 font-mono text-[11px]">{session.max_slots} slots</p>
        )}

        {canRegister && (
          <div className="mt-3">
            {error && <p className="text-destructive mb-2 text-[11px]">{error}</p>}
            {isRegistered ? (
              <button
                onClick={withdraw}
                disabled={loading}
                className="border-destructive/40 text-destructive hover:bg-destructive/5 rounded-full border px-4 py-1.5 text-[12px] font-medium transition-all disabled:opacity-50"
              >
                {loading ? 'Withdrawing…' : 'Withdraw Registration'}
              </button>
            ) : (
              <button
                onClick={handleRegister}
                disabled={loading}
                className="bg-primary text-primary-foreground hover:opacity-90 rounded-full px-4 py-1.5 text-[12px] font-semibold shadow-[0_4px_14px_-4px_var(--lime-glow)] transition-all disabled:opacity-50"
              >
                {loading ? 'Registering…' : 'Register for Session'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
