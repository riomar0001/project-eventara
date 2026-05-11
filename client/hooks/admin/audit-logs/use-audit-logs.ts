'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import type { AuditLogFilterValues } from '@/types/admin/audit-logs';
import { AuditLogs } from '@/api/sdk.gen';
import type { AuditLogResponse, AppControllerSchemasAuditLogSchemaPaginationMeta as PaginationMeta } from '@/api/types.gen';
import { DEFAULT_AUDIT_LOG_FILTERS } from '@/constants/admin/audit-logs';
import { formatAuditDateBoundary, countActiveAuditFilters } from '@/lib/admin/audit-logs/helpers';
import { getAccessToken } from '@/store/auth-store';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuidLike(value: string) {
  return UUID_PATTERN.test(value);
}

function getAuditValidationMessage(detail: unknown): string | undefined {
  if (!Array.isArray(detail) || detail.length === 0) return undefined;

  for (const entry of detail) {
    if (!entry || typeof entry !== 'object') continue;

    const validationEntry = entry as { path?: unknown; loc?: unknown; message?: unknown; msg?: unknown };
    const rawPath = Array.isArray(validationEntry.path) ? validationEntry.path : Array.isArray(validationEntry.loc) ? validationEntry.loc : [];

    const message =
      typeof validationEntry.message === 'string' ? validationEntry.message : typeof validationEntry.msg === 'string' ? validationEntry.msg : undefined;

    if (rawPath.includes('user_id')) {
      return 'Enter a valid user ID to search the audit ledger.';
    }

    if (message) {
      return message;
    }
  }

  return undefined;
}

function tryParseJsonString(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function extractErrorMessage(payload: unknown): string | undefined {
  if (typeof payload === 'string') {
    const parsed = tryParseJsonString(payload);
    if (parsed !== undefined) {
      const parsedMessage = extractErrorMessage(parsed);
      if (parsedMessage) return parsedMessage;
    }

    return undefined;
  }

  if (!payload || typeof payload !== 'object') return undefined;

  const maybePayload = payload as { detail?: unknown; message?: unknown };

  if (typeof maybePayload.detail === 'string') {
    const parsedDetail = tryParseJsonString(maybePayload.detail);
    if (parsedDetail !== undefined) {
      const parsedMessage = extractErrorMessage({ detail: parsedDetail });
      if (parsedMessage) return parsedMessage;
    }

    return maybePayload.detail;
  }

  const validationMessage = getAuditValidationMessage(maybePayload.detail);
  if (validationMessage) return validationMessage;

  if (Array.isArray(maybePayload.detail) && maybePayload.detail.length > 0) {
    const first = maybePayload.detail[0];

    if (typeof first === 'string') return first;
  }

  if (typeof maybePayload.message === 'string') return maybePayload.message;
  return undefined;
}

function getAuditErrorMessage(error: unknown, fallbackMessage: string) {
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

function getInitialPagination(limit: number): PaginationMeta {
  return {
    has_next: false,
    limit,
    next_cursor: null,
    prev_cursor: null,
    total_pages: 0
  };
}

function getRequestHeaders() {
  const accessToken = getAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

export function useAuditLogs() {
  const [filters, setFilters] = useState<AuditLogFilterValues>(DEFAULT_AUDIT_LOG_FILTERS);
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(() => getInitialPagination(DEFAULT_AUDIT_LOG_FILTERS.limit));
  const [pageIndex, setPageIndex] = useState(1);
  const [cursor, setCursor] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedUserId = useDebounce(filters.userId.trim(), 350);
  const debouncedResourceType = useDebounce(filters.resourceType.trim(), 350);

  useEffect(() => {
    let cancelled = false;

    async function loadAuditLogs() {
      if (debouncedUserId && !isUuidLike(debouncedUserId)) {
        setLogs([]);
        setPagination(getInitialPagination(filters.limit));
        setError('Enter a valid user ID to search the audit ledger.');
        setIsLoading(false);
        return;
      }

      if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
        setLogs([]);
        setPagination(getInitialPagination(filters.limit));
        setError('Start date must be earlier than or equal to the end date.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const actionType = filters.actionType === 'all' ? undefined : filters.actionType;
        const startDate = filters.startDate ? formatAuditDateBoundary(filters.startDate, 'start') : undefined;
        const endDate = filters.endDate ? formatAuditDateBoundary(filters.endDate, 'end') : undefined;

        const result = await AuditLogs.getAuditLogsAuditLogsGet({
          headers: getRequestHeaders(),
          query: {
            limit: filters.limit,
            ...(cursor ? { cursor } : {}),
            ...(debouncedUserId ? { user_id: debouncedUserId } : {}),
            ...(actionType ? { action_type: actionType } : {}),
            ...(debouncedResourceType ? { resource_type: debouncedResourceType } : {}),
            ...(startDate ? { start_date: startDate } : {}),
            ...(endDate ? { end_date: endDate } : {})
          },
          throwOnError: false
        });

        if (!result.data) {
          throw result.error ?? new Error('Unable to load audit logs right now.');
        }

        if (!cancelled) {
          setLogs(result.data.data);
          setPagination(result.data.pagination);
        }
      } catch (nextError) {
        if (!cancelled) {
          setLogs([]);
          setPagination(getInitialPagination(filters.limit));
          setError(getAuditErrorMessage(nextError, 'Unable to load audit logs right now.'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAuditLogs();

    return () => {
      cancelled = true;
    };
  }, [cursor, debouncedResourceType, debouncedUserId, filters.actionType, filters.endDate, filters.limit, filters.startDate, reloadToken]);

  function updateFilter<Key extends keyof AuditLogFilterValues>(key: Key, value: AuditLogFilterValues[Key]) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value
    }));
    setCursor(null);
    setPageIndex(1);
  }

  function clearFilters() {
    setFilters(DEFAULT_AUDIT_LOG_FILTERS);
    setCursor(null);
    setPageIndex(1);
  }

  function goToNextPage() {
    if (!pagination.next_cursor || isLoading) return;
    setCursor(pagination.next_cursor);
    setPageIndex((currentPage) => currentPage + 1);
  }

  function goToPreviousPage() {
    if (!pagination.prev_cursor || isLoading) return;
    setCursor(pagination.prev_cursor);
    setPageIndex((currentPage) => Math.max(1, currentPage - 1));
  }

  function refresh() {
    setReloadToken((currentToken) => currentToken + 1);
  }

  return {
    activeFilterCount: countActiveAuditFilters(filters),
    clearFilters,
    error,
    filters,
    goToNextPage,
    goToPreviousPage,
    isEmpty: !isLoading && !error && logs.length === 0,
    isLoading,
    logs,
    pageIndex,
    pagination,
    refresh,
    resourceSuggestions: Array.from(new Set(logs.map((log) => log.resource_type))).sort(),
    updateFilter
  };
}
