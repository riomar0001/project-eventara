/**
 * Hook for managing modal state
 */

'use client';

import { useState } from 'react';
import type { Venue } from '@/types/venue';

interface UseVenueModalsReturn {
  detailVenue: Venue | null;
  openDetail: (v: Venue) => void;
  closeDetail: () => void;
  addVenueOpen: boolean;
  openAddVenue: () => void;
  closeAddVenue: () => void;
  editVenue: Venue | null;
  openEditVenue: (v: Venue) => void;
  closeEditVenue: () => void;
  reportVenue: Venue | null;
  openReport: (v: Venue) => void;
  closeReport: () => void;
  toast: string | null;
  showToast: (message: string, duration?: number) => void;
  closeToast: () => void;
}

export function useVenueModals(): UseVenueModalsReturn {
  const [detailVenue, setDetailVenue] = useState<Venue | null>(null);
  const [addVenueOpen, setAddVenueOpen] = useState(false);
  const [editVenue, setEditVenue] = useState<Venue | null>(null);
  const [reportVenue, setReportVenue] = useState<Venue | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const openDetail = (v: Venue) => setDetailVenue(v);
  const closeDetail = () => setDetailVenue(null);

  const openAddVenue = () => setAddVenueOpen(true);
  const closeAddVenue = () => setAddVenueOpen(false);

  const openEditVenue = (v: Venue) => setEditVenue(v);
  const closeEditVenue = () => setEditVenue(null);

  const openReport = (v: Venue) => setReportVenue(v);
  const closeReport = () => setReportVenue(null);

  const showToast = (message: string, duration = 2600) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  };

  const closeToast = () => setToast(null);

  return {
    detailVenue,
    openDetail,
    closeDetail,
    addVenueOpen,
    openAddVenue,
    closeAddVenue,
    editVenue,
    openEditVenue,
    closeEditVenue,
    reportVenue,
    openReport,
    closeReport,
    toast,
    showToast,
    closeToast
  };
}
