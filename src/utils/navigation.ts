import { el } from "./dom";
import { assetUrl } from "./asset-url";

export type Page = "home" | "library";

type NavigationListener = (page: Page) => void;

const listeners: NavigationListener[] = [];
const state: { page: Page } = { page: "home" };

export function navigate(page: Page): void {
  window.scrollTo({ top: 0 });
  if (page === state.page) {
    return;
  }
  state.page = page;
  for (const listener of listeners) {
    listener(page);
  }
}

export function onNavigate(listener: NavigationListener): void {
  listeners.push(listener);
  listener(state.page);
}

interface PageLinkOptions {
  page: Page;
  // Only links that name a real page (Home, Library) show the active state;
  // placeholder links that merely fall back to Home must not.
  markActive?: boolean;
}

// Shared by the header and the mobile menu. Tournaments and Community have no
// page in the mockup yet, so they lead Home.
export const MAIN_NAV_LINKS: (PageLinkOptions & { label: string })[] = [
  { label: "Home", page: "home", markActive: true },
  { label: "Library", page: "library", markActive: true },
  { label: "Tournaments", page: "home" },
  { label: "Community", page: "home" },
];

// In-app link that swaps pages without a reload. Full URL sync is Story 4's
// router, so every link keeps the app root as its href for now.
export function createPageLink(
  { page, markActive = false }: PageLinkOptions,
  attrs: Record<string, string>,
  children: (Node | string)[],
): HTMLAnchorElement {
  const link = el("a", { href: assetUrl("/"), ...attrs }, children);

  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      return;
    }
    event.preventDefault();
    navigate(page);
  });

  if (markActive) {
    onNavigate((current) => {
      link.setAttribute("aria-current", current === page ? "page" : "false");
    });
  }

  return link;
}
