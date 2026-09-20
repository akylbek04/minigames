import { el } from "../../utils/dom";
import { icon } from "../../utils/icon";
import { icons } from "../icons/icons";
import "./footer.scss";

const EXPLORE_LINKS = ["Home", "Library", "Categories", "Tournaments"];
const COMPANY_LINKS = ["About Us", "Contact", "Privacy Policy", "Terms of Service"];
const SOCIAL_ICONS = [
  { markup: icons.share, label: "Share" },
  { markup: icons.chat, label: "Community chat" },
  { markup: icons.rssFeed, label: "RSS feed" },
];

function createLinkColumn(title: string, links: string[]): HTMLElement {
  return el("div", { class: "footer__column" }, [
    el("h3", { class: "footer__heading" }, [title]),
    el(
      "ul",
      { class: "footer__list" },
      links.map((label) => el("li", {}, [el("a", { href: "/", class: "footer__link" }, [label])])),
    ),
  ]);
}

function createCommunityColumn(): HTMLElement {
  return el("div", { class: "footer__column footer__column--community" }, [
    el("h3", { class: "footer__heading" }, ["Community"]),
    el(
      "ul",
      { class: "footer__socials" },
      SOCIAL_ICONS.map((item) =>
        el("li", {}, [
          el("a", { href: "/", class: "footer__social-link", "aria-label": item.label }, [
            icon(item.markup),
          ]),
        ]),
      ),
    ),
  ]);
}

export function createFooter(): HTMLElement {
  const brand = el("div", { class: "footer__brand" }, [
    el("a", { href: "/", class: "footer__logo" }, [
      el("img", { src: "/favicon.svg", alt: "", class: "footer__logo-icon" }),
      el("span", {}, ["MiniGames"]),
    ]),
    el("p", { class: "footer__tagline" }, [
      "Take a short break and have fun. Hundreds of curated casual mini-games right in your web browser. No download required.",
    ]),
  ]);

  const columns = el("div", { class: "footer__columns" }, [
    createLinkColumn("Explore", EXPLORE_LINKS),
    createLinkColumn("Company", COMPANY_LINKS),
    createCommunityColumn(),
  ]);

  const top = el("div", { class: "footer__top" }, [brand, columns]);

  const credits = el("div", { class: "footer__credits" }, [
    el("a", { href: "https://rs.school/courses/short-track", class: "footer__bottom-link" }, [
      icon(icons.rsLogo, "footer__bottom-link-icon"),
      "RS School",
    ]),
    el("a", { href: "https://github.com/akylbek04", class: "footer__bottom-link" }, [
      icon(icons.github, "footer__bottom-link-icon"),
      "@akylbek04",
    ]),
  ]);

  const legal = el("div", { class: "footer__legal" }, [
    el("p", { class: "footer__copyright" }, ["© 2026 MiniGames. All rights reserved."]),
    credits,
    el("p", { class: "footer__love" }, ["Designed with love"]),
  ]);

  const bottom = el("div", { class: "footer__bottom" }, [
    el("hr", { class: "footer__divider" }),
    legal,
  ]);

  return el("footer", { class: "footer" }, [el("div", { class: "footer__inner" }, [top, bottom])]);
}
