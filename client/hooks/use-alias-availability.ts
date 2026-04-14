import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { User } from '@/api/sdk.gen';
import { PROFILE_ALIAS_DEBOUNCE_MS, PROFILE_ALIAS_MIN_LENGTH, PROFILE_ALIAS_PATTERN } from '@/constants/profile';

export type AliasStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

interface UseAliasAvailabilityOptions {
  currentAlias?: string;
  debounceMs?: number;
  enabled?: boolean;
}

export function normalizeAlias(value: string) {
  return value.trim().toLowerCase();
}

export function isAliasCheckable(alias: string) {
  return alias.length >= PROFILE_ALIAS_MIN_LENGTH && PROFILE_ALIAS_PATTERN.test(alias);
}

export function useAliasAvailability(alias: string, options: UseAliasAvailabilityOptions = {}) {
  const normalizedAlias = normalizeAlias(alias);
  const normalizedCurrentAlias = normalizeAlias(options.currentAlias ?? '');
  const isCurrentAlias = Boolean(normalizedCurrentAlias) && normalizedAlias === normalizedCurrentAlias;
  const shouldCheck = options.enabled !== false && Boolean(normalizedAlias) && isAliasCheckable(normalizedAlias) && !isCurrentAlias;
  const debouncedAlias = useDebounce(normalizedAlias, options.debounceMs ?? PROFILE_ALIAS_DEBOUNCE_MS);

  const [checkedAlias, setCheckedAlias] = useState('');
  const [apiResult, setApiResult] = useState<Exclude<AliasStatus, 'checking'>>('idle');

  useEffect(() => {
    if (!shouldCheck) return;

    let cancelled = false;

    User.checkAliasUserCheckAliasGet({
      query: { alias: debouncedAlias },
      throwOnError: false
    }).then((result) => {
      if (cancelled) return;

      setCheckedAlias(debouncedAlias);

      if (!result.data) {
        setApiResult('error');
        return;
      }

      setApiResult(result.data.available ? 'available' : 'taken');
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedAlias, shouldCheck]);

  const aliasStatus: AliasStatus = !shouldCheck ? 'idle' : debouncedAlias !== normalizedAlias || checkedAlias !== debouncedAlias ? 'checking' : apiResult;

  return {
    aliasStatus,
    isAliasCheckable: isAliasCheckable(normalizedAlias),
    isCurrentAlias,
    normalizedAlias
  };
}
