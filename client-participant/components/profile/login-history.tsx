'use client';

import { Monitor, Smartphone, Globe, Loader2 } from 'lucide-react';
import { useLoginHistory } from '@/hooks/profile/use-login-history';
import type { LoginHistoryEntryResponse } from '@/api/types.gen';

function deviceIcon(entry: LoginHistoryEntryResponse) {
  const dt = (entry.device_type ?? '').toLowerCase();
  if (dt === 'mobile' || dt === 'tablet') return Smartphone;
  if (dt === 'desktop') return Monitor;
  return Globe;
}

function formatLocation(entry: LoginHistoryEntryResponse): string {
  const parts = [entry.city, entry.region, entry.country].filter(Boolean);
  return parts.join(', ') || 'Unknown location';
}

function formatDevice(entry: LoginHistoryEntryResponse): string {
  const parts = [entry.browser, entry.os].filter(Boolean);
  return parts.join(' on ') || entry.user_agent?.slice(0, 40) || 'Unknown device';
}

function formatTime(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function maskIp(ip: string | null | undefined): string {
  if (!ip) return '—';
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.x.x`;
  return ip.split(':').slice(0, 3).join(':') + ':…';
}

export function LoginHistory() {
  const { sessions, loading, error } = useLoginHistory();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-[13px]">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-[13px]">
        Showing recent sign-ins to your account. If you see activity you don&apos;t recognize, change your password immediately.
      </p>
      {sessions.length === 0 ? (
        <p className="text-muted-foreground text-[13px]">No login history found.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session, i) => {
            const Icon = deviceIcon(session);
            const isCurrent = i === 0 && session.successful;
            return (
              <div
                key={session.id}
                className={`flex items-center gap-4 rounded-2xl border p-4 ${isCurrent ? 'border-primary/40 bg-primary/5' : 'border-border bg-background'}`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isCurrent ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Icon size={16} className={isCurrent ? 'text-primary' : 'text-muted-foreground'} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-foreground text-[13.5px] font-semibold">{formatDevice(session)}</p>
                    {isCurrent && (
                      <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase">
                        Current
                      </span>
                    )}
                    {!session.successful && (
                      <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase">
                        Failed
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-[12px]">
                    {formatLocation(session)} · {maskIp(session.ip_address)}
                  </p>
                </div>
                <p className="text-muted-foreground shrink-0 text-[12px] font-medium">{formatTime(session.created_at)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
