'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { client } from '@/api/client.gen';

type PermissionsMap = Record<string, boolean>;

interface PermissionsContextValue {
  can: (feature: string, action: string) => boolean;
  isLoading: boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<PermissionsMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPermissions() {
      try {
        const response = await client.instance.get<{ permissions: PermissionsMap }>('/user/me/permissions');
        if (!cancelled) setPermissions(response.data.permissions);
      } catch {
        // Server will enforce — empty map means all gates deny, which is safe
        if (!cancelled) setPermissions({});
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchPermissions();
    return () => { cancelled = true; };
  }, []);

  function can(feature: string, action: string): boolean {
    return permissions[`${feature}:${action}`] === true;
  }

  if (isLoading) return null;

  return (
    <PermissionsContext.Provider value={{ can, isLoading }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used inside PermissionsProvider');
  return ctx;
}
