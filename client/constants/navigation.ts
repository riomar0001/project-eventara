import { LayoutDashboard, User, ArrowLeftRight, Waves, Wallet, TrendingUp, Headphones, Settings, FlaskConical, MapPin } from 'lucide-react';

export const dashboardNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '#', active: true },
  { label: 'Accounts', icon: User, href: '#' },
  {
    label: 'Transactions',
    icon: ArrowLeftRight,
    href: '#',
    children: [
      { label: 'History', href: '#', badge: 19 },
      { label: 'Integration', href: '#' },
      { label: 'Reports', href: '#' }
    ]
  },
  { label: 'Cash flow', icon: Waves, href: '#' },
  { label: 'Budget', icon: Wallet, href: '#' },
  { label: 'Investments', icon: TrendingUp, href: '#' },
  { label: 'Kitchen Sink', icon: FlaskConical, href: '/kitchen-sink' },
  { label: 'Venue', icon: MapPin, href: '#' }
];

export const dashboardBottomNavItems = [
  { label: 'Settings', icon: Settings, href: '#' },
  { label: 'Support', icon: Headphones, href: '#' }
]; 
