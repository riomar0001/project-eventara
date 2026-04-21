'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/context/permissions-context';

interface PermissionGateProps {
  feature: string;
  action: string;
  children: React.ReactNode;
}

export function PermissionGate({ feature, action, children }: PermissionGateProps) {
  const { can } = usePermissions();
  const router = useRouter();
  const allowed = can(feature, action);

  useEffect(() => {
    if (!allowed) router.replace('/unauthorized');
  }, [allowed, router]);

  if (!allowed) return null;

  return <>{children}</>;
}
