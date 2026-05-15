'use client';

import { PermissionGate } from '@/components/auth/permission-gate';
import { AnalyticsSection } from '@/components/kitchen-sink/analytics-section';

export default function AdminAnalyticsPage() {
  return (
    <PermissionGate feature="analytics" action="read">
      <AnalyticsSection />
    </PermissionGate>
  );
}
