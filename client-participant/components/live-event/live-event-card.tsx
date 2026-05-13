'use client';

import { useState, useEffect } from 'react';
import { LIVE_EVENT } from '@/constants/events';

export function LiveEventCard() {
  const [countdown, setCountdown] = useState({ h: 1, m: 24, s: 6 });

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => {
        let { h, m, s } = c;
        s -= 1;
        if (s < 0) {
          s = 59;
          m -= 1;
        }
        if (m < 0) {
          m = 59;
          h -= 1;
        }
        if (h < 0) return { h: 0, m: 0, s: 0 };
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="relative pt-10" style={{ padding: '40px 0' }}>
      <div className="container mx-auto max-w-[1240px] px-8">
        {/* Section head */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] text-[var(--text-mute)] uppercase">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  background: 'var(--amber)',
                  boxShadow: '0 0 12px var(--amber-glow)'
                }}
              />
              ON NOW
            </div>
            <h2 className="my-2.5 text-[clamp(30px,3.4vw,44px)] font-semibold tracking-[-0.03em] text-balance text-[var(--text)]">Happening Now</h2>
          </div>
          <p className="max-w-[46ch] text-[15px] text-[var(--text-dim)]">
            One session is live on the Eventara network. Jump in, or catch up later — sessions are archived within 24 hours.
          </p>
        </div>

        {/* Live card */}
        <div
          className="relative overflow-hidden rounded-[24px] border border-[var(--line)] p-0"
          style={{
            background: 'linear-gradient(180deg, oklch(0.23 0.012 150) 0%, oklch(0.2 0.01 150) 100%)',
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            minHeight: '420px'
          }}
        >
          {/* Glow overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 90% 10%, oklch(0.82 0.17 75 / 0.18), transparent 40%)'
            }}
          />

          {/* Live body (left) */}
          <div className="relative flex flex-col gap-[18px] bg-white p-10" style={{ paddingRight: '40px', paddingLeft: '36px' }}>
            {/* Live tag */}
            <div
              className="inline-flex w-fit items-center gap-2 rounded-full font-mono text-[11px] tracking-[0.14em] text-[var(--amber)] uppercase"
              style={{
                padding: '6px 12px 6px 10px',
                background: 'oklch(0.82 0.17 75 / 0.12)',
                border: '1px solid oklch(0.82 0.17 75 / 0.35)'
              }}
            >
              <span
                className="relative inline-block h-2 w-2 rounded-full"
                style={{
                  background: 'var(--amber)',
                  animation: 'ping 1.6s cubic-bezier(0,0,0.2,1) infinite'
                }}
              />
              LIVE · DAY 02 OF 03
            </div>

            {/* Title */}
            <h3
              className="m-0 font-semibold text-[var(--text)]"
              style={{
                fontSize: 'clamp(26px, 2.6vw, 34px)',
                letterSpacing: '-0.025em',
                lineHeight: '1.1'
              }}
            >
              {LIVE_EVENT.title}
            </h3>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-[18px] gap-x-[28px]">
              <div>
                <div className="font-mono text-[10.5px] tracking-[0.16em] text-[var(--text-mute)] uppercase">Venue</div>
                <div className="mt-1 text-[14.5px] font-medium text-[var(--text)]">{LIVE_EVENT.venue}</div>
              </div>
              <div>
                <div className="font-mono text-[10.5px] tracking-[0.16em] text-[var(--text-mute)] uppercase">Session</div>
                <div className="mt-1 text-[14.5px] font-medium text-[var(--text)]">{LIVE_EVENT.session}</div>
              </div>
              <div>
                <div className="font-mono text-[10.5px] tracking-[0.16em] text-[var(--text-mute)] uppercase">Attendance</div>
                <div className="mt-1 text-[14.5px] font-medium text-[var(--text)]">{LIVE_EVENT.attendees}</div>
              </div>
              <div>
                <div className="font-mono text-[10.5px] tracking-[0.16em] text-[var(--text-mute)] uppercase">Ends in</div>
                <div className="font-mono text-[14.5px] font-medium" style={{ color: 'var(--amber)', marginTop: '4px' }}>
                  {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
                </div>
              </div>
            </div>

            {/* Now playing */}
            <div
              className="mt-auto flex items-center gap-[14px] rounded-[14px] border border-[var(--line-soft)]"
              style={{
                background: 'oklch(1 0 0 / 0.03)',
                padding: '14px 16px'
              }}
            >
              <div
                className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-full text-[14px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, var(--amber), oklch(0.72 0.16 75))',
                  color: '#1a1005'
                }}
              >
                AM
              </div>
              <div className="min-w-0">
                <div className="text-[14.5px] font-semibold">{LIVE_EVENT.speaker.name}</div>
                <div className="text-[12.5px] text-[var(--text-dim)]">Now &quot;{LIVE_EVENT.topic}&quot;</div>
              </div>
              <div className="ml-auto flex items-end gap-[3px]">
                {[10, 16, 22, 14, 18].map((height, i) => (
                  <span
                    key={i}
                    className="block w-[3px] rounded-[2px] bg-[var(--lime)]"
                    style={{
                      height: `${height}px`,
                      animation: `wave 1.1s ease-in-out infinite`,
                      animationDelay: `${[0, 0.15, 0.3, 0.45, 0.2][i]}s`
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5">
              <button
                className="flex flex-1 items-center justify-center gap-2.5 rounded-full bg-[var(--lime)] px-5.5 py-3.5 text-sm font-semibold text-[#0a1005] transition-all duration-180 hover:-translate-y-0.5"
                style={{
                  boxShadow: '0 8px 28px -10px var(--lime-glow), inset 0 -1px 0 oklch(0.7 0.2 128)'
                }}
              >
                ▶ Join Session
              </button>
              <button className="inline-flex items-center justify-center gap-2.5 rounded-full border border-[var(--line)] bg-[oklch(1_0_0_/_0.02)] px-5.5 py-3.5 text-sm font-semibold text-[var(--text-dim)] transition-all duration-180 hover:border-[oklch(1_0_0_/_0.2)] hover:text-[var(--text)]">
                View Agenda
              </button>
            </div>
          </div>

          {/* Live visual (right) */}
          <div
            className="relative overflow-hidden border-l border-[var(--line-soft)]"
            style={{
              background: 'linear-gradient(135deg, oklch(0.2 0.01 150), oklch(0.15 0.008 150))'
            }}
          >
            {/* Stripe art */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'repeating-linear-gradient(110deg, transparent 0 22px, oklch(1 0 0 / 0.025) 22px 24px)'
              }}
            />

            {/* Orbs */}
            <div
              className="absolute rounded-full opacity-30 blur-[26px]"
              style={{
                width: '220px',
                height: '220px',
                left: '18%',
                top: '22%',
                background: 'var(--lime)'
              }}
            />
            <div
              className="absolute rounded-full opacity-40 blur-[26px]"
              style={{
                width: '180px',
                height: '180px',
                right: '14%',
                bottom: '18%',
                background: 'var(--amber)'
              }}
            />

            {/* Stream badge */}
            <div
              className="absolute top-5 right-5 inline-flex items-center gap-2 rounded-full font-mono text-[11px] tracking-[0.12em] text-[var(--text-dim)] uppercase"
              style={{
                padding: '6px 10px',
                background: 'oklch(0 0 0 / 0.4)',
                backdropFilter: 'blur(8px)',
                border: '1px solid oklch(1 0 0 / 0.1)'
              }}
            >
              <span
                className="relative inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  background: 'var(--amber)',
                  animation: 'ping 1.6s cubic-bezier(0,0,0.2,1) infinite'
                }}
              />
              STREAM · 1080p
            </div>

            {/* Label */}
            <div
              className="absolute bottom-4 left-4 font-mono text-[9.5px] tracking-[0.15em] uppercase"
              style={{
                color: 'oklch(1 0 0 / 0.3)'
              }}
            >
              [ event cover · 16:9 placeholder ]
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% {
            transform: scaleY(0.5);
            opacity: 0.6;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
        @keyframes ping {
          0% {
            transform: scale(0.6);
            opacity: 0.6;
          }
          80%,
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}
