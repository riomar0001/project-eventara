import {
  Blocks,
  Calendar,
  FlaskConical,
  Headphones,
  LayoutDashboard,
  Logs,
  MapPin,
  Server,
  Settings,
  ShieldCheck,
  User,
  Users
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';

type DashboardNavChild = {
  badge?: number;
  href: string;
  label: string;
};

export type DashboardNavItem = {
  children?: DashboardNavChild[];
  href: string;
  icon: LucideIcon;
  label: string;
  permission?: { feature: string; action: string };
};

export type DashboardNavGroup = {
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
      { label: 'Venue', icon: MapPin, href: ADMIN_OPERATIONS_PATHS.venues, permission: { feature: 'venues', action: 'read' } },
      { label: 'Events', icon: Calendar, href: ADMIN_OPERATIONS_PATHS.events, permission: { feature: 'events', action: 'read' } },
      {
        label: 'Volunteer',
        icon: Users,
        href: ADMIN_OPERATIONS_PATHS.volunteers,
        permission: { feature: 'volunteers', action: 'read' },
        children: [
          { label: 'Roster', href: ADMIN_OPERATIONS_PATHS.volunteers },
          { label: 'Potential Volunteers', href: ADMIN_OPERATIONS_PATHS.volunteerPotentialVolunteers },
          { label: 'Roles', href: ADMIN_OPERATIONS_PATHS.volunteerRoles }
        ]
      }
    ]
  },
  {
    label: 'Administration',
    items: [
      { label: 'Features', icon: Blocks, href: '/admin/features', permission: { feature: 'features', action: 'read' } },
      { label: 'Roles', icon: ShieldCheck, href: '/admin/roles', permission: { feature: 'roles', action: 'read' } },
      { label: 'Users', icon: Users, href: '/admin/users', permission: { feature: 'user-accounts', action: 'read' } },
      { label: 'Queues', icon: Server, href: ADMIN_OPERATIONS_PATHS.queues, permission: { feature: 'queues', action: 'read' } },
      { label: 'Audit Logs', icon: Logs, href: '/admin/audit-logs', permission: { feature: 'audit-logs', action: 'read' } }
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
