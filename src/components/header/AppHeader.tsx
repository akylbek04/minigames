import { getProfileName } from "../../auth/profile";
import { useSession } from "../../hooks/use-session";
import type { AuthMode } from "../../types/auth";
import { assetUrl } from "../../utils/asset-url";
import { BurgerButton } from "../burger-menu/MobileMenu";
import { MAIN_NAV_LINKS, PageLink } from "../navigation/PageLink";
import { UserAvatar } from "../user-avatar/UserAvatar";
import "./header.scss";

interface AppHeaderProps {
  isMenuOpen: boolean;
  onOpenMenu: () => void;
  onOpenAuth: (mode: AuthMode) => void;
  onLogout: () => void;
}

// Guest controls without a session, the user's profile with one. The name is
// text, never markup, and leads to the Profile page.
export function AppHeader({ isMenuOpen, onOpenMenu, onOpenAuth, onLogout }: AppHeaderProps) {
  const session = useSession();
  const name = session ? getProfileName(session) : "";
  return (
    <header className="header">
      <div className="header__inner">
        <PageLink page="home" className="header__logo">
          <img src={assetUrl("/favicon.svg")} alt="" className="header__logo-icon" />
          <span>MiniGames</span>
        </PageLink>
        <div className="header__nav-actions">
          <nav className="header__nav" aria-label="Main">
            <ul className="header__nav-list">
              {MAIN_NAV_LINKS.map(({ label, page, markActive }) => (
                <li key={label}>
                  <PageLink page={page} markActive={markActive} className="header__nav-link">
                    {label}
                  </PageLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="header__actions">
            {session ? (
              <>
                <PageLink
                  page="profile"
                  markActive
                  className="header__profile"
                  aria-label={`${name}, open your profile`}
                >
                  <UserAvatar profile={session} className="header__avatar" />
                  <span className="header__username">{name}</span>
                </PageLink>
                <button
                  type="button"
                  className="btn btn--outline header__logout"
                  onClick={onLogout}
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn--outline header__login"
                  onClick={() => onOpenAuth("login")}
                >
                  Log In
                </button>
                <button
                  type="button"
                  className="btn btn--filled header__signup"
                  onClick={() => onOpenAuth("register")}
                >
                  Sign Up
                </button>
              </>
            )}
            <BurgerButton isOpen={isMenuOpen} onOpen={onOpenMenu} />
          </div>
        </div>
      </div>
    </header>
  );
}
