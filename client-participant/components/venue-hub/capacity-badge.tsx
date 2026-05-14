/**
 * Capacity badge component
 */

interface CapacityBadgeProps {
  type: string;
  capacity: number;
}

export function CapacityBadge({ type, capacity }: CapacityBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0_0_0_/_0.4)] px-2 py-1 backdrop-blur-sm">
      <span className="font-mono text-xs font-medium text-text-dim">{type}</span>
      <span className="text-xs text-text-mute">· {capacity} capacity</span>
    </div>
  );
}
