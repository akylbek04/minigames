import { el } from "../../utils/dom";
import { icon } from "../../utils/icon";
import { icons } from "../icons/icons";
import { createField } from "./auth-form-field";
import type { AuthMode } from "../../types/auth";

function createDivider(): HTMLElement {
  return el("div", { class: "auth-dialog__divider" }, [el("span", {}, ["OR"])]);
}

function createGoogleButton(label: string): HTMLElement {
  return el("button", { type: "button", class: "btn btn--outline auth-dialog__google" }, [
    icon(icons.google),
    label,
  ]);
}

function createSwitchLink(label: string): HTMLButtonElement {
  return el("button", { type: "button", class: "auth-dialog__link-inline" }, [label]);
}

export function createLoginPanel(onSwitch: (mode: AuthMode) => void): HTMLElement {
  const emailField = createField({
    id: "login-email",
    label: "Email Address",
    type: "email",
    placeholder: "e.g. alex@minigames.com",
    autocomplete: "email",
    iconMarkup: icons.mail,
  });

  const passwordField = createField({
    id: "login-password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    autocomplete: "current-password",
    iconMarkup: icons.lock,
    passwordToggle: true,
  });

  const forgotLink = el("button", { type: "button", class: "auth-dialog__forgot" }, [
    "Forgot Password?",
  ]);

  const submit = el("button", { type: "submit", class: "btn btn--filled auth-dialog__submit" }, [
    "Login",
  ]);

  const form = el("form", { class: "auth-dialog__form", novalidate: "true" }, [
    emailField,
    passwordField,
    forgotLink,
    submit,
  ]);
  form.addEventListener("submit", (event) => event.preventDefault());

  const registerLink = createSwitchLink("Register");
  registerLink.addEventListener("click", () => onSwitch("register"));

  return el("div", { class: "auth-dialog__panel" }, [
    el("h2", { class: "auth-dialog__title" }, ["Welcome Back!"]),
    el("p", { class: "auth-dialog__subtitle" }, ["Sign in to resume your games and progress."]),
    form,
    createDivider(),
    createGoogleButton("Continue with Google"),
    el("p", { class: "auth-dialog__switch-text" }, ["Don't have an account? ", registerLink]),
  ]);
}

export function createRegisterPanel(onSwitch: (mode: AuthMode) => void): HTMLElement {
  const usernameField = createField({
    id: "register-username",
    label: "Username",
    type: "text",
    placeholder: "e.g. CozyGamer_99",
    autocomplete: "username",
    iconMarkup: icons.user,
  });

  const emailField = createField({
    id: "register-email",
    label: "Email Address",
    type: "email",
    placeholder: "your.email@domain.com",
    autocomplete: "email",
    iconMarkup: icons.mail,
  });

  const passwordField = createField({
    id: "register-password",
    label: "Password",
    type: "password",
    placeholder: "Min. 8 characters",
    autocomplete: "new-password",
    iconMarkup: icons.lock,
    passwordToggle: true,
  });

  const confirmPasswordField = createField({
    id: "register-confirm-password",
    label: "Confirm Password",
    type: "password",
    placeholder: "Repeat your password",
    autocomplete: "new-password",
    iconMarkup: icons.lock,
    passwordToggle: true,
  });

  const submit = el("button", { type: "submit", class: "btn btn--filled auth-dialog__submit" }, [
    "Create Account",
  ]);

  const form = el("form", { class: "auth-dialog__form", novalidate: "true" }, [
    usernameField,
    emailField,
    passwordField,
    confirmPasswordField,
    submit,
  ]);
  form.addEventListener("submit", (event) => event.preventDefault());

  const loginLink = createSwitchLink("Login");
  loginLink.addEventListener("click", () => onSwitch("login"));

  return el("div", { class: "auth-dialog__panel" }, [
    el("h2", { class: "auth-dialog__title" }, ["Create Account"]),
    el("p", { class: "auth-dialog__subtitle" }, ["Join MiniGames to track your score & streak."]),
    form,
    createDivider(),
    createGoogleButton("Sign up with Google"),
    el("p", { class: "auth-dialog__switch-text" }, ["Already have an account? ", loginLink]),
  ]);
}
