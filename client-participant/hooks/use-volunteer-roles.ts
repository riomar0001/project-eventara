'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Volunteers } from '@/api/sdk.gen';
import { humanizeApiError } from '@/lib/api-error';

export interface VolunteerRole {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface UseVolunteerRolesReturn {
  roles: VolunteerRole[];
  loading: boolean;
  error: string | null;
}

export function useVolunteerRoles(): UseVolunteerRolesReturn {
  const token = useAuthStore((s) => s.accessToken);
  const [roles, setRoles] = useState<VolunteerRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    Volunteers.getAllVolunteerRolesVolunteerRolesGet({
      query: { is_active: true, page_size: 100 },
      headers: { Authorization: `Bearer ${token}` },
    }).then(({ data, error: apiError }) => {
      if (apiError || !data) {
        setError(
          humanizeApiError(
            (apiError as { message?: string } | null)?.message,
            'Unable to load volunteer roles.',
          ),
        );
      } else {
        const payload = data as { data?: { roles?: VolunteerRole[] } };
        setRoles(payload.data?.roles ?? []);
      }
      setLoading(false);
    });
  }, [token]);

  return { roles, loading, error };
}
