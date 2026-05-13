'use client';

interface UpcomingEvent {
  id: number;
  date: string;
  title: string;
  desc: string;
  venue: string;
  chip: string;
  seats: string;
  orbColor: 'lime' | 'amber';
  angle: string;
}

interface EventCardProps {
  event: UpcomingEvent;
  onClick?: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  return (
    <article
      onClick={onClick}
      className="ease flex cursor-pointer flex-col overflow-hidden rounded-[20px] border border-[var(--line-soft)] bg-[var(--surface)] transition-all duration-280"
      style={{
        transition: 'transform 280ms ease, border-color 280ms ease, box-shadow 280ms ease'
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'translateY(-6px)';
        el.style.borderColor = 'oklch(0.9 0.22 128 / 0.45)';
        el.style.boxShadow = '0 20px 60px -20px oklch(0.9 0.22 128 / 0.25), 0 0 0 1px oklch(0.9 0.22 128 / 0.1)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = '';
        el.style.borderColor = '';
        el.style.boxShadow = '';
      }}
    >
      {/* Event visual */}
      <div
        className="relative overflow-hidden border-b border-[var(--line-soft)]"
        style={{
          aspectRatio: '16/9',
          backgroundImage: `repeating-linear-gradient(
            ${event.angle || '115deg'},
            transparent 0 18px,
            oklch(1 0 0 / 0.035) 18px 20px
          )`
        }}
      >
        {/* Orb decorations */}
        <div
          className="absolute rounded-full opacity-55 blur-[34px]"
          style={{
            width: '160px',
            height: '160px',
            left: '20%',
            top: '30%',
            background: event.orbColor === 'lime' ? 'var(--lime)' : 'var(--amber)'
          }}
        />
        <div
          className="absolute rounded-full opacity-55 blur-[34px]"
          style={{
            width: '120px',
            height: '120px',
            right: '15%',
            bottom: '15%',
            background: event.orbColor === 'lime' ? 'var(--amber)' : 'var(--lime)',
            opacity: 0.35
          }}
        />

        {/* Chip badge */}
        <div
          className="absolute top-3 left-3 rounded-[6px] border border-[oklch(1_0_0_/_0.1)] px-[9px] py-[5px] font-mono text-[10.5px] tracking-[0.12em] text-white uppercase"
          style={{
            background: 'oklch(0 0 0 / 0.4)',
            backdropFilter: 'blur(8px)'
          }}
        >
          {event.chip}
        </div>

        {/* Label */}
        <div
          className="absolute bottom-3 left-3 font-mono text-[9.5px] tracking-[0.15em] uppercase"
          style={{
            color: 'oklch(1 0 0 / 0.3)'
          }}
        >
          [ event cover · 16:9 ]
        </div>
      </div>

      {/* Event body */}
      <div className="flex flex-1 flex-col gap-2.5 px-[22px] py-[24px]">
        {/* Date */}
        <div className="flex items-center gap-2.5 font-mono text-[11.5px] tracking-[0.1em] text-[var(--lime)]">
          <span className="h-px w-[14px] bg-[oklch(0.9_0.22_128_/_0.4)]" />
          {event.date}
        </div>

        {/* Title */}
        <h3 className="my-0.5 text-[19px] leading-[1.25] font-semibold tracking-[-0.02em] text-[var(--text)]">{event.title}</h3>

        {/* Description */}
        <p className="text-[13.5px] leading-[1.55] text-[var(--text-dim)]">{event.desc}</p>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-dashed border-[var(--line-soft)] pt-3.5 text-[12.5px] text-[var(--text-mute)]">
          <div className="flex items-center gap-1.5 text-[var(--text-dim)]">
            <span>📍</span> {event.venue}
          </div>
          <div className="font-mono text-[11px] text-[var(--text-dim)]">
            <b className="text-[var(--lime)]">{event.seats.split(' ')[0]}</b> {event.seats.split(' ').slice(1).join(' ')}
          </div>
        </div>
      </div>
    </article>
  );
}
