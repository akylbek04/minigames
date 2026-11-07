import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useMatches, useNavigate } from "react-router";
import { logout } from "../auth/logout";
import { getActiveSession } from "../auth/session";
import { MobileMenu } from "../components/burger-menu/MobileMenu";
import { AppFooter } from "../components/footer/AppFooter";
import { AppHeader } from "../components/header/AppHeader";
import { SnackbarRegion } from "../components/snackbar/SnackbarRegion";
import { showSnackbar } from "../hooks/snackbar-store";
import { useOverlay } from "../hooks/use-overlay";
import { useSession } from "../hooks/use-session";
import type { AuthMode } from "../types/auth";

export const AUTH_PARAM = "auth";

export interface RouteHandle {
  title: string;
  // Pages only a signed-in user can see: ending the session sends them Home.
  requiresSession?: boolean;
}

function isRouteHandle(value: unknown): value is RouteHandle {
  return typeof value === "object" && value !== null && "title" in value;
}

// Header, footer, menu and snackbars around whichever page the URL names.
export function AppLayout() {
  const session = useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const handles = useMatches()
    .map((match) => match.handle)
    .filter(isRouteHandle);
  const title = handles.at(-1)?.title;
  const needsSession = handles.some((handle) => handle.requiresSession);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const auth = useOverlay(AUTH_PARAM);
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);

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

  // Every Auth entry point is guarded by the session.
  function openAuth(mode: AuthMode): void {
    if (getActiveSession()) {
      showSnackbar("You're already signed in.", "info");
      return;
    }
    auth.open(mode);
  }

  return (
    <div id="app">
      <AppHeader
        session={session}
        isMenuOpen={isMenuOpen}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenAuth={openAuth}
        onLogout={() => void logout()}
      />
      <MobileMenu
        session={session}
        isOpen={isMenuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenAuth={openAuth}
        onLogout={() => void logout()}
      />
      <Outlet />
      <AppFooter />
      <SnackbarRegion />
    </div>
  );
}
