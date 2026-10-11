import { createHeader } from "../components/header/header";
import { createBurgerMenu } from "../components/burger-menu/burger-menu";
import { createAuthDialog } from "../components/auth-dialog/auth-dialog";
import { createFooter } from "../components/footer/footer";
import { createGameDetailsDialog } from "../components/game-details-dialog/game-details-dialog";
import { createHomePage } from "../pages/home/home-page";
import { createLibraryPage } from "../pages/library/library-page";
import { createNotFoundPage } from "../pages/not-found/not-found-page";
import type { AppPage } from "../pages/app-page";
import {
  closeOverlay,
  onRouteChange,
  openOverlay,
  updateQuery,
  type Route,
} from "../router/router";
import { parseAuthMode, type AuthMode } from "../types/auth";
import {
  endSession,
  getActiveSession,
  onSessionChange,
  startSession,
  type AppSession,
  type SessionChange,
} from "../auth/session";
import { getProfileName } from "../auth/profile";
import { showSnackbar, type SnackbarVariant } from "../components/snackbar/snackbar";

// Dialog state lives in the URL: `?game=<slug>` and `?auth=login|register`.
const GAME_PARAM = "game";
const AUTH_PARAM = "auth";

const PAGE_TITLES: Record<Route, string> = {
  home: "MiniGames — Take a Short Break & Have Fun",
  library: "Game Library — MiniGames",
  "not-found": "Page Not Found — MiniGames",
};

const SESSION_MESSAGES: Partial<Record<SessionChange, [string, SnackbarVariant]>> = {
  expired: ["Your session has expired. You're browsing as a guest now.", "warning"],
  invalid: ["Your saved session wasn't valid, so you've been signed out.", "warning"],
  logout: ["You've been logged out.", "success"],
};

// The app is a guest again even if Firebase couldn't sign out; its own
// persisted user is never used to restore a session.
async function logout(): Promise<void> {
  try {
    await endSession("logout");
  } catch {
    showSnackbar("Couldn't sign out of Firebase. You're browsing as a guest.", "error");
  }
}

const openGameDetails = (slug: string): void => openOverlay(GAME_PARAM, slug);

function notifyAlreadySignedIn(): void {
  showSnackbar("You're already signed in.", "info");
}

// Protected actions run only with an active session; otherwise the user
// is told why and Auth takes the place of the current dialog. The action
// itself is never replayed after signing in.
function requireSession(reason: string): AppSession | undefined {
  const session = getActiveSession();
  if (!session) {
    showSnackbar(reason, "warning");
    openOverlay(AUTH_PARAM, "login");
  }
  return session;
}

// Every Auth entry point is guarded by the session: UI controls here, URLs
// and Back/Forward in the route listener.
function openAuth(mode: AuthMode): void {
  if (getActiveSession()) {
    notifyAlreadySignedIn();
    return;
  }
  openOverlay(AUTH_PARAM, mode);
}

// Builds the whole app into `root` and subscribes it to the router; the
// caller starts the router once everything is mounted.
export function createApp(root: HTMLElement): void {
  const gameDetailsDialog = createGameDetailsDialog({
    onRequestClose: () => closeOverlay(GAME_PARAM),
    requireSession,
  });
  const authDialog = createAuthDialog({
    onModeChange: (mode) => updateQuery({ [AUTH_PARAM]: mode }, { replace: true }),
    onRequestClose: () => closeOverlay(AUTH_PARAM),
    onAuthenticated: (profile) => {
      startSession(profile);
      closeOverlay(AUTH_PARAM);
    },
  });
  const burgerMenu = createBurgerMenu({ onOpenAuth: openAuth, onLogout: () => void logout() });

  // Pages are built once and swapped, so each keeps its DOM between visits.
  const pages: Record<Route, AppPage> = {
    home: createHomePage({ onOpenDetails: openGameDetails }),
    library: createLibraryPage({ onOpenDetails: openGameDetails }),
    "not-found": createNotFoundPage(),
  };

  const app = document.createElement("div");
  app.id = "app";
  const header = createHeader({
    onOpenAuth: openAuth,
    onLogout: () => void logout(),
    menuToggle: burgerMenu.toggleButton,
  });
  app.append(
    header.element,
    burgerMenu.dialog,
    authDialog.dialog,
    gameDetailsDialog.dialog,
    pages.home.element,
    createFooter(),
  );
  root.append(app);

  onSessionChange((session, change) => {
    header.setSession(session);
    burgerMenu.setSession(session);
    gameDetailsDialog.setSession(session);
    if (change === "login" && session) {
      showSnackbar(`Welcome, ${getProfileName(session)}!`, "success");
    }
    const message = SESSION_MESSAGES[change];
    if (message) {
      showSnackbar(...message);
    }
  });

  // The session is checked on startup, on returning to the tab and before
  // every navigation; protected actions check it themselves.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      getActiveSession();
    }
  });
  getActiveSession();

  // Tracked here rather than read from the router's `previous`: the auth
  // guard below re-renders from a replaced URL mid-navigation.
  const rendered: { route?: Route } = {};

  onRouteChange(({ route, query }) => {
    // Expiry is resolved first, so an expired user counts as a guest here.
    if (getActiveSession() && query.has(AUTH_PARAM)) {
      notifyAlreadySignedIn();
      // Re-enters this listener with the cleaned URL, in the same entry.
      updateQuery({ [AUTH_PARAM]: undefined }, { replace: true });
      return;
    }
    const page = pages[route];
    if (route !== rendered.route) {
      const current = app.querySelector("main");
      // Home is mounted from the start; don't swap a page with itself.
      if (current !== page.element) {
        current?.replaceWith(page.element);
      }
      document.title = PAGE_TITLES[route];
      // Only a real page change scrolls up; opening a dialog or paging the
      // Library keeps the reader where they are.
      if (rendered.route) {
        window.scrollTo({ top: 0 });
      }
      rendered.route = route;
    }
    page.show?.(query);

    // Only one dialog at a time: Auth covers Game Details, which keeps its
    // state and comes back when Auth closes.
    const authMode = parseAuthMode(query.get(AUTH_PARAM));
    gameDetailsDialog.sync(query.get(GAME_PARAM) || undefined, authMode !== undefined);
    authDialog.sync(authMode);
  });
}
