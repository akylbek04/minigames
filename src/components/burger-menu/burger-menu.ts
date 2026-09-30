import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { closeDialogAnimated, openDialogAnimated } from "../../utils/animated-dialog";
import { assetUrl } from "../../utils/asset-url";
import { MAIN_NAV_LINKS, createPageLink } from "../../utils/navigation";
import type { AuthMode } from "../../types/auth";
import "./burger-menu.scss";

export interface BurgerMenuCallbacks {
  onOpenAuth: (mode: AuthMode) => void;
}

export interface BurgerMenu {
  toggleButton: HTMLElement;
  dialog: HTMLDialogElement;
}

export function createBurgerMenu({ onOpenAuth }: BurgerMenuCallbacks): BurgerMenu {
  const toggleButton = el(
    "button",
    {
      type: "button",
      class: "header__burger",
      "aria-label": "Open menu",
      "aria-expanded": "false",
      "aria-controls": "mobile-menu",
    },
    [
      materialIcon("menu", "header__burger-icon header__burger-icon--burger"),
      materialIcon("close", "header__burger-icon header__burger-icon--close"),
    ],
  );

  const closeButton = el(
    "button",
    { type: "button", class: "mobile-menu__close", "aria-label": "Close menu" },
    [materialIcon("close")],
  );

  const topBar = el("div", { class: "mobile-menu__topbar" }, [
    createPageLink({ page: "home" }, { class: "mobile-menu__logo" }, [
      el("img", { src: assetUrl("/favicon.svg"), alt: "", class: "mobile-menu__logo-icon" }),
      el("span", {}, ["MiniGames"]),
    ]),
    closeButton,
  ]);

  const nav = el("nav", { class: "mobile-menu__nav", "aria-label": "Mobile" }, [
    el(
      "ul",
      {},
      MAIN_NAV_LINKS.map(({ label, ...options }) =>
        el("li", {}, [createPageLink(options, { class: "mobile-menu__link" }, [label])]),
      ),
    ),
  ]);

  const loginButton = el(
    "button",
    { type: "button", class: "btn btn--outline mobile-menu__login" },
    ["Log In"],
  );
  const signUpButton = el(
    "button",
    { type: "button", class: "btn btn--filled mobile-menu__signup" },
    ["Sign Up"],
  );

  const dialog = el("dialog", {
    id: "mobile-menu",
    class: "mobile-menu",
    "aria-label": "Mobile navigation",
  });
  dialog.append(
    topBar,
    nav,
    el("div", { class: "mobile-menu__actions" }, [loginButton, signUpButton]),
  );

  function open(): void {
    openDialogAnimated(dialog);
    toggleButton.setAttribute("aria-expanded", "true");
    toggleButton.setAttribute("aria-label", "Close menu");
  }

  function close(): void {
    closeDialogAnimated(dialog);
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.setAttribute("aria-label", "Open menu");
  }

  toggleButton.addEventListener("click", () => {
    if (!dialog.open) {
      open();
    }
  });

  closeButton.addEventListener("click", close);

  // Picking a page from the menu should reveal it, not leave the menu covering it.
  dialog.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      close();
    }
  });

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });

  loginButton.addEventListener("click", () => {
    close();
    onOpenAuth("login");
  });

  signUpButton.addEventListener("click", () => {
    close();
    onOpenAuth("register");
  });

  return { toggleButton, dialog };
}
