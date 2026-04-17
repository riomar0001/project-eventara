import { ArrowLeftRight, Blocks, Calendar, FlaskConical, Headphones, LayoutDashboard, MapPin, Settings, ShieldCheck, User, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';

type DashboardNavChild = {
  badge?: number;
  href: string;
  label: string;
};

type DashboardNavItem = {
  children?: DashboardNavChild[];
  href: string;
  icon: LucideIcon;
  label: string;
};

type DashboardNavGroup = {
  items: DashboardNavItem[];
  label: string;
};

export const dashboardNavGroups: DashboardNavGroup[] = [
  {
    label: '',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
      { label: 'Profile', icon: User, href: '/admin/user/profile' }
    ]
  },
  {
    label: 'Event Management',
    items: [
      { label: 'Venue', icon: MapPin, href: ADMIN_OPERATIONS_PATHS.venues },
      { label: 'Events', icon: Calendar, href: ADMIN_OPERATIONS_PATHS.events },
      { label: 'Volunteers', icon: Users, href: ADMIN_OPERATIONS_PATHS.volunteers }
    ]
  },
  {
    label: 'Administration',
    items: [
      { label: 'Features', icon: Blocks, href: '/admin/features' },
      { label: 'Roles', icon: ShieldCheck, href: '/admin/roles' },
      { label: 'Users', icon: Users, href: '/admin/users' },
      {
        label: 'Accordion Parent',
        icon: ArrowLeftRight,
        href: '#',
        children: [
          { label: 'Child 1', href: '#', badge: 19 },
          { label: 'Child 2', href: '#' },
          { label: 'Child 3', href: '#' }
        ]
      }
    ]
  },
  {
    label: 'Dev',
    items: [{ label: 'Kitchen Sink', icon: FlaskConical, href: '/kitchen-sink' }]
  }
];

export const dashboardBottomNavItems: DashboardNavItem[] = [
  { label: 'Settings', icon: Settings, href: '/admin/user/settings/profile' },
  { label: 'Support', icon: Headphones, href: '#' }
];

