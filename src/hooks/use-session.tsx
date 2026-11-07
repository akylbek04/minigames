import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getActiveSession,
  onSessionChange,
  type AppSession,
  type SessionChange,
} from "../auth/session";
import { getProfileName } from "../auth/profile";
import { showSnackbar, type SnackbarVariant } from "./snackbar-store";

const SESSION_MESSAGES: Partial<Record<SessionChange, [string, SnackbarVariant]>> = {
  expired: ["Your session has expired. You're browsing as a guest now.", "warning"],
  invalid: ["Your saved session wasn't valid, so you've been signed out.", "warning"],
  logout: ["You've been logged out.", "success"],
};

const SessionContext = createContext<AppSession | undefined>(undefined);

// The app session stays the single source of truth (auth/session.ts); this
// only mirrors it into React and shows the messages for each change.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(() => getActiveSession());

  useEffect(() => {
    const unsubscribe = onSessionChange((next, change) => {
      setSession(next);
      if (change === "login" && next) {
        showSnackbar(`Welcome, ${getProfileName(next)}!`, "success");
      }
      const message = SESSION_MESSAGES[change];
      if (message) {
        showSnackbar(...message);
      }
    });
    // Returning to the tab re-checks expiry, which also notifies listeners.
    const onVisible = (): void => {
      if (document.visibilityState === "visible") {
        getActiveSession();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return <SessionContext value={session}>{children}</SessionContext>;
}

export const useSession = (): AppSession | undefined => useContext(SessionContext);
