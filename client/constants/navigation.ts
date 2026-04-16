import { LayoutDashboard, User, Users, ArrowLeftRight, Headphones, Settings, FlaskConical, MapPin } from 'lucide-react';

export const dashboardNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Profile', icon: User, href: '/admin/user/profile' },
  {
    label: 'Accordion Parent',
    icon: ArrowLeftRight,
    href: '#',
    children: [
      { label: 'Child 1', href: '#', badge: 19 },
      { label: 'Child 2', href: '#' },
      { label: 'Child 3', href: '#' }
    ]
  },
  { label: 'Kitchen Sink', icon: FlaskConical, href: '/kitchen-sink' },
  { label: 'Venue', icon: MapPin, href: '#' }
];

export const dashboardBottomNavItems = [
  { label: 'Settings', icon: Settings, href: '/admin/user/settings/profile' },
  { label: 'Support', icon: Headphones, href: '#' }
];
