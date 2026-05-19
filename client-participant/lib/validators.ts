import type { AddVenueFormData, ReportFormData, FormErrors } from '@/types';

export const validateAddVenueForm = (data: Partial<AddVenueFormData>): FormErrors => {
  const errors: FormErrors = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Please enter a venue name.';
  }

  if (!data.address_line || data.address_line.trim().length === 0) {
    errors.address_line = 'Please enter the street address.';
  }

  if (!data.city || data.city.trim().length === 0) {
    errors.city = 'Please enter the city.';
  }

  if (!data.province || data.province.trim().length === 0) {
    errors.province = 'Please enter the province.';
  }

  if (!data.capacity || parseInt(data.capacity) <= 0) {
    errors.capacity = 'Capacity must be at least 1.';
  }

  if (!data.venue_type) {
    errors.venue_type = 'Please select a venue type.';
  }

  if (data.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email)) {
    errors.contact_email = 'Please enter a valid email address.';
  }

  return errors;
};

export const validateReportForm = (data: Partial<ReportFormData>): FormErrors => {
  const errors: FormErrors = {};

  if (!data.reason) {
    errors.reason = 'Please choose a reason.';
  }

  if (!data.detail || data.detail.trim().length === 0) {
    errors.detail = 'Please add some details.';
  }

  if (data.detail && data.detail.length < 10) {
    errors.detail = 'Please add a bit more detail (at least 10 characters).';
  }

  return errors;
};

export const isFormValid = (errors: FormErrors): boolean => {
  return Object.keys(errors).length === 0;
};

export type RegisterErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'password' | 'confirm', string>>;

export const validateRegisterForm = (data: { firstName: string; lastName: string; email: string; password: string; confirm: string }): RegisterErrors => {
  const errors: RegisterErrors = {};
  if (!data.firstName.trim()) errors.firstName = 'Please enter your first name.';
  if (!data.lastName.trim()) errors.lastName = 'Please enter your last name.';
  if (!data.email.trim()) errors.email = 'Please enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "That doesn't look like a valid email address.";
  if (!data.password) errors.password = 'Please enter a password.';
  else if (data.password.length < 8) errors.password = 'Password must be at least 8 characters long.';
  if (!data.confirm) errors.confirm = 'Please confirm your password.';
  else if (data.password !== data.confirm) errors.confirm = "Those passwords don't match.";
  return errors;
};

export type SuggestVenueErrors = Partial<Record<'name' | 'location' | 'capacity' | 'type', string>>;

export const validateSuggestVenueForm = (data: { name: string; location: string; capacity: string; type: string }): SuggestVenueErrors => {
  const errors: SuggestVenueErrors = {};
  if (!data.name.trim()) errors.name = 'Please enter a venue name.';
  if (!data.location.trim()) errors.location = 'Please enter a location.';
  if (!data.capacity || isNaN(Number(data.capacity)) || Number(data.capacity) <= 0) errors.capacity = 'Please enter a valid capacity (numbers only).';
  if (!data.type) errors.type = 'Please select a venue type.';
  return errors;
};
