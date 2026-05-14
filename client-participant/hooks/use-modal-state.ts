import { useState, useCallback } from 'react';

export interface UpcomingEvent {
  id: number;
  date: string;
  title: string;
  desc: string;
  venue: string;
  chip: string;
  seats: string;
  orbColor: 'lime' | 'amber';
  angle: string;
}

export function useModalState() {
  const [isOpen, setIsOpen] = useState(false);
  const [event, setEvent] = useState<UpcomingEvent | null>(null);

  const openModal = useCallback((ev: UpcomingEvent) => {
    setEvent(ev);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setEvent(null);
  }, []);

  return { isOpen, event, openModal, closeModal };
}
