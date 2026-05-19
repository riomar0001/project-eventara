/**
 * Hook for managing modal state
 */

'use client';

import { useState } from 'react';
import type { ApiVenue } from '@/types/venue';

interface UseVenueModalsReturn {
  detailVenue: ApiVenue | null;
  openDetail: (v: ApiVenue) => void;
  closeDetail: () => void;
  addVenueOpen: boolean;
  openAddVenue: () => void;
  closeAddVenue: () => void;
  editVenue: ApiVenue | null;
  openEditVenue: (v: ApiVenue) => void;
  closeEditVenue: () => void;
  reportVenue: ApiVenue | null;
  openReport: (v: ApiVenue) => void;
  closeReport: () => void;
  toast: string | null;
  showToast: (message: string, duration?: number) => void;
  closeToast: () => void;
}

export function useVenueModals(): UseVenueModalsReturn {
  const [detailVenue, setDetailVenue] = useState<ApiVenue | null>(null);
  const [addVenueOpen, setAddVenueOpen] = useState(false);
  const [editVenue, setEditVenue] = useState<ApiVenue | null>(null);
  const [reportVenue, setReportVenue] = useState<ApiVenue | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const openDetail = (v: ApiVenue) => setDetailVenue(v);
  const closeDetail = () => setDetailVenue(null);

  const openAddVenue = () => setAddVenueOpen(true);
  const closeAddVenue = () => setAddVenueOpen(false);

  const openEditVenue = (v: ApiVenue) => setEditVenue(v);
  const closeEditVenue = () => setEditVenue(null);

  const openReport = (v: ApiVenue) => setReportVenue(v);
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
