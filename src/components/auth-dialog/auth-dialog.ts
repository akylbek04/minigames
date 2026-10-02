import { el } from "../../utils/dom";
import { closeDialogAnimated, openDialogAnimated } from "../../utils/animated-dialog";
import { createLoginPanel, createRegisterPanel } from "./auth-panels";
import type { AuthMode } from "../../types/auth";
import "./auth-dialog.scss";

export interface AuthDialogOptions {
  // Tab switches and closing go through the URL; sync() then applies them.
  onModeChange: (mode: AuthMode) => void;
  onRequestClose: () => void;
}

export interface AuthDialog {
  dialog: HTMLDialogElement;
  // Opens, switches or closes the dialog to match the `auth` URL parameter.
  sync: (mode: AuthMode | undefined) => void;
}

export function createAuthDialog({ onModeChange, onRequestClose }: AuthDialogOptions): AuthDialog {
  const loginTab = el("button", { type: "button", class: "auth-dialog__tab", role: "tab" }, [
    "Login",
  ]);
  const registerTab = el("button", { type: "button", class: "auth-dialog__tab", role: "tab" }, [
    "Register",
  ]);
  const tabs = el("div", { class: "auth-dialog__tabs", role: "tablist" }, [loginTab, registerTab]);

  const panels = el("div", { class: "auth-dialog__panels" });

  const dialog = el("dialog", { class: "auth-dialog", "aria-label": "Sign in or sign up" });
  dialog.append(tabs, panels);
  const state: { mode?: AuthMode } = {};

  function switchTo(mode: AuthMode, shouldAnimate: boolean): void {
    state.mode = mode;
    loginTab.classList.toggle("is-active", mode === "login");
    registerTab.classList.toggle("is-active", mode === "register");
    loginTab.setAttribute("aria-selected", String(mode === "login"));
    registerTab.setAttribute("aria-selected", String(mode === "register"));

    const nextPanel =
      mode === "login" ? createLoginPanel(onModeChange) : createRegisterPanel(onModeChange);
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

  loginTab.addEventListener("click", () => onModeChange("login"));
  registerTab.addEventListener("click", () => onModeChange("register"));

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      onRequestClose();
    }
  });

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    onRequestClose();
  });

  function sync(mode: AuthMode | undefined): void {
    if (mode === undefined) {
      closeDialogAnimated(dialog);
      return;
    }
    if (dialog.open && !dialog.classList.contains("is-closing")) {
      if (mode !== state.mode) {
        switchTo(mode, true);
      }
      return;
    }
    switchTo(mode, false);
    openDialogAnimated(dialog);
  }

  return { dialog, sync };
}
