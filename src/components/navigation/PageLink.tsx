import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";

export type Page = "home" | "library" | "profile";

const PAGE_PATHS: Record<Page, string> = {
  home: "/",
  library: "/library",
  profile: "/profile",
};

interface PageLinkProps {
  page: Page;
  // Only links that name a real page (Home, Library) show the active state;
  // placeholder links that merely fall back to Home must not.
  markActive?: boolean;
  className?: string;
  "aria-label"?: string;
  children: ReactNode;
}

// Shared by the header, mobile menu and footer. Tournaments and Community
// have no page in the mockup yet, so they lead Home.
export const MAIN_NAV_LINKS: { label: string; page: Page; markActive?: boolean }[] = [
  { label: "Home", page: "home", markActive: true },
  { label: "Library", page: "library", markActive: true },
  { label: "Tournaments", page: "home" },
  { label: "Community", page: "home" },
];

// A real link (open in new tab and copying work) that navigates in-app on a
// plain click. Active ones get aria-current="page".
export function PageLink({ page, markActive = false, children, ...props }: PageLinkProps) {
  const to = PAGE_PATHS[page];
  return markActive ? (
    <NavLink to={to} end {...props}>
      {children}
    </NavLink>
  ) : (
    <Link to={to} {...props}>
      {children}
    </Link>
  );
}
