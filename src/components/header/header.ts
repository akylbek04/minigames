import { el } from "../../utils/dom";
import { assetUrl } from "../../utils/asset-url";
import type { AuthMode } from "../../types/auth";
import "./header.scss";

const NAV_LINKS = ["Home", "Library", "Tournaments", "Community"];

export interface HeaderCallbacks {
  onOpenAuth: (mode: AuthMode) => void;
  menuToggle: HTMLElement;
}

export function createHeader({ onOpenAuth, menuToggle }: HeaderCallbacks): HTMLElement {
  const nav = el("nav", { class: "header__nav", "aria-label": "Main" }, [
    el(
      "ul",
      { class: "header__nav-list" },
      NAV_LINKS.map((label, index) =>
        el("li", {}, [
          el(
            "a",
            {
              href: "/",
              class: "header__nav-link",
              ...(index === 0 && { "aria-current": "page" }),
            },
            [label],
          ),
        ]),
      ),
    ),
  ]);

  const loginButton = el("button", { type: "button", class: "btn btn--outline header__login" }, [
    "Log In",
  ]);
  loginButton.addEventListener("click", () => onOpenAuth("login"));

  const signUpButton = el("button", { type: "button", class: "btn btn--filled header__signup" }, [
    "Sign Up",
  ]);
  signUpButton.addEventListener("click", () => onOpenAuth("register"));

  const logo = el("a", { href: "/", class: "header__logo" }, [
    el("img", { src: assetUrl("/favicon.svg"), alt: "", class: "header__logo-icon" }),
    el("span", {}, ["MiniGames"]),
  ]);

  const navActions = el("div", { class: "header__nav-actions" }, [
    nav,
    el("div", { class: "header__actions" }, [loginButton, signUpButton, menuToggle]),
  ]);

  return el("header", { class: "header" }, [
    el("div", { class: "header__inner" }, [logo, navActions]),
  ]);
}
