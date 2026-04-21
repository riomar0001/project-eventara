'use client';

import { notFound } from 'next/navigation';
import { usePermissions } from '@/context/permissions-context';

interface PermissionGateProps {
  feature: string;
  action: string;
  children: React.ReactNode;
}

export function PermissionGate({ feature, action, children }: PermissionGateProps) {
  const { can } = usePermissions();

  if (!can(feature, action)) notFound();

  return <>{children}</>;
}
