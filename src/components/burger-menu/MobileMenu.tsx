import { getProfileName } from "../../auth/profile";
import type { AppSession } from "../../auth/session";
import type { AuthMode } from "../../types/auth";
import { assetUrl } from "../../utils/asset-url";
import { AnimatedDialog } from "../dialog/AnimatedDialog";
import { MaterialIcon } from "../icons/MaterialIcon";
import { MAIN_NAV_LINKS, PageLink } from "../navigation/PageLink";
import { UserAvatar } from "../user-avatar/UserAvatar";
import "./burger-menu.scss";

export function BurgerButton({ isOpen, onOpen }: { isOpen: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      className="header__burger"
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      aria-controls="mobile-menu"
      onClick={() => {
        if (!isOpen) {
          onOpen();
        }
      }}
    >
      <MaterialIcon name="menu" className="header__burger-icon header__burger-icon--burger" />
      <MaterialIcon name="close" className="header__burger-icon header__burger-icon--close" />
    </button>
  );
}

interface MobileMenuProps {
  session: AppSession | undefined;
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (mode: AuthMode) => void;
  onLogout: () => void;
}

export function MobileMenu({ session, isOpen, onClose, onOpenAuth, onLogout }: MobileMenuProps) {
  // Each action first reveals the page behind the menu, then runs.
  const andClose = (action: () => void) => () => {
    onClose();
    action();
  };

  return (
    <AnimatedDialog
      id="mobile-menu"
      className="mobile-menu"
      label="Mobile navigation"
      isOpen={isOpen}
      onRequestClose={onClose}
      // Picking a page should reveal it, not leave the menu covering it.
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
          onClose();
        }
      }}
    >
      <>
        <div className="mobile-menu__topbar">
          <PageLink page="home" className="mobile-menu__logo">
            <img src={assetUrl("/favicon.svg")} alt="" className="mobile-menu__logo-icon" />
            <span>MiniGames</span>
          </PageLink>
          <button
            type="button"
            className="mobile-menu__close"
            aria-label="Close menu"
            onClick={onClose}
          >
            <MaterialIcon name="close" />
          </button>
        </div>
        <nav className="mobile-menu__nav" aria-label="Mobile">
          <ul>
            {MAIN_NAV_LINKS.map(({ label, page, markActive }) => (
              <li key={label}>
                <PageLink page={page} markActive={markActive} className="mobile-menu__link">
                  {label}
                </PageLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mobile-menu__actions">
          {session ? (
            <>
              <PageLink page="profile" markActive className="mobile-menu__profile">
                <UserAvatar profile={session} />
                <span className="mobile-menu__username">{getProfileName(session)}</span>
              </PageLink>
              <button
                type="button"
                className="btn btn--outline mobile-menu__logout"
                onClick={andClose(onLogout)}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn--outline mobile-menu__login"
                onClick={andClose(() => onOpenAuth("login"))}
              >
                Log In
              </button>
              <button
                type="button"
                className="btn btn--filled mobile-menu__signup"
                onClick={andClose(() => onOpenAuth("register"))}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </>
    </AnimatedDialog>
  );
}
