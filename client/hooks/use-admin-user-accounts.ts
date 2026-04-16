'use client';

import { useEffect, useState } from 'react';
import {
  getAdminUserAccountErrorMessage,
  listAdminUserAccounts,
  type AdminUserAccountPagination,
  type AdminUserAccountSummary
} from '@/api/admin-user-accounts';

function getInitialPagination(page: number, pageSize: number): AdminUserAccountPagination {
  return {
    page,
    page_size: pageSize,
    total_count: 0,
    total_pages: 0,
    has_next: false,
    has_previous: false
  };
}

export function useAdminUserAccounts(page: number, pageSize: number = 10) {
  const [users, setUsers] = useState<AdminUserAccountSummary[]>([]);
  const [pagination, setPagination] = useState<AdminUserAccountPagination>(() => getInitialPagination(page, pageSize));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await listAdminUserAccounts(page, pageSize);

        if (!cancelled) {
          setUsers(response.data);
          setPagination(response.pagination);
        }
      } catch (nextError) {
        if (!cancelled) {
          setUsers([]);
          setPagination(getInitialPagination(page, pageSize));
          setError(getAdminUserAccountErrorMessage(nextError, 'Unable to load user accounts right now.'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, reloadToken]);

  function refresh() {
    setReloadToken((current) => current + 1);
  }

  return {
    error,
    isEmpty: !isLoading && !error && users.length === 0,
    isLoading,
    pagination,
    refresh,
    users
  };
}
