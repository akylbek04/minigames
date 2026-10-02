import { assetUrl } from "../utils/asset-url";

export type Route = "home" | "library" | "not-found";

export interface RouterLocation {
  route: Route;
  query: URLSearchParams;
}

type RouteListener = (location: RouterLocation, previous: RouterLocation | undefined) => void;

interface NavigateOptions {
  // Replace the current history entry instead of adding a new one.
  replace?: boolean;
  // Marks the new entry as "this dialog was opened in-app", see closeOverlay.
  overlay?: string;
}

const ROUTES: Record<string, Route> = {
  "": "home",
  home: "home",
  "index.html": "home",
  library: "library",
};

// Path inside the app without the deployment base and slashes:
// "/minigames/library/" -> "library" (the base is "/" in dev).
function getAppPath(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const inner = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  return inner.replaceAll(/^\/+|\/+$/g, "");
}

function readLocation(): RouterLocation {
  return {
    route: ROUTES[getAppPath(location.pathname)] ?? "not-found",
    query: new URLSearchParams(location.search),
  };
}

const listeners: RouteListener[] = [];
const state = { current: readLocation() };

function notify(): void {
  const previous = state.current;
  state.current = readLocation();
  for (const listener of listeners) {
    listener(state.current, previous);
  }
}

export function getLocation(): RouterLocation {
  return state.current;
}

export function onRouteChange(listener: RouteListener): void {
  listeners.push(listener);
}

// Renders the URL the app was opened with and starts following Back/Forward.
export function startRouter(): void {
  addEventListener("popstate", notify);
  for (const listener of listeners) {
    listener(state.current, undefined);
  }
}

function getOverlayKey(historyState: unknown): string | undefined {
  return typeof historyState === "object" && historyState !== null && "overlay" in historyState
    ? String(historyState.overlay)
    : undefined;
}

// Every navigable state change goes through here: the URL is updated first
// and the UI then re-renders from it, never the other way round.
export function navigate(href: string, { replace = false, overlay }: NavigateOptions = {}): void {
  const url = new URL(href, location.href);
  if (url.href === location.href) {
    return;
  }

  if (replace) {
    const historyState: unknown = overlay ? { overlay } : history.state;
    history.replaceState(historyState, "", url);
  } else {
    history.pushState(overlay ? { overlay } : undefined, "", url);
  }
  notify();
}

// In-app path such as "/library?page=2", resolved against the deployment base.
export function navigateTo(path: string, options?: NavigateOptions): void {
  navigate(assetUrl(path), options);
}

// Changes only the query of the current URL; `undefined` removes a key.
export function updateQuery(
  changes: Record<string, string | undefined>,
  options?: NavigateOptions,
): void {
  const url = new URL(location.href);
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  }
  navigate(url.href, options);
}

export function openOverlay(key: string, value: string): void {
  updateQuery({ [key]: value }, { overlay: key });
}

// A dialog opened in-app closes by stepping Back, so closing it and pressing
// Back lead to the same history entry. A dialog that came from a deep link
// has no entry of its own to go back to, so its parameter is just dropped.
export function closeOverlay(key: string): void {
  if (getOverlayKey(history.state) === key) {
    history.back();
  } else {
    updateQuery({ [key]: undefined }, { replace: true });
  }
}
