import { getActiveSession, type AppSession } from "../auth/session";
import { showSnackbar } from "./snackbar-store";
import { useOverlay } from "./use-overlay";

// Protected actions run only with an active session; otherwise the user is
// told why and Auth opens. The action itself is never replayed after
// signing in.
export function useRequireSession(): (reason: string) => AppSession | undefined {
  const auth = useOverlay("auth");
  return (reason) => {
    const session = getActiveSession();
    if (!session) {
      showSnackbar(reason, "warning");
      auth.open("login");
    }
    return session;
  };
}
