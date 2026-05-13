import { useState, useCallback } from 'react';

interface ModalState {
  isOpen: boolean;
  selectedEventId: string | null;
}

export function useModalState(initialOpen = false) {
  const [state, setState] = useState<ModalState>({
    isOpen: initialOpen,
    selectedEventId: null
  });

  const openModal = useCallback((eventId: string) => {
    setState({ isOpen: true, selectedEventId: eventId });
  }, []);

  const closeModal = useCallback(() => {
    setState({ isOpen: false, selectedEventId: null });
  }, []);

  return {
    ...state,
    openModal,
    closeModal
  };
}
