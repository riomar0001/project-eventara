'use client';

import { useState, useEffect } from 'react';
import { LIVE_EVENT } from '@/constants/events';

export function LiveEventCard() {
  const [countdown, setCountdown] = useState({ h: 1, m: 24, s: 6 });

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => {
        let { h, m, s } = c;
        s -= 1; if (s < 0) { s = 59; m -= 1; }
        if (m < 0) { m = 59; h -= 1; }
        if (h < 0) return { h: 0, m: 0, s: 0 };
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="relative py-10">
      <div className="mx-auto max-w-[1240px] px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_12px_var(--amber-glow)]" />
              ON NOW
            </div>
            <h2 className="my-2.5 text-[clamp(30px,3.4vw,44px)] font-semibold tracking-[-0.03em] text-balance text-foreground">Happening Now</h2>
          </div>
          <p className="max-w-[46ch] text-[15px] text-muted-foreground">One session is live on the Eventara network. Jump in, or catch up later — sessions are archived within 24 hours.</p>
        </div>

        <div className="relative grid overflow-hidden rounded-[24px] border border-border bg-linear-[180deg] from-card to-[oklch(0.97_0.005_150)] p-0" style={{ gridTemplateColumns: '1.1fr 1fr', minHeight: '420px' }}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,oklch(0.62_0.16_60_/_0.1),transparent_40%)]" />

          <div className="relative flex flex-col gap-[18px] py-10 pl-9 pr-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-400/10 border border-orange-400/35 px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] uppercase text-orange-400">
              <span className="relative inline-block h-2 w-2 rounded-full bg-orange-400" style={{ animation: 'ping 1.6s cubic-bezier(0,0,0.2,1) infinite' }} />
              LIVE · DAY 02 OF 03
            </div>

            <h3 className="m-0 font-semibold text-foreground" style={{ fontSize: 'clamp(26px, 2.6vw, 34px)', letterSpacing: '-0.025em', lineHeight: '1.1' }}>{LIVE_EVENT.title}</h3>

            <div className="grid grid-cols-2 gap-x-[28px] gap-y-[18px]">
              {[
                ['Venue', LIVE_EVENT.venue],
                ['Session', LIVE_EVENT.session],
                ['Attendance', LIVE_EVENT.attendees],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-muted-foreground">{k}</div>
                  <div className="mt-1 text-[14.5px] font-medium text-foreground">{v}</div>
                </div>
              ))}
              <div>
                <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-muted-foreground">Ends in</div>
                <div className="mt-1 font-mono text-[14.5px] font-medium text-orange-400">{pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</div>
              </div>
            </div>

            <div className="mt-auto flex items-center gap-[14px] rounded-[14px] border border-border bg-muted/30 p-[14px_16px]">
              <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-full font-bold text-[#1a1005] text-[14px] bg-linear-[135deg] from-orange-400 to-orange-400/80">AM</div>
              <div className="min-w-0">
                <div className="text-[14.5px] font-semibold">{LIVE_EVENT.speaker.name}</div>
                <div className="text-[12.5px] text-muted-foreground">Now &quot;{LIVE_EVENT.topic}&quot;</div>
              </div>
              <div className="ml-auto flex items-end gap-[3px]">
                {[10, 16, 22, 14, 18].map((h, i) => (
                  <span key={i} className="block w-[3px] rounded-[2px] bg-primary" style={{ height: `${h}px`, animation: `wave 1.1s ease-in-out infinite`, animationDelay: `${[0, 0.15, 0.3, 0.45, 0.2][i]}s` }} />
                ))}
              </div>
            </div>

            <div className="flex gap-2.5">
              <button className="flex flex-1 items-center justify-center gap-2.5 rounded-full bg-primary px-5.5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_28px_-10px_var(--lime-glow),inset_0_-1px_0_oklch(0.7_0.2_128)] transition-all duration-180 hover:-translate-y-0.5">
                ▶ Join Session
              </button>
              <button className="inline-flex items-center justify-center gap-2.5 rounded-full border border-border bg-muted/20 px-5.5 py-3.5 text-sm font-semibold text-muted-foreground transition-all duration-180 hover:border-muted-foreground hover:text-foreground">
                View Agenda
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden border-l border-border bg-linear-[135deg] from-[oklch(0.2_0.01_150)] to-[oklch(0.15_0.008_150)]">
            <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(110deg, transparent 0 22px, oklch(1 0 0 / 0.025) 22px 24px)' }} />
            <div className="absolute left-[18%] top-[22%] h-[220px] w-[220px] rounded-full bg-primary opacity-30 blur-[26px]" />
            <div className="absolute right-[14%] bottom-[18%] h-[180px] w-[180px] rounded-full bg-orange-400 opacity-40 blur-[26px]" />
            <div className="absolute top-5 right-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-[6px_10px] font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground backdrop-blur-md">
              <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-orange-400" style={{ animation: 'ping 1.6s cubic-bezier(0,0,0.2,1) infinite' }} />
              STREAM · 1080p
            </div>
            <div className="absolute bottom-4 left-4 font-mono text-[9.5px] tracking-[0.15em] uppercase text-white/30">[ event cover · 16:9 placeholder ]</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wave { 0%,100%{transform:scaleY(0.5);opacity:0.6} 50%{transform:scaleY(1);opacity:1} }
        @keyframes ping { 0%{transform:scale(0.6);opacity:0.6} 80%,100%{transform:scale(1.8);opacity:0} }
      `}</style>
    </section>
  );
}
