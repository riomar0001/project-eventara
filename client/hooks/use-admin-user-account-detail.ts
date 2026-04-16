'use client';

import { useEffect, useState } from 'react';
import { getAdminUserAccountDetail, getAdminUserAccountErrorMessage, type AdminUserAccountDetail } from '@/api/admin-user-accounts';

export function useAdminUserAccountDetail(userId: string | null) {
  const [detail, setDetail] = useState<AdminUserAccountDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!userId) {
      setDetail(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const targetUserId = userId;

    let cancelled = false;

    async function loadDetail() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getAdminUserAccountDetail(targetUserId);

        if (!cancelled) {
          setDetail(response);
        }
      } catch (nextError) {
        if (!cancelled) {
          setDetail(null);
          setError(getAdminUserAccountErrorMessage(nextError, 'Unable to load user details right now.'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [reloadToken, userId]);

  function refresh() {
    if (!userId) return;
    setReloadToken((current) => current + 1);
  }

  return {
    detail,
    error,
    isLoading,
    refresh
  };
}
