/**
 * Form types
 */
import { VenueType, Amenity } from './venue';

export interface AddVenueFormData {
  name: string;
  location: string;
  capacity: string;
  type: VenueType;
  amenities: Amenity[];
  notes?: string;
}

export interface ReportFormData {
  reason: 'inaccurate' | 'closed' | 'duplicate' | 'inappropriate' | 'other';
  detail: string;
}

export interface FormErrors {
  [key: string]: string;
}
