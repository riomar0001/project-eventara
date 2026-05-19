import { useCallback, useState } from 'react';

import type { HomeEventRecord } from './events/use-home-events';

export type { HomeEventRecord as UpcomingEvent };

export function useModalState() {
  const [isOpen, setIsOpen] = useState(false);
  const [event, setEvent] = useState<HomeEventRecord | null>(null);

  const openModal = useCallback((ev: HomeEventRecord) => {
    setEvent(ev);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setEvent(null);
  }, []);

  return { isOpen, event, openModal, closeModal };
}
