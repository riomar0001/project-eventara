import { BarChart3, Blocks, Calendar, Headphones, LayoutDashboard, Logs, MapPin, MessageSquare, Server, Settings, ShieldCheck, User, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ADMIN_OPERATIONS_PATHS } from '@/constants/admin/operations';

type DashboardNavChild = {
  badge?: number;
  href: string;
  label: string;
  permission?: { feature: string; action: string };
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
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Profile', icon: User, href: '/user/profile' }
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
          { label: 'Roster', href: ADMIN_OPERATIONS_PATHS.volunteers, permission: { feature: 'volunteers', action: 'read' } },
          { label: 'Potential Volunteers', href: ADMIN_OPERATIONS_PATHS.volunteerPotentialVolunteers, permission: { feature: 'volunteers', action: 'read' } },
          { label: 'Roles', href: ADMIN_OPERATIONS_PATHS.volunteerRoles, permission: { feature: 'volunteer-roles', action: 'read' } }
        ]
      }
    ]
  },
  {
    label: 'Administration',
    items: [
      { label: 'Analytics', icon: BarChart3, href: ADMIN_OPERATIONS_PATHS.analytics, permission: { feature: 'analytics', action: 'read' } },
      { label: 'Features', icon: Blocks, href: '/features', permission: { feature: 'features', action: 'read' } },
      { label: 'Roles', icon: ShieldCheck, href: '/roles', permission: { feature: 'roles', action: 'read' } },
      { label: 'Users', icon: Users, href: '/users', permission: { feature: 'user-accounts', action: 'read' } },
      { label: 'Queues', icon: Server, href: ADMIN_OPERATIONS_PATHS.queues, permission: { feature: 'queues', action: 'read' } },
      { label: 'Audit Logs', icon: Logs, href: '/audit-logs', permission: { feature: 'audit-logs', action: 'read' } },
      { label: 'Feedback', icon: MessageSquare, href: ADMIN_OPERATIONS_PATHS.feedback, permission: { feature: 'app-feedback', action: 'read' } }
    ]
  }
];

export const dashboardBottomNavItems: DashboardNavItem[] = [
  { label: 'Settings', icon: Settings, href: '/user/settings/profile' },
  { label: 'Support', icon: Headphones, href: '#' }
];
