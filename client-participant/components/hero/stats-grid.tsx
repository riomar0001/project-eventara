'use client';

export function StatsGrid() {
  const stats = [
    { value: '42', label: 'Events this quarter', color: 'lime' },
    { value: '2,184', label: 'Community members', color: 'default' },
    { value: '1 LIVE', label: 'Happening now', color: 'amber' },
    { value: 'Davao', label: 'Home base · PH', color: 'default' }
  ];

  return (
    <div className="grid grid-cols-4 border-t border-b border-line-soft">
      {stats.map((stat, index) => (
        <div key={index} className={`px-[18px] py-[22px] text-left ${index < stats.length - 1 ? 'border-r border-line-soft' : ''}`}>
          <div
            className={`text-[28px] font-semibold tracking-[-0.03em] ${
              stat.color === 'lime' ? 'text-lime' : stat.color === 'amber' ? 'text-amber' : 'text-text'
            }`}
          >
            {stat.value}
          </div>
          <div className="mt-1 font-mono text-[11px] tracking-[0.16em] text-text-mute uppercase">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
