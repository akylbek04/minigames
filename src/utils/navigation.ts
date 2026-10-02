import { el } from "./dom";
import { assetUrl } from "./asset-url";
import { navigateTo, onRouteChange } from "../router/router";

export type Page = "home" | "library";

const PAGE_PATHS: Record<Page, string> = {
  home: "/",
  library: "/library",
};

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

// A real link (so "open in new tab" and copying it work) that navigates
// in-app through the router on a plain click.
export function createPageLink(
  { page, markActive = false }: PageLinkOptions,
  attrs: Record<string, string>,
  children: (Node | string)[],
): HTMLAnchorElement {
  const path = PAGE_PATHS[page];
  const link = el("a", { href: assetUrl(path), ...attrs }, children);

  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    navigateTo(path);
  });

  if (markActive) {
    onRouteChange(({ route }) => {
      link.setAttribute("aria-current", route === page ? "page" : "false");
    });
  }

  return link;
}
