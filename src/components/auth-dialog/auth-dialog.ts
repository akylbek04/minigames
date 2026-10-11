import { el } from "../../utils/dom";
import { setBusy } from "../../utils/busy";
import { closeDialogAnimated, openDialogAnimated } from "../../utils/animated-dialog";
import { describeAuthError, isAuthCancelled, type AuthProfile } from "../../auth/auth-service";
import { showSnackbar } from "../snackbar/snackbar";
import { createLoginPanel, createRegisterPanel } from "./auth-panels";
import type { AuthMode } from "../../types/auth";
import "./auth-dialog.scss";

export interface AuthDialogOptions {
  // Tab switches and closing go through the URL; sync() then applies them.
  onModeChange: (mode: AuthMode) => void;
  onRequestClose: () => void;
  // A sign-in succeeded; the app starts its session and closes the dialog.
  onAuthenticated: (profile: AuthProfile) => void;
}

export interface AuthDialog {
  dialog: HTMLDialogElement;
  // Opens, switches or closes the dialog to match the `auth` URL parameter.
  sync: (mode: AuthMode | undefined) => void;
}

export function createAuthDialog({
  onModeChange,
  onRequestClose,
  onAuthenticated,
}: AuthDialogOptions): AuthDialog {
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
  const state: { mode?: AuthMode; isPending: boolean } = { isPending: false };

  // While a sign-in is pending every control is locked and the dialog can't
  // be dismissed (closedby="none" also stops Esc natively), so no second
  // request can start.
  function setPending(isPending: boolean, control: HTMLButtonElement): void {
    state.isPending = isPending;
    const panel = control.closest("fieldset");
    if (panel) {
      panel.disabled = isPending;
    }
    loginTab.disabled = isPending;
    registerTab.disabled = isPending;
    setBusy(control, isPending);
    // "closerequest" is a modal's default: Esc fires `cancel`.
    dialog.setAttribute("closedby", isPending ? "none" : "closerequest");
  }

  async function runAuthRequest(
    request: () => Promise<AuthProfile>,
    control: HTMLButtonElement,
  ): Promise<void> {
    if (state.isPending) {
      return;
    }
    setPending(true, control);
    try {
      const profile = await request();
      setPending(false, control);
      onAuthenticated(profile);
    } catch (error) {
      // The dialog stays open with the entered data, ready for a retry.
      setPending(false, control);
      if (isAuthCancelled(error)) {
        showSnackbar("Sign-in was cancelled.", "info");
      } else {
        showSnackbar(describeAuthError(error), "error");
      }
    }
  }

  const panelActions = {
    onSwitch: onModeChange,
    onAuthRequest: (request: () => Promise<AuthProfile>, control: HTMLButtonElement) =>
      void runAuthRequest(request, control),
  };

  function switchTo(mode: AuthMode, shouldAnimate: boolean): void {
    state.mode = mode;
    loginTab.classList.toggle("is-active", mode === "login");
    registerTab.classList.toggle("is-active", mode === "register");
    loginTab.setAttribute("aria-selected", String(mode === "login"));
    registerTab.setAttribute("aria-selected", String(mode === "register"));

    // A fresh panel each time, so switching clears the fields and errors.
    const nextPanel =
      mode === "login" ? createLoginPanel(panelActions) : createRegisterPanel(panelActions);
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

  function requestClose(): void {
    if (!state.isPending) {
      onRequestClose();
    }
  }

  loginTab.addEventListener("click", () => onModeChange("login"));
  registerTab.addEventListener("click", () => onModeChange("register"));

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      requestClose();
    }
  });

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    requestClose();
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
