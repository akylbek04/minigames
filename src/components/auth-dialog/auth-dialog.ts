import { el } from "../../utils/dom";
import { icon } from "../../utils/icon";
import { icons } from "../icons/icons";
import { closeDialogAnimated } from "../../utils/animated-dialog";
import { createLoginPanel, createRegisterPanel } from "./auth-panels";
import type { AuthMode } from "../../types/auth";
import "./auth-dialog.scss";

export interface AuthDialog {
  dialog: HTMLDialogElement;
  open: (mode: AuthMode) => void;
}

export function createAuthDialog(): AuthDialog {
  const loginTab = el("button", { type: "button", class: "auth-dialog__tab", role: "tab" }, [
    "Login",
  ]);
  const registerTab = el("button", { type: "button", class: "auth-dialog__tab", role: "tab" }, [
    "Register",
  ]);
  const tabs = el("div", { class: "auth-dialog__tabs", role: "tablist" }, [loginTab, registerTab]);

  const panels = el("div", { class: "auth-dialog__panels" });

  const closeButton = el(
    "button",
    { type: "button", class: "auth-dialog__close", "aria-label": "Close" },
    [icon(icons.close)],
  );

  const dialog = el("dialog", { class: "auth-dialog", "aria-label": "Sign in or sign up" });
  dialog.append(closeButton, tabs, panels);

  function close(): void {
    closeDialogAnimated(dialog);
  }

  function switchTo(mode: AuthMode, shouldAnimate: boolean): void {
    loginTab.classList.toggle("is-active", mode === "login");
    registerTab.classList.toggle("is-active", mode === "register");
    loginTab.setAttribute("aria-selected", String(mode === "login"));
    registerTab.setAttribute("aria-selected", String(mode === "register"));

    const nextPanel = mode === "login" ? createLoginPanel(onSwitch) : createRegisterPanel(onSwitch);
    const currentPanel = panels.firstElementChild;

    if (shouldAnimate && currentPanel) {
      currentPanel.classList.add("is-leaving");
      currentPanel.addEventListener("transitionend", () => currentPanel.remove(), { once: true });
    } else {
      panels.replaceChildren();
    }

    nextPanel.classList.add("is-entering");
    panels.append(nextPanel);
    requestAnimationFrame(() => nextPanel.classList.remove("is-entering"));
  }

  function onSwitch(mode: AuthMode): void {
    switchTo(mode, true);
  }

  loginTab.addEventListener("click", () => switchTo("login", true));
  registerTab.addEventListener("click", () => switchTo("register", true));
  closeButton.addEventListener("click", close);

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      close();
    }
  });

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });

  function open(mode: AuthMode): void {
    switchTo(mode, false);
    dialog.showModal();
  }

  return { dialog, open };
}
