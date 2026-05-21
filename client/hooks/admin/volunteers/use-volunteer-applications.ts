'use client';

import { useEffect, useRef, useState } from 'react';
import { Volunteers } from '@/api/sdk.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';

export type ApplicationRecord = {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  application_data: {
    preferred_role?: string;
    contact_phone?: string;
    reason?: string;
    skills_experience?: string;
    availability?: string;
  } | null;
  first_name: string | null;
  last_name: string | null;
  alias: string | null;
  email: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ApplicationsResponse = {
  applications: ApplicationRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export function useVolunteerApplications(pageSize = 20) {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilterState] = useState<ApplicationRecord['status'] | null>(null);
  const [search, setSearchState] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setSearch(value: string) {
    setSearchState(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 350);
  }

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const result = await Volunteers.listApplicationsVolunteerApplicationsGet({
          query: {
            page,
            page_size: pageSize,
            ...(statusFilter !== null ? { status: statusFilter } : {}),
            ...(debouncedSearch ? { search: debouncedSearch } : {}),
          },
          headers: getAuthHeaders(),
          throwOnError: false,
        });

        if (!result.data) throw result.error ?? new Error('Unable to load applications.');

        const payload = result.data as { data: ApplicationsResponse };
        if (!cancelled) {
          setApplications(payload.data.applications);
          setTotal(payload.data.total);
          setTotalPages(payload.data.total_pages);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load volunteer applications.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, statusFilter, debouncedSearch, refreshKey]);

  function setStatusFilter(s: ApplicationRecord['status'] | null) {
    setStatusFilterState(s);
    setPage(1);
  }

  return {
    applications,
    total,
    page,
    pageSize,
    totalPages,
    statusFilter,
    search,
    isLoading,
    error,
    setPage,
    setStatusFilter,
    setSearch,
    refetch: () => setRefreshKey((k) => k + 1),
  };
}
