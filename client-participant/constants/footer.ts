import { NavLink, SocialLink } from '@/types/common';
import { LOGO_TEXT } from '@/constants/navigation';

export const FOOTER_LINKS_SECTION_1: NavLink[] = [
  { label: 'Events', href: '#events' },
  { label: 'Community', href: '#community' },
  { label: 'About Us', href: '#about' }
];

export const FOOTER_LINKS_SECTION_2: NavLink[] = [
  { label: 'Contact', href: '#contact' },
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'Terms of Service', href: '#terms' }
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Twitter', href: 'https://twitter.com', icon: 'twitter' },
  { label: 'Discord', href: 'https://discord.com', icon: 'discord' },
  { label: 'Telegram', href: 'https://telegram.org', icon: 'telegram' }
];

export const FOOTER_COPYRIGHT = `© ${new Date().getFullYear()} Eventara. All rights reserved.`;
export const FOOTER_COMPANY_NAME = 'Eventara';
export { LOGO_TEXT };
