'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RbacFeatures } from '@/api/sdk.gen';
import type { FeatureCreateRequest, FeatureRecordResponse, FeatureUpdateRequest } from '@/api/types.gen';
import { RBAC_COPY } from '@/constants/rbac-management';
import { getAccessToken } from '@/store/auth-store';

type FeatureDraft = FeatureCreateRequest;

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

function getRbacErrorMessage(error: unknown, fallbackMessage: string) {
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

function getRequestHeaders() {
  const accessToken = getAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

export function useRbacFeatures() {
  const [features, setFeatures] = useState<FeatureRecordResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFeatures() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await RbacFeatures.listFeaturesFeaturesGet({
          headers: getRequestHeaders(),
          throwOnError: false
        });

        if (!result.data) {
          throw result.error ?? new Error('Unable to load RBAC features right now.');
        }

        if (!cancelled) {
          setFeatures(result.data.data);
        }
      } catch (nextError) {
        if (!cancelled) {
          setFeatures([]);
          setError(getRbacErrorMessage(nextError, 'Unable to load RBAC features right now.'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadFeatures();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  function refresh() {
    setReloadToken((current) => current + 1);
  }

  async function createFeature(input: FeatureDraft) {
    if (isSaving || isDeleting) return null;

    setIsSaving(true);

    try {
      const result = await RbacFeatures.createFeatureFeaturesPost({
        body: input,
        headers: getRequestHeaders(),
        throwOnError: false
      });

      if (!result.data) {
        throw result.error ?? new Error('Unable to create the feature right now.');
      }

      toast.success(result.data.message ?? RBAC_COPY.features.savedCreate);
      refresh();
      return result.data.data;
    } catch (nextError) {
      toast.error(getRbacErrorMessage(nextError, 'Unable to create the feature right now.'));
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function updateFeature(featureId: string, input: FeatureUpdateRequest) {
    if (isSaving || isDeleting) return null;

    setIsSaving(true);

    try {
      const result = await RbacFeatures.updateFeatureFeaturesFeatureIdPatch({
        body: input,
        headers: getRequestHeaders(),
        path: { feature_id: featureId },
        throwOnError: false
      });

      if (!result.data) {
        throw result.error ?? new Error('Unable to update the feature right now.');
      }

      toast.success(result.data.message ?? RBAC_COPY.features.savedUpdate);
      refresh();
      return result.data.data;
    } catch (nextError) {
      toast.error(getRbacErrorMessage(nextError, 'Unable to update the feature right now.'));
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteFeature(featureId: string) {
    if (isSaving || isDeleting) return false;

    setIsDeleting(true);

    try {
      const result = await RbacFeatures.deleteFeatureFeaturesFeatureIdDelete({
        headers: getRequestHeaders(),
        path: { feature_id: featureId },
        throwOnError: false
      });

      if (result.error) {
        throw result.error;
      }

      toast.success(RBAC_COPY.features.savedDelete);
      refresh();
      return true;
    } catch (nextError) {
      toast.error(getRbacErrorMessage(nextError, 'Unable to delete the feature right now.'));
      return false;
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    createFeature,
    deleteFeature,
    error,
    features,
    isDeleting,
    isEmpty: !isLoading && !error && features.length === 0,
    isLoading,
    isSaving,
    refresh,
    updateFeature
  };
}
