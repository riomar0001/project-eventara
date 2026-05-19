'use client';

import { useState, useEffect } from 'react';
import { AccountSettings } from '@/api/sdk.gen';
import type { UserDetailsData } from '@/api/types.gen';

export type { UserDetailsData };

export function useUserDetails() {
  const [userDetails, setUserDetails] = useState<UserDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AccountSettings.getUserDetailsUserProfileGet().then(({ data, error: apiError }) => {
      if (apiError || !data) {
        setError('Unable to load your profile. Please try refreshing.');
      } else {
        setUserDetails(data.data);
      }
      setLoading(false);
    });
  }, []);

  return { userDetails, loading, error };
}
