'use client';

import { useEffect, useState } from 'react';
import { Volunteers } from '@/api/sdk.gen';
import { getAuthHeaders } from '@/lib/system/api-request';

export type VolunteerRoleOption = { id: string; name: string };

export function useVolunteerRoleList() {
  const [roles, setRoles] = useState<VolunteerRoleOption[]>([]);

  useEffect(() => {
    Volunteers.getAllVolunteerRolesVolunteerRolesGet({
      query: { is_active: true, page_size: 100 },
      headers: getAuthHeaders(),
      throwOnError: false,
    }).then(({ data }) => {
      if (!data) return;
      const payload = data as { data?: { roles?: VolunteerRoleOption[] } };
      setRoles(payload.data?.roles ?? []);
    });
  }, []);

  return roles;
}
