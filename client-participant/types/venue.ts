/**
 * Core Venue Hub types
 */

export enum VenueType {
  Convention = 'Convention',
  Ballroom = 'Ballroom',
  Auditorium = 'Auditorium',
  Lounge = 'Lounge',
  Theatre = 'Theatre',
  Coworking = 'Coworking',
  Studio = 'Studio',
  Garden = 'Garden'
}

export type ApiVenueType = 'indoor' | 'outdoor' | 'hybrid';

export interface ApiVenue {
  id: string;
  creator_alias: string | null;
  image_url: string | null;
  name: string;
  description: string | null;
  address_line: string;
  city: string;
  province: string;
  capacity: number;
  venue_type: ApiVenueType;
  popularity_count: number;
  usage_count: number;
  is_partner: boolean;
  amenities: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  average_rating: number | null;
  rating_count: number;
  orb: 'lime' | 'amber';
  angle: string;
}

export interface VenuePagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

// Legacy type kept for AddVenueModal/ReportModal forms
export interface Venue {
  id: number;
  name: string;
  location: string;
  capacity: number;
  type: string;
  rating: number;
  reviews: number;
  contributor: { username: string; date: string };
  tags: string[];
  amenities: string[];
  orb: 'lime' | 'amber';
  angle: string;
}

export type Amenity = 'wifi' | 'parking' | 'coffee' | 'mic';
