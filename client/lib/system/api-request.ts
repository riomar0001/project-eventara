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

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
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

export function getAuthHeaders() {
  return {
    Authorization: `Bearer ${getAccessToken()}`
  };
}
