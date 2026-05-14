/**
 * Rating badge component
 */
import { Icon } from '@/components/ui/icon';

interface RatingBadgeProps {
  rating: number;
  reviews: number;
}

export function RatingBadge({ rating, reviews }: RatingBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0_0_0_/_0.4)] px-2 py-1 backdrop-blur-sm">
      <div className="text-amber">
        <Icon name="star" size={14} />
      </div>
      <span className="text-xs font-medium text-text">{rating.toFixed(1)}</span>
      <span className="font-mono text-xs font-medium text-text-mute">({reviews})</span>
    </div>
  );
}
