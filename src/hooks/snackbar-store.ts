import { useSyncExternalStore } from "react";

export type SnackbarVariant = "success" | "error" | "warning" | "info";

export interface SnackbarItem {
  id: number;
  message: string;
  variant: SnackbarVariant;
  // Playing its exit animation; removed afterwards with removeSnackbar.
  isLeaving: boolean;
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

// Starts the exit animation; the region removes the item when it ends.
export function dismissSnackbar(id: number): void {
  setItems(state.items.map((item) => (item.id === id ? { ...item, isLeaving: true } : item)));
}

export function removeSnackbar(id: number): void {
  setItems(state.items.filter((item) => item.id !== id));
}

// Non-blocking feedback any part of the app can trigger; it disappears on
// its own and only the newest few stay on screen.
export function showSnackbar(message: string, variant: SnackbarVariant = "info"): void {
  const id = state.nextId++;
  const next = [...state.items, { id, message, variant, isLeaving: false }];
  // Only the newest few stay: older ones start leaving.
  const overflow = new Set(
    next
      .filter((item) => !item.isLeaving)
      .slice(0, -MAX_VISIBLE)
      .map((item) => item.id),
  );
  setItems(next.map((item) => (overflow.has(item.id) ? { ...item, isLeaving: true } : item)));
  setTimeout(() => dismissSnackbar(id), AUTO_DISMISS_DELAY);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const useSnackbars = (): readonly SnackbarItem[] =>
  useSyncExternalStore(subscribe, () => state.items);
