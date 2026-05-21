'use client';

import { useRef, useState } from 'react';
import { AccountSettings } from '@/api/sdk.gen';
import { useAuthStore } from '@/store/auth-store';
import { decodeTokenUser } from '@/lib/auth/token';
import { humanizeApiError } from '@/lib/api-error';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 2 * 1024 * 1024;

export function useAvatarUpload() {
  const token = useAuthStore((s) => s.accessToken);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    inputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, WebP, or GIF images are allowed.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('File must be under 2 MB.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { data, error: apiError } = await AccountSettings.uploadProfileAvatarUserProfileAvatarPatch({
        body: { content_type: file.type },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (apiError || !data) {
        setError(humanizeApiError((apiError as { message?: string } | null)?.message, 'Failed to get upload URL.'));
        return;
      }

      const uploadResp = await fetch(data.upload.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResp.ok) {
        setError('Upload failed. Please try again.');
        return;
      }

      const freshUser = decodeTokenUser(data.access_token);
      if (freshUser) {
        const store = useAuthStore.getState();
        if (store.refreshToken) {
          store.setAuth(data.access_token, store.refreshToken, {
            ...store.user,
            ...freshUser,
            image: data.data.profile_picture_url,
          });
        }
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return { inputRef, uploading, error, openPicker, handleFileChange };
}
