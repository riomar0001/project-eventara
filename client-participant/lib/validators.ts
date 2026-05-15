/**
 * Validation utilities for Venue Hub forms
 */
import type { AddVenueFormData, ReportFormData, FormErrors } from '@/types';

export const validateAddVenueForm = (data: Partial<AddVenueFormData>): FormErrors => {
  const errors: FormErrors = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Venue name is required';
  }

  if (!data.location || data.location.trim().length === 0) {
    errors.location = 'Location is required';
  }

  if (!data.capacity || parseInt(data.capacity) <= 0) {
    errors.capacity = 'Capacity must be greater than 0';
  }

  if (!data.type) {
    errors.type = 'Venue type is required';
  }

  return errors;
};

export const validateReportForm = (data: Partial<ReportFormData>): FormErrors => {
  const errors: FormErrors = {};

  if (!data.reason) {
    errors.reason = 'Please select a reason';
  }

  if (!data.detail || data.detail.trim().length === 0) {
    errors.detail = 'Please provide details';
  }

  if (data.detail && data.detail.length < 10) {
    errors.detail = 'Details must be at least 10 characters';
  }

  return errors;
};

export const isFormValid = (errors: FormErrors): boolean => {
  return Object.keys(errors).length === 0;
};

export type RegisterErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'password' | 'confirm', string>>;

export const validateRegisterForm = (data: { firstName: string; lastName: string; email: string; password: string; confirm: string }): RegisterErrors => {
  const errors: RegisterErrors = {};
  if (!data.firstName.trim()) errors.firstName = 'First name is required.';
  if (!data.lastName.trim()) errors.lastName = 'Last name is required.';
  if (!data.email.trim()) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Enter a valid email address.';
  if (!data.password) errors.password = 'Password is required.';
  else if (data.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  if (!data.confirm) errors.confirm = 'Please confirm your password.';
  else if (data.password !== data.confirm) errors.confirm = 'Passwords do not match.';
  return errors;
};

export type SuggestVenueErrors = Partial<Record<'name' | 'location' | 'capacity' | 'type', string>>;

export const validateSuggestVenueForm = (data: { name: string; location: string; capacity: string; type: string }): SuggestVenueErrors => {
  const errors: SuggestVenueErrors = {};
  if (!data.name.trim()) errors.name = 'Venue name is required.';
  if (!data.location.trim()) errors.location = 'Location is required.';
  if (!data.capacity || isNaN(Number(data.capacity)) || Number(data.capacity) <= 0) errors.capacity = 'Enter a valid capacity.';
  if (!data.type) errors.type = 'Select a venue type.';
  return errors;
};
