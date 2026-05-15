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
      className="ease border-line-soft bg-surface flex cursor-pointer flex-col overflow-hidden rounded-[20px] border transition-[transform_280ms_ease,border-color_280ms_ease,box-shadow_280ms_ease] hover:-translate-y-[6px] hover:border-[oklch(0.7_0.2_130_/_0.5)] hover:shadow-[0_20px_60px_-20px_oklch(0.7_0.2_130_/_0.3),0_0_0_1px_oklch(0.7_0.2_130_/_0.1)]"
    >
      {/* Event visual */}
      <div
        className="border-line-soft relative aspect-[16/9] overflow-hidden border-b"
        style={{
          backgroundImage: `repeating-linear-gradient(${event.angle || '115deg'}, transparent 0 18px, oklch(1 0 0 / 0.035) 18px 20px), linear-gradient(135deg, oklch(0.22 0.012 150), oklch(0.16 0.008 150))`
        }}
      >
        {/* Orb decorations */}
        <div
          className={`absolute top-[30%] left-[20%] h-[160px] w-[160px] rounded-full opacity-55 blur-[34px] ${event.orbColor === 'lime' ? 'bg-lime' : 'bg-amber'}`}
        />
        <div
          className={`absolute right-[15%] bottom-[15%] h-[120px] w-[120px] rounded-full blur-[34px] ${event.orbColor === 'lime' ? 'bg-amber' : 'bg-lime'} opacity-35`}
        />

        {/* Chip badge */}
        <div className="absolute top-3 left-3 rounded-md border border-[oklch(1_0_0/0.1)] bg-black/40 px-[9px] py-[5px] font-mono text-[10.5px] tracking-[0.12em] text-white uppercase backdrop-blur-md">
          {event.chip}
        </div>

        {/* Label */}
        <div className="absolute bottom-3 left-3 font-mono text-[9.5px] tracking-[0.15em] text-white/30 uppercase">[ event cover · 16:9 ]</div>
      </div>

      {/* Event body */}
      <div className="flex flex-1 flex-col gap-2.5 px-[22px] py-[24px]">
        {/* Date */}
        <div className="flex items-center gap-2.5 font-mono text-[11.5px] tracking-[0.1em] text-white">
          <span className="h-px w-3.5 bg-[oklch(0.6_0.18_130_/_0.5)]" />
          {event.date}
        </div>

        {/* Title */}
        <h3 className="text-text my-0.5 text-[19px] leading-[1.25] font-semibold tracking-[-0.02em]">{event.title}</h3>

        {/* Description */}
        <p className="text-text-dim text-[13.5px] leading-[1.55]">{event.desc}</p>

        {/* Footer */}
        <div className="border-line-soft text-text-mute mt-auto flex items-center justify-between border-t border-dashed pt-3.5 text-[12.5px]">
          <div className="text-text-dim flex items-center gap-1.5">
            <span>📍</span> {event.venue}
          </div>
          <div className="text-text-dim font-mono text-[11px]">
            <b className="text-primary">{event.seats.split(' ')[0]}</b> {event.seats.split(' ').slice(1).join(' ')}
          </div>
        </div>
      </div>
    </article>
  );
}
