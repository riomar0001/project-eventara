export interface DirectoryEvent {
  id: number;
  day: string;
  mo: string;
  year: number;
  date: string;
  time: string;
  title: string;
  desc: string;
  venue: string;
  cat: string;
  tags: string[];
  seats: number;
  total: number;
  status: 'closing' | 'live' | 'new' | null;
  orb: 'lime' | 'amber';
  angle: string;
}

export interface EventCategory {
  key: string;
  label: string;
}

export interface FeaturedEvent {
  tag: string;
  title: string;
  desc: string;
  date: string;
  time: string;
  venue: string;
}

export type SortOption = 'date' | 'popularity' | 'availability';

export type DensityMode = 'comfortable' | 'compact';

export type BannerVariant = 'featured' | 'hidden';

export type BadgeStyle = 'floating' | 'lime';

export type ViewMode = 'grid' | 'list';

export interface TweaksConfig {
  density: DensityMode;
  bannerVariant: BannerVariant;
  badgeStyle: BadgeStyle;
}
