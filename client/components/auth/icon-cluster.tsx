type IconVariant = 'primary' | 'success' | 'destructive' | 'warning';

const colors: Record<IconVariant, { ring: string; mid: string; inner: string; icon: string }> = {
  primary: { ring: 'bg-primary/10', mid: 'bg-primary/10', inner: 'bg-primary/15 border-primary/25', icon: 'text-primary' },
  success: { ring: 'bg-primary/12', mid: 'bg-primary/10', inner: 'bg-primary/15 border-primary/30', icon: 'text-primary' },
  destructive: { ring: 'bg-destructive/10', mid: 'bg-destructive/8', inner: 'bg-destructive/12 border-destructive/25', icon: 'text-destructive' },
  warning: { ring: 'bg-amber-400/10', mid: 'bg-amber-400/8', inner: 'bg-amber-400/12 border-amber-400/25', icon: 'text-amber-500' }
};

interface IconClusterProps {
  icon: React.ElementType;
  variant: IconVariant;
  spin?: boolean;
}

export function IconCluster({ icon: Icon, variant, spin = false }: IconClusterProps) {
  const c = colors[variant];
  return (
    <div className="relative flex items-center justify-center">
      <div className={`absolute h-24 w-24 rounded-full ${c.ring}`} style={{ animation: 'ping 2.5s cubic-bezier(0,0,0.2,1) infinite' }} />
      <div className={`absolute h-18 w-18 rounded-full ${c.mid}`} />
      <div className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 ${c.inner}`}>
        <Icon className={`h-6 w-6 ${c.icon} ${spin ? 'animate-spin' : ''}`} strokeWidth={1.5} />
      </div>
    </div>
  );
}
