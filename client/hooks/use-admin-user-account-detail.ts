'use client';

import { useEffect, useState } from 'react';
import { AdminUserAccounts } from '@/api/sdk.gen';
import type { AdminUserAccountDetailResponse as AdminUserAccountDetail } from '@/api/types.gen';

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
        const result = await AdminUserAccounts.getUserAccountDetailUserAccountsUserIdGet({
          path: { user_id: targetUserId },
          throwOnError: false
        });

        if (!result.data) {
          throw result.error ?? new Error('Unable to load user details right now.');
        }

        const response = result.data;

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
