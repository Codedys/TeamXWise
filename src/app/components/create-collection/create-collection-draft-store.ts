'use client';

import { useSyncExternalStore } from 'react';
import {
  emptyCollectionDraft,
  parseStoredDraft,
  type CreateCollectionDraft,
} from './create-collection-draft';

const STORAGE_KEY = 'chip-in:create-collection-draft:v4';
const AUDIENCE_STORAGE_KEY = 'chip-in:create-collection-draft:v3';
const PREVIOUS_STORAGE_KEY = 'chip-in:create-collection-draft:v2';
const LEGACY_STORAGE_KEY = 'chip-in:create-collection-draft:v1';
const serverSnapshot = { draft: emptyCollectionDraft(), storageUnavailable: false };
let snapshot = serverSnapshot;
let loaded = false;
const listeners = new Set<() => void>();

function readDraft() {
  try {
    snapshot = {
      draft: parseStoredDraft(
        window.localStorage.getItem(STORAGE_KEY) ??
          window.localStorage.getItem(AUDIENCE_STORAGE_KEY) ??
          window.localStorage.getItem(PREVIOUS_STORAGE_KEY) ??
          window.localStorage.getItem(LEGACY_STORAGE_KEY),
      ),
      storageUnavailable: false,
    };
  } catch {
    snapshot = { draft: snapshot.draft, storageUnavailable: true };
  }
  loaded = true;
}

function getSnapshot() {
  if (!loaded) readDraft();
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  function onStorage(event: StorageEvent) {
    if (
      event.key === STORAGE_KEY ||
      event.key === AUDIENCE_STORAGE_KEY ||
      event.key === PREVIOUS_STORAGE_KEY ||
      event.key === LEGACY_STORAGE_KEY ||
      event.key === null
    ) {
      readDraft();
      listeners.forEach((notify) => notify());
    }
  }
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function updateCollectionDraft(
  update: (draft: CreateCollectionDraft) => CreateCollectionDraft,
) {
  const draft = update(getSnapshot().draft);
  let storageUnavailable = false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    storageUnavailable = true;
  }
  snapshot = { draft, storageUnavailable };
  listeners.forEach((notify) => notify());
}

export function useCollectionDraft() {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
}

/** Cancel only this feature's draft, including its older persisted version. */
export function resetCollectionDraft(): boolean {
  let storageUnavailable = false;
  for (const key of [
    STORAGE_KEY,
    AUDIENCE_STORAGE_KEY,
    PREVIOUS_STORAGE_KEY,
    LEGACY_STORAGE_KEY,
  ]) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      storageUnavailable = true;
    }
  }
  snapshot = { draft: emptyCollectionDraft(), storageUnavailable };
  loaded = true;
  listeners.forEach((notify) => notify());
  return !storageUnavailable;
}
