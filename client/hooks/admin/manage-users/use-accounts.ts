'use client';

import { useEffect, useState } from 'react';
import { Users } from '@/api/sdk.gen';
import type {
  AdminUserAccountPaginationResponse as AdminUserAccountPagination,
  AdminUserAccountSummaryResponse as AdminUserAccountSummary,
  UserStatus
} from '@/api/types.gen';
import { getAccessToken } from '@/store/auth-store';

function extractErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;

  const maybePayload = payload as { detail?: unknown; message?: unknown };

  if (typeof maybePayload.detail === 'string') return maybePayload.detail;

  if (Array.isArray(maybePayload.detail) && maybePayload.detail.length > 0) {
    const first = maybePayload.detail[0];
    if (typeof first === 'string') return first;

    if (first && typeof first === 'object') {
      const validationError = first as { msg?: unknown; message?: unknown };
      if (typeof validationError.msg === 'string') return validationError.msg;
      if (typeof validationError.message === 'string') return validationError.message;
    }
  }

  if (typeof maybePayload.message === 'string') return maybePayload.message;
  return undefined;
}

function getAdminUserAccountErrorMessage(error: unknown, fallbackMessage: string) {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const responseData = (error as { response?: { data?: unknown } }).response?.data;
    const responseMessage = extractErrorMessage(responseData);
    if (responseMessage) return responseMessage;

    const payloadMessage = extractErrorMessage(error);
    if (payloadMessage) return payloadMessage;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallbackMessage;
}

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

export function useAdminUserAccounts(page: number, pageSize: number = 10, search?: string, statusFilter?: UserStatus, roleFilter?: string) {
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
        const accessToken = getAccessToken();

        const result = await Users.listUserAccountsUserAccountsGet({
          query: {
            page,
            page_size: pageSize,
            ...(search ? { search } : {}),
            ...(statusFilter ? { status: statusFilter } : {}),
            ...(roleFilter ? { role: roleFilter } : {})
          },
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          throwOnError: false
        });

        if (!result.data) {
          throw result.error ?? new Error('Unable to load user accounts right now.');
        }

        const response = result.data;

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
  }, [page, pageSize, search, statusFilter, roleFilter, reloadToken]);

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
