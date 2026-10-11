import { vi } from "vitest";
import { flush } from "./dom";

export const SESSION_KEY = "minigames:akylbek04-minigames:app-session";
export const PROFILE = { displayName: "Alex Doe", email: "alex@rs.school" };

export function storeSession(authenticatedAt = Date.now()): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...PROFILE, authenticatedAt }));
}

// Mounts a fresh copy of the whole app on `url`, as on a page load. Module
// state (router, session, snackbar) is reset so tests don't leak into each
// other. Firebase must be mocked by the calling test file.
export async function mountApp(url = "/"): Promise<typeof import("../router/router")> {
  history.replaceState(undefined, "", url);
  vi.resetModules();
  const { createApp } = await import("../app/create-app");
  const router = await import("../router/router");
  createApp(document.body);
  router.startRouter();
  await flush();
  return router;
}

export function snackbarMessages(): string[] {
  return [...document.querySelectorAll(".snackbar:not(.is-leaving) .snackbar__message")].map(
    (node) => node.textContent ?? "",
  );
}

export function isShown(dialog: HTMLDialogElement | null): boolean {
  return Boolean(dialog?.open && !dialog.classList.contains("is-closing"));
}
