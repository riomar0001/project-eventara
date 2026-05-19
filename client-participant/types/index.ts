/**
 * Form types
 */
import { ApiVenueType, Amenity } from './venue';

export interface AddVenueFormData {
  name: string;
  address_line: string;
  city: string;
  province: string;
  capacity: string;
  venue_type: ApiVenueType;
  amenities: Amenity[];
  description?: string;
  contact_name?: string;
  contact_email?: string;
}

export interface ReportFormData {
  reason: 'inaccurate' | 'closed' | 'duplicate' | 'inappropriate' | 'other';
  detail: string;
}

export interface FormErrors {
  [key: string]: string;
}
