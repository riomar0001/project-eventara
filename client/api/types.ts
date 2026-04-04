import { ZodError } from 'zod';
import { ApiError } from './client';

// ─── Common ───────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string | null;
  data?: T;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === undefined) {
    throw new ApiError(response.message || 'Request failed');
  }
  return response.data;
}

export function handleValidationError(error: ZodError): ApiError {
  const errorMap = error.issues.reduce(
    (acc, issue) => {
      const path = issue.path.join('.');
      if (!acc[path]) acc[path] = [];
      acc[path].push(issue.message);
      return acc;
    },
    {} as Record<string, string[]>,
  );
  return new ApiError(error.issues[0]?.message || 'Validation error', 400, errorMap);
}