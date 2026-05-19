'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { LiveEventData } from '@/hooks/events/use-home-events';

interface LiveEventCardProps {
  liveEvent: LiveEventData | null | undefined;
  loading?: boolean;
}

function getCurrentDay(startDate: string, endDate: string): { day: number; totalDays: number } {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const totalDays = Math.max(1, Math.ceil((end - start) / msPerDay) + 1);
  const currentDay = Math.max(1, Math.ceil((now - start) / msPerDay));
  return { day: Math.min(currentDay, totalDays), totalDays };
}

function getRemainingTime(endDateStr: string): { h: number; m: number; s: number } {
  const diff = Math.max(0, new Date(endDateStr).getTime() - Date.now());
  const total = Math.floor(diff / 1000);
  return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}

const pad = (n: number) => String(n).padStart(2, '0');

export function LiveEventCard({ liveEvent, loading }: LiveEventCardProps) {
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (!liveEvent) return;
    const current = liveEvent.sessions.find((s) => s.status === 'started') ?? liveEvent.sessions[0];
    const endDate = current?.end_datetime ?? liveEvent.event.end_date;

    setCountdown(getRemainingTime(endDate));
    const t = setInterval(() => setCountdown(getRemainingTime(endDate)), 1000);
    return () => clearInterval(t);
  }, [liveEvent]);

  if (loading) {
    return (
      <section className="relative py-10">
        <div className="mx-auto max-w-[1240px] px-8">
          <div className="border-border from-card min-h-[420px] animate-pulse rounded-[24px] border bg-linear-[180deg] to-[oklch(0.97_0.005_150)]" />
        </div>
      </section>
    );
  }

  if (!liveEvent) return null;

  const { event, sessions } = liveEvent;
  const { day, totalDays } = getCurrentDay(event.start_date, event.end_date);
  const currentSession = sessions.find((s) => s.status === 'started') ?? sessions[0];
  const venueDisplay = currentSession?.venue_location
    ? `${currentSession.venue_name} · ${currentSession.venue_location}`
    : (currentSession?.venue_name ?? 'TBD');
  const sessionIndex = sessions.findIndex((s) => s.id === currentSession?.id) + 1;
  const slotInfo = currentSession?.max_slots ? `${currentSession.max_slots} total slots` : 'Open attendance';

  return (
    <section className="relative py-10">
      <div className="mx-auto max-w-[1240px] px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-muted-foreground mb-2 inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_12px_var(--amber-glow)]" />
              ON NOW
            </div>
            <h2 className="text-foreground my-2.5 text-[clamp(30px,3.4vw,44px)] font-semibold tracking-[-0.03em] text-balance">
              Happening Now
            </h2>
          </div>
          <p className="text-muted-foreground max-w-[46ch] text-[15px]">
            One session is live on the Eventara network. Jump in, or catch up later — sessions are archived within 24 hours.
          </p>
        </div>

        <div className="border-border from-card relative grid min-h-[420px] grid-cols-[1.1fr_1fr] overflow-hidden rounded-[24px] border bg-linear-[180deg] to-[oklch(0.97_0.005_150)] p-0">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,oklch(0.62_0.16_60_/_0.1),transparent_40%)]" />

          <div className="relative flex flex-col gap-[18px] py-10 pr-10 pl-9">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-400/35 bg-orange-400/10 px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] text-orange-400 uppercase">
              <span className="relative inline-block h-2 w-2 animate-[ping_1.6s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-orange-400" />
              LIVE · DAY {pad(day)} OF {pad(totalDays)}
            </div>

            <h3 className="text-foreground m-0 text-[clamp(26px,2.6vw,34px)] leading-[1.1] font-semibold tracking-[-0.025em]">
              {event.title}
            </h3>

            <div className="grid grid-cols-2 gap-x-[28px] gap-y-[18px]">
              {[
                ['Venue', venueDisplay],
                ['Session', `Session ${sessionIndex} of ${sessions.length}`],
                ['Attendance', slotInfo]
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-muted-foreground font-mono text-[10.5px] tracking-[0.16em] uppercase">{k}</div>
                  <div className="text-foreground mt-1 text-[14.5px] font-medium">{v}</div>
                </div>
              ))}
              <div>
                <div className="text-muted-foreground font-mono text-[10.5px] tracking-[0.16em] uppercase">Ends in</div>
                <div className="mt-1 font-mono text-[14.5px] font-medium text-orange-400">
                  {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
                </div>
              </div>
            </div>

            <div className="mt-auto flex gap-2.5">
              <Link href={`/events/${event.id}`} className="bg-primary text-primary-foreground flex flex-1 items-center justify-center gap-2.5 rounded-full px-5.5 py-3.5 text-sm font-semibold shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all duration-180 hover:-translate-y-0.5">
                ▶ Join Session
              </Link>
              <Link href={`/events/${event.id}`} className="border-border bg-muted/20 text-muted-foreground hover:border-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-2.5 rounded-full border px-5.5 py-3.5 text-sm font-semibold transition-all duration-180">
                View Event
              </Link>
            </div>
          </div>

          <div className="border-border relative overflow-hidden border-l bg-linear-[135deg] from-[oklch(0.2_0.01_150)] to-[oklch(0.15_0.008_150)]">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(110deg,transparent_0_22px,oklch(1_0_0_/_0.025)_22px_24px)]" />
            <div className="bg-primary absolute top-[22%] left-[18%] h-[220px] w-[220px] rounded-full opacity-30 blur-[26px]" />
            <div className="absolute right-[14%] bottom-[18%] h-[180px] w-[180px] rounded-full bg-orange-400 opacity-40 blur-[26px]" />
            {event.banner_url ? (
              <img
                src={event.banner_url}
                alt={event.title}
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />
            ) : (
              <div className="text-muted-foreground absolute top-5 right-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-[10px] py-[6px] font-mono text-[11px] tracking-[0.12em] uppercase backdrop-blur-md">
                <span className="relative inline-block h-1.5 w-1.5 animate-[ping_1.6s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-orange-400" />
                STREAM · LIVE
              </div>
            )}
            <div className="absolute bottom-4 left-4 font-mono text-[9.5px] tracking-[0.15em] text-white/30 uppercase">
              [ event cover · 16:9 ]
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ping { 0%{transform:scale(0.6);opacity:0.6} 80%,100%{transform:scale(1.8);opacity:0} }
      `}</style>
    </section>
  );
}
