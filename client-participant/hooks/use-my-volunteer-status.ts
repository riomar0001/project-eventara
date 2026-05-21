'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Volunteers } from '@/api/sdk.gen';
import { humanizeApiError } from '@/lib/api-error';

export type MyApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn' | null;

export interface MyVolunteerApplication {
  id: string;
  status: MyApplicationStatus;
  application_data: {
    preferred_role?: string;
    contact_phone?: string;
    reason?: string;
    skills_experience?: string;
    availability?: string;
  } | null;
  created_at: string | null;
}

interface UseMyVolunteerStatusReturn {
  application: MyVolunteerApplication | null;
  loading: boolean;
  error: string | null;
}

export function useMyVolunteerStatus(): UseMyVolunteerStatusReturn {
  const token = useAuthStore((s) => s.accessToken);
  const [application, setApplication] = useState<MyVolunteerApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    Volunteers.getMyApplicationVolunteerApplicationsMeGet({
      headers: { Authorization: `Bearer ${token}` },
    }).then(({ data, error: apiError }) => {
      if (apiError) {
        setError(humanizeApiError((apiError as { message?: string } | null)?.message, 'Unable to load volunteer status.'));
      } else {
        const payload = data as { data?: MyVolunteerApplication | null };
        setApplication(payload?.data ?? null);
      }
      setLoading(false);
    });
  }, [token]);

  return { application, loading, error };
}
