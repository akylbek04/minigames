import "../styles/globals.scss";
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
  startRouter,
  updateQuery,
  type Route,
} from "../router/router";
import { parseAuthMode, type AuthMode } from "../types/auth";

// Dialog state lives in the URL: `?game=<slug>` and `?auth=login|register`.
const GAME_PARAM = "game";
const AUTH_PARAM = "auth";

const PAGE_TITLES: Record<Route, string> = {
  home: "MiniGames — Take a Short Break & Have Fun",
  library: "Game Library — MiniGames",
  "not-found": "Page Not Found — MiniGames",
};

const openGameDetails = (slug: string): void => openOverlay(GAME_PARAM, slug);
const openAuth = (mode: AuthMode): void => openOverlay(AUTH_PARAM, mode);

const gameDetailsDialog = createGameDetailsDialog({
  onRequestClose: () => closeOverlay(GAME_PARAM),
});
const authDialog = createAuthDialog({
  onModeChange: (mode) => updateQuery({ [AUTH_PARAM]: mode }, { replace: true }),
  onRequestClose: () => closeOverlay(AUTH_PARAM),
});
const burgerMenu = createBurgerMenu({ onOpenAuth: openAuth });

// Pages are built once and swapped, so each keeps its DOM between visits.
const pages: Record<Route, AppPage> = {
  home: createHomePage({ onOpenDetails: openGameDetails }),
  library: { element: createLibraryPage({ onOpenDetails: openGameDetails }) },
  "not-found": createNotFoundPage(),
};

const app = document.createElement("div");
app.id = "app";
app.append(
  createHeader({ onOpenAuth: openAuth, menuToggle: burgerMenu.toggleButton }),
  burgerMenu.dialog,
  authDialog.dialog,
  gameDetailsDialog.dialog,
  pages.home.element,
  createFooter(),
);
document.body.append(app);

onRouteChange(({ route, query }, previous) => {
  const page = pages[route];
  if (route !== previous?.route) {
    app.querySelector("main")?.replaceWith(page.element);
    document.title = PAGE_TITLES[route];
    // Only a real page change scrolls up; opening a dialog or paging the
    // Library keeps the reader where they are.
    if (previous) {
      window.scrollTo({ top: 0 });
    }
  }
  page.show?.(query);

  gameDetailsDialog.sync(query.get(GAME_PARAM) || undefined);
  authDialog.sync(parseAuthMode(query.get(AUTH_PARAM)));
});

startRouter();
