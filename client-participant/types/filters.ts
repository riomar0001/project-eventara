/**
 * Filter and sort option types
 */

export interface CapacityFilter {
  key: 'any' | '50' | '100' | '500';
  label: string;
  min?: number;
}

export interface SortOption {
  key: 'rating' | 'newest' | 'capacity' | 'name';
  label: string;
}

export interface AmenityOption {
  key: 'wifi' | 'parking' | 'coffee' | 'mic';
  label: string;
  icon: string;
}

export interface FilterChip {
  k: 'cap' | 'q';
  label: string;
  value: string;
}
