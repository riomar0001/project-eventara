'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { AlertCircle, Camera, CheckCircle2, Loader2, QrCode, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { EventParticipants } from '@/api/sdk.gen';
import { getApiErrorMessage, getAuthHeaders } from '@/lib/system/api-request';
import { cn } from '@/lib/utils';

type ScanResult = {
  kind: 'success' | 'already' | 'failed';
  title: string;
  message: string;
};

function getResultFromError(error: unknown): ScanResult {
  const message = getApiErrorMessage(error, 'Unable to check in participant.');
  if (message.toLowerCase().includes('already checked in')) {
    return {
      kind: 'already',
      title: 'Already checked in',
      message
    };
  }

  return {
    kind: 'failed',
    title: 'Check-in failed',
    message
  };
}

export function EventQrScannerPanel({ onCheckedIn }: { onCheckedIn: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const isSubmittingRef = useRef(false);
  const resultRef = useRef<ScanResult | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  }, []);

  const checkInToken = useCallback(
    async (token: string) => {
      const trimmed = token.trim();
      if (!trimmed || isSubmittingRef.current || resultRef.current) return;

      stopCamera();
      setIsSubmitting(true);
      setScannerError(null);

      try {
        const response = await EventParticipants.checkInParticipantQrCodeEventsParticipantsCheckInQrPost({
          body: { token: trimmed },
          headers: getAuthHeaders(),
          throwOnError: false
        });

        if (!response.data) throw response.error ?? new Error('Unable to check in participant.');

        setResult({
          kind: 'success',
          title: 'Checked In Successfully',
          message: response.data.message ?? 'Participant checked in successfully.'
        });
        setManualToken('');
        onCheckedIn();
      } catch (error) {
        setResult(getResultFromError(error));
      } finally {
        setIsSubmitting(false);
      }
    },
    [onCheckedIn, stopCamera]
  );

  const startCamera = useCallback(async () => {
    setScannerError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerError('Camera access is not available in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
    } catch (error) {
      setScannerError(getApiErrorMessage(error, 'Unable to start camera scanning.'));
      stopCamera();
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!isCameraActive) return;
    let cancelled = false;

    function scanFrame() {
      if (cancelled || !videoRef.current || !canvasRef.current || isSubmittingRef.current || resultRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && width > 0 && height > 0) {
        try {
          const context = canvas.getContext('2d', { willReadFrequently: true });
          if (context) {
            canvas.width = width;
            canvas.height = height;
            context.drawImage(video, 0, 0, width, height);
            const imageData = context.getImageData(0, 0, width, height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

            if (code?.data) {
              void checkInToken(code.data);
              return;
            }
          } else {
            setScannerError('Unable to prepare the camera frame for QR scanning.');
            return;
          }
        } catch {
          setScannerError('Unable to read the QR code from the camera feed.');
        }
      }

      frameRef.current = window.requestAnimationFrame(scanFrame);
    }

    frameRef.current = window.requestAnimationFrame(scanFrame);
    return () => {
      cancelled = true;
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [checkInToken, isCameraActive]);

  useEffect(() => stopCamera, [stopCamera]);

  const ResultIcon = result?.kind === 'success' ? CheckCircle2 : result?.kind === 'already' ? AlertCircle : XCircle;

  return (
    <>
      <Dialog open={!!result} onOpenChange={(open) => !open && setResult(null)}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          {result && (
            <>
              <DialogHeader className="items-center text-center">
                <div
                  className={cn(
                    'flex size-12 items-center justify-center rounded-full',
                    result.kind === 'success' && 'bg-emerald-50 text-emerald-600',
                    result.kind === 'already' && 'bg-amber-50 text-amber-600',
                    result.kind === 'failed' && 'bg-red-50 text-red-600'
                  )}
                >
                  <ResultIcon className="size-6" />
                </div>
                <DialogTitle>{result.title}</DialogTitle>
              </DialogHeader>
              <p className="text-center text-sm leading-6 text-neutral-600">{result.message}</p>
              <DialogFooter>
                <Button type="button" className="w-full" onClick={() => setResult(null)}>
                  ok
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="mx-auto max-w-lg space-y-4">
        <div className="overflow-hidden rounded-2xl bg-neutral-950 ring-1 ring-neutral-800">
          <div className="relative mx-auto aspect-[4/3] max-h-[360px] bg-neutral-900">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-neutral-400">
                <QrCode className="size-8" />
                <p className="text-sm">Camera scanner is idle.</p>
              </div>
            )}
            {isSubmitting && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/70 text-white">
                <Loader2 className="size-6 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {scannerError && (
          <div className="flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-sm leading-6 text-amber-800">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{scannerError}</span>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={() => void startCamera()} disabled={isCameraActive || isSubmitting || !!result} className="rounded-xl">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            Start scanner
          </Button>
          <Button type="button" variant="outline" onClick={stopCamera} disabled={!isCameraActive || isSubmitting}>
            Stop
          </Button>
        </div>

        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void checkInToken(manualToken);
          }}
        >
          <Input value={manualToken} onChange={(event) => setManualToken(event.target.value)} placeholder="Paste QR token" disabled={isSubmitting || !!result} />
          <Button type="submit" variant="outline" disabled={!manualToken.trim() || isSubmitting || !!result}>
            Check in
          </Button>
        </form>
      </div>
    </>
  );
}
