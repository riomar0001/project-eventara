/**
 * Validation utilities for Venue Hub forms
 */

import type { AddVenueFormData, ReportFormData, FormErrors } from "@/types"

export const validateAddVenueForm = (
  data: Partial<AddVenueFormData>
): FormErrors => {
  const errors: FormErrors = {}

  if (!data.name || data.name.trim().length === 0) {
    errors.name = "Venue name is required"
  }

  if (!data.location || data.location.trim().length === 0) {
    errors.location = "Location is required"
  }

  if (!data.capacity || parseInt(data.capacity) <= 0) {
    errors.capacity = "Capacity must be greater than 0"
  }

  if (!data.type) {
    errors.type = "Venue type is required"
  }

  return errors
}

export const validateReportForm = (
  data: Partial<ReportFormData>
): FormErrors => {
  const errors: FormErrors = {}

  if (!data.reason) {
    errors.reason = "Please select a reason"
  }

  if (!data.detail || data.detail.trim().length === 0) {
    errors.detail = "Please provide details"
  }

  if (data.detail && data.detail.length < 10) {
    errors.detail = "Details must be at least 10 characters"
  }

  return errors
}

export const isFormValid = (errors: FormErrors): boolean => {
  return Object.keys(errors).length === 0
}
