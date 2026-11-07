import { useSyncExternalStore } from "react";

export type SnackbarVariant = "success" | "error" | "warning" | "info";

export interface SnackbarItem {
  id: number;
  message: string;
  variant: SnackbarVariant;
}

const AUTO_DISMISS_DELAY = 5000;
const MAX_VISIBLE = 3;

// The list is replaced, never mutated, so it is a valid external-store snapshot.
const state: { items: readonly SnackbarItem[]; nextId: number } = { items: [], nextId: 1 };
const listeners = new Set<() => void>();

function setItems(next: readonly SnackbarItem[]): void {
  state.items = next;
  for (const listener of listeners) {
    listener();
  }
}

export function dismissSnackbar(id: number): void {
  setItems(state.items.filter((item) => item.id !== id));
}

// Non-blocking feedback any part of the app can trigger; it disappears on
// its own and only the newest few stay on screen.
export function showSnackbar(message: string, variant: SnackbarVariant = "info"): void {
  const id = state.nextId++;
  setItems([...state.items, { id, message, variant }].slice(-MAX_VISIBLE));
  setTimeout(() => dismissSnackbar(id), AUTO_DISMISS_DELAY);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const useSnackbars = (): readonly SnackbarItem[] =>
  useSyncExternalStore(subscribe, () => state.items);
