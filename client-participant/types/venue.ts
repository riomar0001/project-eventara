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

export interface VenueContributor {
  username: string;
  date: string;
}

export interface Venue {
  id: number;
  name: string;
  location: string;
  capacity: number;
  type: VenueType;
  rating: number;
  reviews: number;
  contributor: VenueContributor;
  tags: string[];
  amenities: Amenity[];
  orb: 'lime' | 'amber';
  angle: string;
}

export type Amenity = 'wifi' | 'parking' | 'coffee' | 'mic';
