'use client';

import { useState } from 'react';
import { RegisterForm } from '@/components/auth/register/register-form';
import { VerifyEmailCard } from '@/components/auth/verify-email-card';

export default function RegisterPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  if (submittedEmail) {
    return <VerifyEmailCard email={submittedEmail} onBack={() => setSubmittedEmail(null)} />;
  }

  return <RegisterForm onSuccess={setSubmittedEmail} />;
}

