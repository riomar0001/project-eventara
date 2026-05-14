type Props = { limePosition?: 'top-left' | 'top-right'; amberPosition?: 'bottom-right' | 'top-right'; withGrid?: boolean };

export function MeshBg({ limePosition = 'top-left', amberPosition = 'bottom-right', withGrid = true }: Props) {
  const lime = { 'top-left': 'top-[-200px] left-[-200px]', 'top-right': 'top-[-160px] right-[-160px]' }[limePosition];
  const amber = { 'bottom-right': 'right-[-200px] bottom-[-200px]', 'top-right': 'top-[-120px] right-[-140px]' }[amberPosition];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className={`absolute h-[600px] w-[600px] rounded-full blur-[100px] ${lime} bg-[radial-gradient(circle,oklch(0.7_0.2_130_/_0.22),transparent_65%)]`} />
      <div className={`absolute h-[500px] w-[500px] rounded-full blur-[100px] ${amber} bg-[radial-gradient(circle,oklch(0.62_0.16_60_/_0.18),transparent_65%)]`} />
      {withGrid && (
        <div className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'linear-gradient(var(--line-soft) 1px, transparent 1px), linear-gradient(90deg, var(--line-soft) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 80%)'
          }} />
      )}
    </div>
  );
}
