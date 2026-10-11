import { el } from "../../utils/dom";
import { assetUrl } from "../../utils/asset-url";
import { MAIN_NAV_LINKS, createPageLink } from "../../utils/navigation";
import { getProfileName } from "../../auth/profile";
import { createUserAvatar } from "../user-avatar/user-avatar";
import type { AuthMode } from "../../types/auth";
import type { AppSession } from "../../auth/session";
import "./header.scss";

export interface HeaderCallbacks {
  onOpenAuth: (mode: AuthMode) => void;
  onLogout: () => void;
  menuToggle: HTMLElement;
}

export interface Header {
  element: HTMLElement;
  // Guest controls without a session, the user's profile with one.
  setSession: (session: AppSession | undefined) => void;
}

// Name as text (never markup) next to the photo or initials.
function createProfile(session: AppSession): HTMLElement {
  return el("div", { class: "header__profile" }, [
    createUserAvatar(session, "header__avatar"),
    el("span", { class: "header__username" }, [getProfileName(session)]),
  ]);
}

export function createHeader({ onOpenAuth, onLogout, menuToggle }: HeaderCallbacks): Header {
  const nav = el("nav", { class: "header__nav", "aria-label": "Main" }, [
    el(
      "ul",
      { class: "header__nav-list" },
      MAIN_NAV_LINKS.map(({ label, ...options }) =>
        el("li", {}, [createPageLink(options, { class: "header__nav-link" }, [label])]),
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

  const logoutButton = el("button", { type: "button", class: "btn btn--outline header__logout" }, [
    "Log Out",
  ]);
  logoutButton.addEventListener("click", onLogout);

  const logo = createPageLink({ page: "home" }, { class: "header__logo" }, [
    el("img", { src: assetUrl("/favicon.svg"), alt: "", class: "header__logo-icon" }),
    el("span", {}, ["MiniGames"]),
  ]);

  const actions = el("div", { class: "header__actions" });
  const navActions = el("div", { class: "header__nav-actions" }, [nav, actions]);

  function setSession(session: AppSession | undefined): void {
    actions.replaceChildren(
      ...(session ? [createProfile(session), logoutButton] : [loginButton, signUpButton]),
      menuToggle,
    );
  }
  setSession(undefined);

  const element = el("header", { class: "header" }, [
    el("div", { class: "header__inner" }, [logo, navActions]),
  ]);
  return { element, setSession };
}
