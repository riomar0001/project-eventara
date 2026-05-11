'use client';

import { useEffect, useState } from 'react';
import { Volunteers } from '@/api/sdk.gen';
import type { VolunteerStatus } from '@/api/types.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

export type VolunteerRecord = {
  id: string;
  user_id: string;
  contact_phone: string;
  volunteer_role_id: string;
  status: VolunteerStatus;
  first_name: string | null;
  last_name: string | null;
  alias: string | null;
  email: string | null;
  role_name: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type VolunteersResponse = {
  volunteers: VolunteerRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export function useVolunteers(pageSize = 20) {
  const [volunteers, setVolunteers] = useState<VolunteerRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilterState] = useState<VolunteerStatus | null>(null);
  const [roleIdFilter, setRoleIdFilterState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const result = await Volunteers.getAllVolunteersVolunteersGet({
          query: {
            page,
            page_size: pageSize,
            ...(statusFilter !== null ? { status: statusFilter } : {}),
            ...(roleIdFilter !== null ? { role_id: roleIdFilter } : {}),
          },
          headers: getAuthHeaders(),
          throwOnError: false,
        });

        if (!result.data) throw result.error ?? new Error('Unable to load volunteers.');

        const payload = result.data as { data: VolunteersResponse };
        if (!cancelled) {
          setVolunteers(payload.data.volunteers);
          setTotal(payload.data.total);
          setTotalPages(payload.data.total_pages);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load volunteers.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, statusFilter, roleIdFilter, refreshKey]);

  function setStatusFilter(status: VolunteerStatus | null) {
    setStatusFilterState(status);
    setPage(1);
  }

  function setRoleIdFilter(roleId: string | null) {
    setRoleIdFilterState(roleId);
    setPage(1);
  }

  return {
    volunteers,
    total,
    page,
    pageSize,
    totalPages,
    statusFilter,
    roleIdFilter,
    isLoading,
    error,
    setPage,
    setStatusFilter,
    setRoleIdFilter,
    refetch: () => setRefreshKey((k) => k + 1),
  };
}
