"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const listeners = new Map<string, Set<() => void>>();

function subscribeTo(key: string, listener: () => void) {
  let bucket = listeners.get(key);
  if (!bucket) {
    bucket = new Set();
    listeners.set(key, bucket);
  }
  bucket.add(listener);

  return () => {
    const current = listeners.get(key);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) listeners.delete(key);
  };
}

function emit(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* приватный режим — просто живём без сохранения */
  }
  emit(key);
}

/** Строковое значение в localStorage (тема, режим рулетки). */
export function useStoredString<T extends string>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
) {
  const raw = useSyncExternalStore(
    useCallback((listener: () => void) => subscribeTo(key, listener), [key]),
    useCallback(() => readRaw(key), [key]),
    () => null,
  );

  const value = raw !== null && isValid(raw) ? raw : fallback;
  const setValue = useCallback((next: T) => writeRaw(key, next), [key]);

  return { value, setValue, ready: raw !== null };
}

/** JSON-значение в localStorage (последний выпавший фильм). */
export function useStoredJson<T>(
  key: string,
  fallback: T | null,
  isValid: (value: unknown) => value is T,
) {
  const raw = useSyncExternalStore(
    useCallback((listener: () => void) => subscribeTo(key, listener), [key]),
    useCallback(() => readRaw(key), [key]),
    () => null,
  );

  const value = useMemo<T | null>(() => {
    if (raw === null) return fallback;
    try {
      const parsed: unknown = JSON.parse(raw);
      return isValid(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }, [raw, fallback, isValid]);

  const setValue = useCallback(
    (next: T | null) => writeRaw(key, next === null ? null : JSON.stringify(next)),
    [key],
  );

  return { value, setValue, ready: raw !== null };
}
