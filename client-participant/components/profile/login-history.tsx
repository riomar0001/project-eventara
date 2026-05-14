'use client';

import { Monitor, Smartphone, Globe } from 'lucide-react';

type LoginSession = {
  id: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'web';
  location: string;
  ip: string;
  time: string;
  isCurrent: boolean;
};

const MOCK_SESSIONS: LoginSession[] = [
  { id: '1', device: 'Chrome on Windows', deviceType: 'desktop', location: 'Manila, PH', ip: '136.158.x.x', time: 'Just now', isCurrent: true },
  { id: '2', device: 'Safari on iPhone', deviceType: 'mobile', location: 'Makati, PH', ip: '112.201.x.x', time: '2 days ago', isCurrent: false },
  { id: '3', device: 'Firefox on macOS', deviceType: 'desktop', location: 'Quezon City, PH', ip: '122.53.x.x', time: '5 days ago', isCurrent: false },
  { id: '4', device: 'Chrome on Android', deviceType: 'mobile', location: 'Manila, PH', ip: '136.158.x.x', time: '12 days ago', isCurrent: false }
];

const DEVICE_ICONS = { desktop: Monitor, mobile: Smartphone, web: Globe };

export function LoginHistory() {
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-muted-foreground">Showing recent sign-ins to your account. If you see activity you don't recognize, change your password immediately.</p>
      <div className="space-y-2">
        {MOCK_SESSIONS.map((session) => {
          const Icon = DEVICE_ICONS[session.deviceType];
          return (
            <div key={session.id}
              className={`flex items-center gap-4 rounded-2xl border p-4 ${session.isCurrent ? 'border-primary/40 bg-primary/5' : 'border-border bg-background'}`}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${session.isCurrent ? 'bg-primary/10' : 'bg-muted'}`}>
                <Icon size={16} className={session.isCurrent ? 'text-primary' : 'text-muted-foreground'} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[13.5px] font-semibold text-foreground">{session.device}</p>
                  {session.isCurrent && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">Current</span>
                  )}
                </div>
                <p className="mt-0.5 text-[12px] text-muted-foreground">{session.location} · {session.ip}</p>
              </div>
              <p className="shrink-0 text-[12px] font-medium text-muted-foreground">{session.time}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
