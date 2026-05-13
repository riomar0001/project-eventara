/**
 * Capacity filter options
 */
import type { CapacityFilter } from '@/types/filters';

export const CAPACITY_FILTERS: CapacityFilter[] = [
  { key: 'any', label: 'Any size', min: 0 },
  { key: '50', label: '50+ pax', min: 0 },
  { key: '100', label: '100+ pax', min: 50 },
  { key: '500', label: '500+ pax', min: 100 }
];
