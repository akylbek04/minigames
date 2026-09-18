import { el } from "../../utils/dom";
import { icon } from "../../utils/icon";
import { icons } from "../icons/icons";
import "./footer.scss";

const EXPLORE_LINKS = ["Home", "Library", "Categories", "Tournaments"];
const COMPANY_LINKS = ["About Us", "Contact", "Privacy Policy", "Terms of Service"];
const SOCIAL_ICONS = [
  { icon: icons.share, label: "Share" },
  { icon: icons.comment, label: "Community chat" },
  { icon: icons.rss, label: "RSS feed" },
];

function createLinkList(title: string, links: string[]): HTMLElement {
  return el("div", { class: "footer__column" }, [
    el("h3", { class: "footer__heading" }, [title]),
    el(
      "ul",
      { class: "footer__list" },
      links.map((label) => el("li", {}, [el("a", { href: "/", class: "footer__link" }, [label])])),
    ),
  ]);
}

export function createFooter(): HTMLElement {
  const brand = el("div", { class: "footer__brand" }, [
    el("a", { href: "/", class: "footer__logo" }, [
      icon(icons.logoMark, "footer__logo-icon"),
      el("span", {}, ["MiniGames"]),
    ]),
    el("p", { class: "footer__tagline" }, [
      "Take a short break and have fun. Hundreds of curated casual mini-games right in your web browser. No download required.",
    ]),
  ]);

  const socials = el("div", { class: "footer__column" }, [
    el("h3", { class: "footer__heading" }, ["Community"]),
    el(
      "ul",
      { class: "footer__socials" },
      SOCIAL_ICONS.map((item) =>
        el("li", {}, [
          el("a", { href: "/", class: "footer__social-link", "aria-label": item.label }, [
            icon(item.icon),
          ]),
        ]),
      ),
    ),
  ]);

  const columns = el("div", { class: "footer__columns" }, [
    createLinkList("Explore", EXPLORE_LINKS),
    createLinkList("Company", COMPANY_LINKS),
    socials,
  ]);

  const bottomBar = el("div", { class: "footer__bottom" }, [
    el("p", {}, ["© 2026 MiniGames. All rights reserved."]),
    el("a", { href: "https://rs.school/courses/short-track", class: "footer__bottom-link" }, [
      "RS School",
    ]),
    el("a", { href: "https://github.com/akylbek04", class: "footer__bottom-link" }, ["@akylbek04"]),
    el("p", {}, ["Designed with love"]),
  ]);

  return el("footer", { class: "footer" }, [
    el("div", { class: "footer__inner" }, [
      el("div", { class: "footer__top" }, [brand, columns]),
      bottomBar,
    ]),
  ]);
}
