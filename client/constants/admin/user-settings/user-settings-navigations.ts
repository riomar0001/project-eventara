import { Clock3, Shield, Trash2, UserRound } from 'lucide-react';

export const settingsItems = [
  {
    label: 'Profile',
    description: 'Update your personal information.',
    href: '/user/settings/profile',
    icon: UserRound
  },
  {
    label: 'Security',
    description: 'Change your password.',
    href: '/user/settings/password',
    icon: Shield
  },
  {
    label: 'Login History',
    description: 'Review recent sign-ins to your account.',
    href: '/user/settings/login-history',
    icon: Clock3
  },
  {
    label: 'Delete Account',
    description: 'Schedule account removal after a 30-day grace period.',
    href: '/user/settings/delete-account',
    icon: Trash2,
    destructive: true
  }
];
