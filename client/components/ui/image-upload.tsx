'use client';

import { useEffect, useRef, useState } from 'react';
import { ImageIcon, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type UploadResourceType, useUpload } from '@/hooks/use-upload';
import { resolveStorageImageUrl } from '@/lib/storage/image-url';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string | null;
  onChange: (publicUrl: string) => void;
  resourceType: UploadResourceType;
  resourceId?: string;
  deferUpload?: boolean;
  onFileSelected?: (file: File | null) => void;
  className?: string;
  disabled?: boolean;
  hint?: string;
}

export function ImageUpload({ value, onChange, resourceType, resourceId, deferUpload, onFileSelected, className, disabled, hint }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useUpload();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayUrl = previewUrl ?? resolveStorageImageUrl(value) ?? null;

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function getUploadContext() {
    if (resourceType === 'event-cover-banner') return { eventId: resourceId };
    if (resourceType === 'venue-image') return { venueId: resourceId };
    return undefined;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = '';

    setError(null);
    try {
      if (deferUpload) {
        const nextPreviewUrl = URL.createObjectURL(file);
        setPreviewUrl(nextPreviewUrl);
        onChange(nextPreviewUrl);
        onFileSelected?.(file);
        return;
      }

      const result = await upload(file, resourceType, getUploadContext());
      setPreviewUrl(result.publicUrl);
      onFileSelected?.(null);
      onChange(result.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    }
  }

  return (
    <div className={cn('aspect-square w-40', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {displayUrl ? (
        <div className="relative h-full w-full overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayUrl} alt="Preview" className="size-full object-cover" />
          {!disabled && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <Button size="sm" variant="secondary" type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {isUploading ? 'Uploading…' : 'Replace'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading}
          className="relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 transition-colors hover:border-neutral-400 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {hint && (
            <span className="absolute top-2.5 right-3 font-mono text-[10px] font-semibold tracking-[0.14em] text-neutral-400 select-none">
              16 : 9
            </span>
          )}
          {isUploading ? (
            <>
              <Loader2 className="size-6 animate-spin text-neutral-400" />
              <span className="text-sm text-neutral-500">Uploading…</span>
            </>
          ) : (
            <>
              <ImageIcon className="size-6 text-neutral-400" />
              <span className="text-sm text-neutral-500">Click to upload image</span>
              <span className="text-xs text-neutral-400">JPEG, PNG, WebP, GIF · max 5 MB</span>
            </>
          )}
        </button>
      )}

      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      {hint && <p className="mt-1.5 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}
