import { assetUrl } from "../../utils/asset-url";
import { icons } from "../icons/icons";
import { InlineIcon } from "../icons/InlineIcon";
import { PageLink, type Page } from "../navigation/PageLink";
import "./footer.scss";

// Only Library has a page of its own besides Home; every other link leads Home.
const EXPLORE_LINKS: { label: string; page: Page }[] = [
  { label: "Home", page: "home" },
  { label: "Library", page: "library" },
  { label: "Categories", page: "home" },
  { label: "Tournaments", page: "home" },
];
const COMPANY_LINKS: { label: string; page: Page }[] = [
  { label: "About Us", page: "home" },
  { label: "Contact", page: "home" },
  { label: "Privacy Policy", page: "home" },
  { label: "Terms of Service", page: "home" },
];
const SOCIAL_ICONS = [
  { markup: icons.share, label: "Share" },
  { markup: icons.chat, label: "Community chat" },
  { markup: icons.rssFeed, label: "RSS feed" },
];

function LinkColumn({ title, links }: { title: string; links: { label: string; page: Page }[] }) {
  return (
    <div className="footer__column">
      <h3 className="footer__heading">{title}</h3>
      <ul className="footer__list">
        {links.map(({ label, page }) => (
          <li key={label}>
            <PageLink page={page} className="footer__link">
              {label}
            </PageLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AppFooter() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div className="footer__brand">
            <PageLink page="home" className="footer__logo">
              <img src={assetUrl("/favicon.svg")} alt="" className="footer__logo-icon" />
              <span>MiniGames</span>
            </PageLink>
            <p className="footer__tagline">
              Take a short break and have fun. Hundreds of curated casual mini-games right in your
              web browser. No download required.
            </p>
          </div>
          <div className="footer__columns">
            <LinkColumn title="Explore" links={EXPLORE_LINKS} />
            <LinkColumn title="Company" links={COMPANY_LINKS} />
            <div className="footer__column footer__column--community">
              <h3 className="footer__heading">Community</h3>
              <ul className="footer__socials">
                {SOCIAL_ICONS.map(({ markup, label }) => (
                  <li key={label}>
                    <PageLink page="home" className="footer__social-link" aria-label={label}>
                      <InlineIcon markup={markup} />
                    </PageLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <hr className="footer__divider" />
          <div className="footer__legal">
            <p className="footer__copyright">© 2026 MiniGames. All rights reserved.</p>
            <div className="footer__credits">
              <a href="https://rs.school/courses/short-track" className="footer__bottom-link">
                <InlineIcon markup={icons.rsLogo} className="footer__bottom-link-icon" />
                RS School
              </a>
              <a href="https://github.com/akylbek04" className="footer__bottom-link">
                <InlineIcon markup={icons.github} className="footer__bottom-link-icon" />
                @akylbek04
              </a>
            </div>
            <p className="footer__love">Designed with love</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
