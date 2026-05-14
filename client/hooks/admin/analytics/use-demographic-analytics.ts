'use client';

import { useEffect, useState } from 'react';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

interface DeviceBreakdown {
  device_type: string;
  count: number;
  percentage: number | null;
}

interface OsBreakdown {
  os: string;
  count: number;
  percentage: number | null;
}

interface BrowserBreakdown {
  browser: string;
  count: number;
  percentage: number | null;
}

interface CityParticipation {
  city: string;
  country: string | null;
  participant_count: number;
}

interface AccountAgeDistribution {
  bucket: string;
  count: number;
  percentage: number | null;
}

interface VolunteerRoleBreakdown {
  role_name: string;
  count: number;
}

interface EventInterestCategory {
  category: string | null;
  event_count: number;
  registration_count: number;
}

interface FirstTimeVsReturning {
  event_id: string;
  event_title: string;
  first_time_count: number;
  returning_count: number;
}

interface GenderDistribution {
  gender: string;
  count: number;
  percentage: number | null;
}

interface GeographicSpread {
  city: string;
  latitude: number | null;
  longitude: number | null;
  participant_count: number;
}

interface DemographicAnalytics {
  device_breakdown: DeviceBreakdown[];
  os_breakdown: OsBreakdown[];
  browser_breakdown: BrowserBreakdown[];
  top_cities: CityParticipation[];
  account_age_distribution: AccountAgeDistribution[];
  volunteer_role_breakdown: VolunteerRoleBreakdown[];
  event_interest_categories: EventInterestCategory[];
  first_time_vs_returning: FirstTimeVsReturning[];
  gender_distribution: GenderDistribution[];
  geographic_spread: GeographicSpread[];
}

export function useDemographicAnalytics() {
  const [data, setData] = useState<DemographicAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/analytics/demographics', {
          headers: getAuthHeaders()
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? 'Failed to load demographic analytics');
        }
        const json = await res.json();
        if (!cancelled) setData((json as { data: DemographicAnalytics }).data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load demographic analytics'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}
