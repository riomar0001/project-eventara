'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Volunteers } from '@/api';
import { humanizeApiError } from '@/lib/api-error';

export interface VolunteerApplicationForm {
  full_name: string;
  email: string;
  preferred_role: string;
  reason: string;
  skills_experience: string;
  availability: string;
}

export function useVolunteerApplication() {
  const { accessToken: token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function submit(form: VolunteerApplicationForm): Promise<boolean> {
    if (!token) {
      setError('You must be logged in to submit a volunteer application.');
      return false;
    }
    setLoading(true);
    setError(null);

    const { error: err } = await Volunteers.submitApplicationVolunteerApplicationsPost({
      body: {
        full_name: form.full_name,
        email: form.email,
        preferred_role: form.preferred_role || null,
        reason: form.reason,
        skills_experience: form.skills_experience || null,
        availability: form.availability || null,
      },
    });

    setLoading(false);

    if (err) {
      const msg = humanizeApiError(
        (err as { message?: string })?.message,
        "Couldn't submit your application. Please try again.",
      );
      setError(msg);
      return false;
    }

    setSubmitted(true);
    return true;
  }

  return { submit, loading, error, submitted };
}
