import { signOutFromFirebase, type AuthProfile } from "./auth-service";

// The client-side app session (Story 4 architecture note). Firebase proves who
// the user is; this record alone decides whether the UI treats them as signed
// in. It holds no credentials and lasts a fixed 5 minutes from sign-in.
export const SESSION_STORAGE_KEY = "minigames:akylbek04-minigames:app-session";
export const SESSION_LIFETIME = 5 * 60 * 1000;

export interface AppSession extends AuthProfile {
  // Date.now() at sign-in; never updated, so use doesn't extend the session.
  authenticatedAt: number;
}

// "restore" is a valid session found on startup; the rest end or start one.
export type SessionChange = "login" | "restore" | "logout" | "expired" | "invalid";
type SessionListener = (session: AppSession | undefined, change: SessionChange) => void;

const listeners: SessionListener[] = [];
const state: { isActive: boolean; expiryTimer?: ReturnType<typeof setTimeout> } = {
  isActive: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// Undefined for anything that isn't a complete, well-typed session record.
export function parseSession(raw: string, now = Date.now()): AppSession | undefined {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!isRecord(value)) {
    return undefined;
  }
  const { displayName, email, authenticatedAt, avatarUrl } = value;
  const isValid =
    typeof displayName === "string" &&
    typeof email === "string" &&
    email !== "" &&
    typeof authenticatedAt === "number" &&
    Number.isFinite(authenticatedAt) &&
    // A timestamp from the future would stretch the fixed lifetime.
    authenticatedAt <= now &&
    (avatarUrl === undefined || typeof avatarUrl === "string");
  return isValid
    ? { displayName, email, authenticatedAt, ...(avatarUrl && { avatarUrl }) }
    : undefined;
}

export function isSessionExpired(session: AppSession, now = Date.now()): boolean {
  return now - session.authenticatedAt >= SESSION_LIFETIME;
}

export function onSessionChange(listener: SessionListener): void {
  listeners.push(listener);
}

function notify(session: AppSession | undefined, change: SessionChange): void {
  for (const listener of listeners) {
    listener(session, change);
  }
}

// Ends the session at the moment it runs out, not only at the next check.
function scheduleExpiry(session: AppSession): void {
  clearTimeout(state.expiryTimer);
  state.expiryTimer = setTimeout(
    () => getActiveSession(),
    session.authenticatedAt + SESSION_LIFETIME - Date.now(),
  );
}

// Back to Guest Mode right away: only this app's key is removed, then
// Firebase is signed out too so its own persistence can't bring the user
// back. Rejects if Firebase sign-out fails; the app stays a guest anyway.
export function endSession(change: "logout" | "expired" | "invalid"): Promise<void> {
  clearTimeout(state.expiryTimer);
  localStorage.removeItem(SESSION_STORAGE_KEY);
  state.isActive = false;
  notify(undefined, change);
  return signOutFromFirebase();
}

// An automatic sign-out failing changes nothing for the user: the app
// session is already gone and Firebase's state is never trusted on its own.
async function endSessionQuietly(change: "expired" | "invalid"): Promise<void> {
  try {
    await endSession(change);
  } catch {
    // Nothing to undo: see above.
  }
}

export function startSession(profile: AuthProfile, now = Date.now()): AppSession {
  const session: AppSession = {
    displayName: profile.displayName,
    email: profile.email,
    authenticatedAt: now,
    ...(profile.avatarUrl && { avatarUrl: profile.avatarUrl }),
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  state.isActive = true;
  scheduleExpiry(session);
  notify(session, "login");
  return session;
}

// The one check behind every guard: startup, returning to the tab,
// navigation and protected actions. Reads storage each time, so an edited
// or deleted record takes effect on the next check.
export function getActiveSession(now = Date.now()): AppSession | undefined {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (raw === null) {
    if (state.isActive) {
      void endSessionQuietly("invalid");
    }
    return undefined;
  }

  const session = parseSession(raw, now);
  if (!session) {
    void endSessionQuietly("invalid");
    return undefined;
  }
  if (isSessionExpired(session, now)) {
    void endSessionQuietly("expired");
    return undefined;
  }

  // Rescheduled on every check in case the stored timestamp was edited.
  scheduleExpiry(session);
  if (!state.isActive) {
    state.isActive = true;
    notify(session, "restore");
  }
  return session;
}
