import { el } from "../../utils/dom";
import { icon } from "../../utils/icon";
import { icons } from "../icons/icons";
import { createField, type AuthField } from "./auth-form-field";
import type { AuthMode } from "../../types/auth";
import {
  validateConfirmPassword,
  validateEmail,
  validateLoginPassword,
  validateRegisterPassword,
  validateUsername,
} from "../../auth/validation";

interface ValidatedField {
  field: AuthField;
  validate: () => string | undefined;
}

// Real-time validation: a field shows its error once it has been typed in
// or left, and every shown error is re-checked on each keystroke (so the
// confirmation follows password edits). Submit stays disabled until all
// fields are valid. Returns a check that reveals every error, for submit.
function bindValidation(submit: HTMLButtonElement, fields: ValidatedField[]): () => boolean {
  const touched = new Set<ValidatedField>();

  function render(): void {
    for (const item of fields) {
      item.field.setError(touched.has(item) ? item.validate() : undefined);
    }
    submit.disabled = fields.some((item) => item.validate() !== undefined);
  }

  for (const item of fields) {
    const touch = (): void => {
      touched.add(item);
      render();
    };
    item.field.input.addEventListener("input", touch);
    item.field.input.addEventListener("blur", touch);
  }
  render();

  return () => {
    for (const item of fields) {
      touched.add(item);
    }
    render();
    return !submit.disabled;
  };
}

function createDivider(): HTMLElement {
  return el("div", { class: "auth-dialog__divider" }, [el("span", {}, ["OR"])]);
}

function createGoogleButton(label: string): HTMLElement {
  return el(
    "button",
    { type: "button", class: "btn btn--outline btn--large auth-dialog__google" },
    [icon(icons.google), label],
  );
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
    iconName: "mail",
  });

  const passwordField = createField({
    id: "login-password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    autocomplete: "current-password",
    iconName: "lock",
    passwordToggle: true,
  });

  const forgotLink = el("button", { type: "button", class: "auth-dialog__forgot" }, [
    "Forgot Password?",
  ]);

  const submit = el(
    "button",
    { type: "submit", class: "btn btn--filled btn--large auth-dialog__submit" },
    ["Login"],
  );

  const form = el("form", { class: "auth-dialog__form", novalidate: "" }, [
    emailField.element,
    passwordField.element,
    forgotLink,
    submit,
  ]);
  const isValid = bindValidation(submit, [
    { field: emailField, validate: () => validateEmail(emailField.input.value) },
    { field: passwordField, validate: () => validateLoginPassword(passwordField.input.value) },
  ]);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    isValid();
  });

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
    iconName: "person",
  });

  const emailField = createField({
    id: "register-email",
    label: "Email Address",
    type: "email",
    placeholder: "your.email@domain.com",
    autocomplete: "email",
    iconName: "mail",
  });

  const passwordField = createField({
    id: "register-password",
    label: "Password",
    type: "password",
    placeholder: "Min. 6 characters",
    autocomplete: "new-password",
    iconName: "lock",
  });

  const confirmPasswordField = createField({
    id: "register-confirm-password",
    label: "Confirm Password",
    type: "password",
    placeholder: "Repeat your password",
    autocomplete: "new-password",
    iconName: "lock",
  });

  const submit = el(
    "button",
    { type: "submit", class: "btn btn--filled btn--large auth-dialog__submit" },
    ["Create Account"],
  );

  const form = el("form", { class: "auth-dialog__form", novalidate: "" }, [
    usernameField.element,
    emailField.element,
    passwordField.element,
    confirmPasswordField.element,
    submit,
  ]);
  const isValid = bindValidation(submit, [
    { field: usernameField, validate: () => validateUsername(usernameField.input.value) },
    { field: emailField, validate: () => validateEmail(emailField.input.value) },
    {
      field: passwordField,
      validate: () => validateRegisterPassword(passwordField.input.value),
    },
    {
      field: confirmPasswordField,
      validate: () =>
        validateConfirmPassword(confirmPasswordField.input.value, passwordField.input.value),
    },
  ]);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    isValid();
  });

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
