import { Suspense } from 'react';
import { LoginVerifyForm } from '@/components/auth/login-verify/login-verify-form';

export default function LoginVerifyPage() {
  return (
    <Suspense>
      <LoginVerifyForm />
    </Suspense>
  );
}
