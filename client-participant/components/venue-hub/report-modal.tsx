/**
 * Report Venue Modal
 */

'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import type { ApiVenue } from '@/types/venue';
import { ModalBackdrop } from './modal-backdrop';
import { validateReportForm } from '@/lib/validators';
import type { ReportFormData } from '@/types';

interface ReportModalProps {
  venue: ApiVenue | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReportFormData) => void;
}

const REPORT_REASONS = [
  { value: 'inaccurate', label: 'Inaccurate information' },
  { value: 'closed', label: 'Venue is closed' },
  { value: 'duplicate', label: 'Duplicate listing' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Other' }
];

export function ReportModal({ venue, isOpen, onClose, onSubmit }: ReportModalProps) {
  const [formData, setFormData] = useState<ReportFormData>({
    reason: 'inaccurate',
    detail: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateReportForm(formData);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
    setFormData({ reason: 'inaccurate', detail: '' });
    setErrors({});
    onClose();
  };

  if (!venue) return null;

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="border-line bg-surface w-full max-w-md rounded-3xl border shadow-2xl shadow-[oklch(0_0_0_/_0.3)]">
        {/* Header */}
        <div className="border-line-soft flex items-center justify-between border-b px-8 py-6">
          <h3 className="text-text m-0 text-2xl font-semibold tracking-[-0.02em]">Report venue</h3>
          <button onClick={onClose} className="text-text-mute hover:text-text rounded-lg p-2 transition-all hover:bg-[oklch(1_0_0_/_0.06)]">
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-8 py-6">
          <p className="text-text-dim text-sm">
            Reporting <span className="text-text font-semibold">{venue.name}</span>
          </p>

          {/* Reason */}
          <div>
            <label className="text-text-mute block font-mono text-xs tracking-[0.14em] uppercase">Reason for report</label>
            <select
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="border-line-soft bg-page text-text focus:border-lime mt-1.5 w-full rounded-lg border px-3 py-2.5 transition-all focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none"
            >
              {REPORT_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            {errors.reason && <p className="text-red mt-1 text-xs">{errors.reason}</p>}
          </div>

          {/* Details */}
          <div>
            <label className="text-text-mute block font-mono text-xs tracking-[0.14em] uppercase">Details</label>
            <textarea
              name="detail"
              value={formData.detail}
              onChange={handleChange}
              rows={4}
              className="border-line-soft bg-page text-text placeholder-text-mute focus:border-lime mt-1.5 w-full rounded-lg border px-3 py-2.5 transition-all focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none"
              placeholder="Please provide details about your report..."
            />
            {errors.detail && <p className="text-red mt-1 text-xs">{errors.detail}</p>}
          </div>
        </form>

        {/* Footer */}
        <div className="border-line-soft flex gap-2.5 border-t px-8 py-4">
          <button
            onClick={onClose}
            className="border-line text-text-dim hover:text-text flex-1 rounded-full border bg-transparent px-4 py-2.5 font-semibold transition-all hover:bg-[oklch(1_0_0_/_0.04)]"
          >
            Cancel
          </button>
          <button
            onClick={(e) => handleSubmit(e as React.MouseEvent<HTMLButtonElement>)}
            className="border-amber text-amber flex-1 rounded-full border bg-[oklch(0.82_0.17_75_/_0.12)] px-4 py-2.5 font-semibold transition-all hover:bg-[oklch(0.82_0.17_75_/_0.2)]"
          >
            Submit report
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
