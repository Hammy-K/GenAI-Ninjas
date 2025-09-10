import { useCallback, useEffect, useRef, useState } from "react";

export function useLocalStorageSync<T>(
  key: string,
  initialValue: T,
  { debounceMs = 250 }: { debounceMs?: number } = {},
) {
  const [state, setState] = useState<T>(() => {
    const raw = localStorage.getItem(key);

    if (!raw) return initialValue;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  });

  const timerRef = useRef<number | null>(null);

  const lastSerializedRef = useRef<string>("");

  useEffect(() => {
    const serialized = JSON.stringify(state);

    if (serialized === lastSerializedRef.current) return;

    if (timerRef.current) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(key, serialized);

        lastSerializedRef.current = serialized;
      } catch {}
    }, debounceMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [key, state, debounceMs]);

  const reset = useCallback(
    (value: T) => {
      setState(value);

      try {
        const serialized = JSON.stringify(value);

        localStorage.setItem(key, serialized);

        lastSerializedRef.current = serialized;
      } catch {}
    },
    [key],
  );

  return { state, setState, reset };
}
