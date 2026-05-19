'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { FeedbackForm } from '@/components/events/feedback/feedback-form';

interface FeedbackModalProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ eventId, eventTitle, isOpen, onClose }: FeedbackModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-[520px] animate-[modal-pop_200ms_ease]">
        <button
          onClick={onClose}
          className="border-border bg-card text-muted-foreground hover:text-foreground absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
          aria-label="Close"
        >
          <X size={15} />
        </button>
        <FeedbackForm eventId={eventId} eventTitle={eventTitle} onClose={onClose} />
      </div>
    </div>
  );
}
