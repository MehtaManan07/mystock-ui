import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Syncs a single string filter value with a URL query parameter.
 * Omits the param from the URL when the value equals the default (keeps URLs clean).
 * Uses replace: true to avoid polluting browser history on every keypress.
 */
export function useUrlParam(key: string, defaultValue = ''): [string, (value: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback(
    (newValue: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (newValue && newValue !== defaultValue) {
            next.set(key, newValue);
          } else {
            next.delete(key);
          }
          return next;
        },
        { replace: true }
      );
    },
    [key, defaultValue, setSearchParams]
  );

  return [value, setValue];
}
