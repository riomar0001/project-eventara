/**
 * Report Venue Modal
 */

'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import type { Venue } from '@/types/venue';
import { ModalBackdrop } from './modal-backdrop';
import { validateReportForm } from '@/lib/validators';
import type { ReportFormData } from '@/types';

interface ReportModalProps {
  venue: Venue | null;
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
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface shadow-2xl shadow-[oklch(0_0_0_/_0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line-soft px-8 py-6">
          <h3 className="m-0 text-2xl font-semibold tracking-[-0.02em] text-text">Report venue</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-text-mute transition-all hover:bg-[oklch(1_0_0_/_0.06)] hover:text-text">
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-8 py-6">
          <p className="text-sm text-text-dim">
            Reporting <span className="font-semibold text-text">{venue.name}</span>
          </p>

          {/* Reason */}
          <div>
            <label className="block font-mono text-xs tracking-[0.14em] text-text-mute uppercase">Reason for report</label>
            <select
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-lg border border-line-soft bg-page px-3 py-2.5 text-text transition-all focus:border-lime focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none"
            >
              {REPORT_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            {errors.reason && <p className="mt-1 text-xs text-red">{errors.reason}</p>}
          </div>

          {/* Details */}
          <div>
            <label className="block font-mono text-xs tracking-[0.14em] text-text-mute uppercase">Details</label>
            <textarea
              name="detail"
              value={formData.detail}
              onChange={handleChange}
              rows={4}
              className="mt-1.5 w-full rounded-lg border border-line-soft bg-page px-3 py-2.5 text-text placeholder-text-mute transition-all focus:border-lime focus:ring-2 focus:ring-[oklch(0.9_0.22_128_/_0.1)] focus:outline-none"
              placeholder="Please provide details about your report..."
            />
            {errors.detail && <p className="mt-1 text-xs text-red">{errors.detail}</p>}
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-2.5 border-t border-line-soft px-8 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-line bg-transparent px-4 py-2.5 font-semibold text-text-dim transition-all hover:bg-[oklch(1_0_0_/_0.04)] hover:text-text"
          >
            Cancel
          </button>
          <button
            onClick={(e) => handleSubmit(e as React.MouseEvent<HTMLButtonElement>)}
            className="flex-1 rounded-full border border-amber bg-[oklch(0.82_0.17_75_/_0.12)] px-4 py-2.5 font-semibold text-amber transition-all hover:bg-[oklch(0.82_0.17_75_/_0.2)]"
          >
            Submit report
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
