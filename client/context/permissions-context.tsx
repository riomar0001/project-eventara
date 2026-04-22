'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Profile as UserApi } from '@/api/sdk.gen';

type PermissionsMap = Record<string, boolean>;

interface PermissionsContextValue {
  can: (feature: string, action: string) => boolean;
  isLoading: boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

// Module-level promise so Strict Mode's double-invoke shares one in-flight request.
let _inflight: Promise<PermissionsMap> | null = null;

function loadPermissions(): Promise<PermissionsMap> {
  if (!_inflight) {
    _inflight = UserApi.getMyPermissionsUserMePermissionsGet()
      .then((r: { data?: { permissions: Record<string, boolean> } }) => r.data?.permissions ?? {})
      .catch(() => ({}))
      .finally(() => {
        _inflight = null;
      });
  }
  return _inflight;
}

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<PermissionsMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    loadPermissions().then((map) => {
      if (mounted.current) {
        setPermissions(map);
        setIsLoading(false);
      }
    });
    return () => {
      mounted.current = false;
    };
  }, []);

  function can(feature: string, action: string): boolean {
    return permissions[`${feature}:${action}`] === true;
  }

  if (isLoading) return null;

  return <PermissionsContext.Provider value={{ can, isLoading }}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used inside PermissionsProvider');
  return ctx;
}
