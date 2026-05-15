import { Star } from 'lucide-react';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

type Props = { rating: number; hovered: number; onRate: (n: number) => void; onHover: (n: number) => void };

export function StarRating({ rating, hovered, onRate, onHover }: Props) {
  const active = hovered || rating;

  return (
    <div>
      <p className="text-muted-foreground mb-3 font-mono text-[11px] tracking-[0.14em] uppercase">Your rating</p>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onRate(n)}
            onMouseEnter={() => onHover(n)}
            onMouseLeave={() => onHover(0)}
            className="rounded-xl p-1 transition-all hover:scale-110"
          >
            <Star size={30} className={`transition-all ${n <= active ? 'fill-current text-orange-400' : 'text-border'}`} />
          </button>
        ))}
        {active > 0 && <span className="ml-2 font-mono text-[12px] font-semibold text-orange-400">{LABELS[active]}</span>}
      </div>
      {rating === 0 && <p className="text-muted-foreground mt-2 text-[12px]">Click a star to rate</p>}
    </div>
  );
}
