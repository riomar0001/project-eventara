'use client';

import { useEffect, useState } from 'react';
import { X, QrCode, Loader2, AlertCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuthStore } from '@/store/auth-store';
import { humanizeApiError } from '@/lib/api-error';

interface SessionQrModalProps {
  eventId: string;
  sessionId: string;
  sessionTitle: string;
  onClose: () => void;
}

export function SessionQrModal({ eventId, sessionId, sessionTitle, onClose }: SessionQrModalProps) {
  const { accessToken: token } = useAuthStore();
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/events/${eventId}/session/${sessionId}/my-qr`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setQrToken(json.data.qr_token);
        else setError(humanizeApiError(json.message, 'Unable to load your QR code. Please try again.'));
      })
      .catch(() => setError('Unable to load your QR code. Please try again.'))
      .finally(() => setLoading(false));
  }, [token, eventId, sessionId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="bg-background/80 absolute inset-0 backdrop-blur-sm" />
      <div
        className="border-border bg-card relative w-full max-w-sm rounded-3xl border p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground absolute right-4 top-4 rounded-full p-1.5 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
            <QrCode size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-foreground text-[15px] font-semibold tracking-[-0.01em]">Admission QR Code</p>
            <p className="text-muted-foreground mt-0.5 truncate text-[12px]">{sessionTitle}</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-14">
            <Loader2 size={28} className="text-primary animate-spin" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle size={28} className="text-destructive" />
            <p className="text-muted-foreground text-[13px]">{error}</p>
          </div>
        )}

        {qrToken && !loading && (
          <>
            <div className="bg-white mx-auto flex items-center justify-center rounded-2xl p-4">
              <QRCode value={qrToken} size={220} level="L" />
            </div>
            <p className="text-muted-foreground mt-4 text-center text-[12px] leading-relaxed">
              Present this code at the venue entrance to check in.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
