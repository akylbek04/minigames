import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Outlet, useLocation, useMatches, useNavigate } from "react-router";
import { logout } from "../auth/logout";
import { getActiveSession, startSession } from "../auth/session";
import { AuthDialog } from "../components/auth-dialog/AuthDialog";
import { GameDetailsDialog } from "../components/game-details-dialog/GameDetailsDialog";
import { MobileMenu } from "../components/burger-menu/MobileMenu";
import { AppFooter } from "../components/footer/AppFooter";
import { AppHeader } from "../components/header/AppHeader";
import { SnackbarRegion } from "../components/snackbar/SnackbarRegion";
import { showSnackbar } from "../hooks/snackbar-store";
import { useOverlay } from "../hooks/use-overlay";
import { useSession } from "../hooks/use-session";
import { parseAuthMode, type AuthMode } from "../types/auth";

export const AUTH_PARAM = "auth";
export const GAME_PARAM = "game";

export interface RouteHandle {
  // Pages only a signed-in user can see: ending the session sends them Home.
  requiresSession: boolean;
}

function isRouteHandle(value: unknown): value is RouteHandle {
  return typeof value === "object" && value !== null && "requiresSession" in value;
}

// Header, footer, menu and snackbars around whichever page the URL names.
export function AppLayout() {
  const session = useSession();
  const navigate = useNavigate();
  const { pathname, key: locationKey } = useLocation();
  const needsSession = useMatches()
    .map((match) => match.handle)
    .filter(isRouteHandle)
    .some((handle) => handle.requiresSession);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const auth = useOverlay(AUTH_PARAM);
  const game = useOverlay(GAME_PARAM);
  const previousPath = useRef(pathname);

  // Expiry is resolved on every navigation too, not only when a timer fires
  // or the tab regains focus; the change itself reaches the UI through the
  // session listeners.
  useEffect(() => {
    getActiveSession();
  }, [locationKey]);

  // Only a real page change scrolls up; opening a dialog or paging the
  // Library keeps the reader where they are.
  useEffect(() => {
    if (previousPath.current === pathname) {
      return;
    }
    previousPath.current = pathname;
    scrollTo({ top: 0 });
  }, [pathname]);

  // Logout or expiry on a signed-in page: back Home as a guest, not an empty
  // page. (Opening it as a guest is handled by the route loader.)
  useEffect(() => {
    if (!session && needsSession) {
      void navigate("/", { replace: true });
    }
  }, [session, needsSession, navigate]);

  // A signed-in user never sees Auth: a URL that asks for it (typed, or
  // reached with Back/Forward) is told why and cleaned in place. Expiry is
  // resolved first, so an expired user counts as a guest here.
  const dropAuth = useEffectEvent(() => {
    if (!getActiveSession()) {
      return;
    }
    showSnackbar("You're already signed in.", "info");
    auth.drop();
  });
  useEffect(() => {
    if (auth.value !== undefined) {
      dropAuth();
    }
  }, [auth.value]);

  // Every Auth entry point is guarded by the session.
  function openAuth(mode: AuthMode): void {
    if (getActiveSession()) {
      showSnackbar("You're already signed in.", "info");
      return;
    }
    auth.open(mode);
  }

  // Only one dialog at a time: Auth covers Game Details, which keeps its
  // state and comes back when Auth closes.
  const authMode = session ? undefined : parseAuthMode(auth.value);

  return (
    <div id="app">
      <AppHeader
        isMenuOpen={isMenuOpen}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenAuth={openAuth}
        onLogout={() => void logout()}
      />
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenAuth={openAuth}
        onLogout={() => void logout()}
      />
      <GameDetailsDialog
        slug={game.value || undefined}
        isCovered={authMode !== undefined}
        onRequestClose={game.close}
      />
      <AuthDialog
        mode={authMode}
        onModeChange={auth.change}
        onRequestClose={auth.close}
        onAuthenticated={(profile) => {
          startSession(profile);
          auth.close();
        }}
      />
      <Outlet />
      <AppFooter />
      <SnackbarRegion />
    </div>
  );
}
