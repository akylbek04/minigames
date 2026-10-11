import { describe, expect, it, vi } from "vitest";
import { createLoginPanel, createRegisterPanel, type PanelActions } from "./auth-panels";
import { query, leave, typeInto } from "../../test/dom";
import { registerWithEmail, signInWithEmail } from "../../auth/auth-service";

vi.mock("../../auth/auth-service", () => ({
  signInWithEmail: vi.fn(),
  registerWithEmail: vi.fn(),
}));

function actions() {
  return {
    onSwitch: vi.fn<PanelActions["onSwitch"]>(),
    onAuthRequest: vi.fn<PanelActions["onAuthRequest"]>(),
  };
}

function errorOf(panel: HTMLElement, id: string): string {
  return query(panel, `#${id}-error`).textContent ?? "";
}

describe("login panel", () => {
  it("keeps submit disabled until email and password are valid", () => {
    const panel = createLoginPanel(actions());
    const submit = query<HTMLButtonElement>(panel, "button[type=submit]");
    const email = query<HTMLInputElement>(panel, "#login-email");
    const password = query<HTMLInputElement>(panel, "#login-password");

    expect(submit.disabled).toBe(true);
    typeInto(email, "alex@rs.school");
    typeInto(password, "simple");
    expect(submit.disabled).toBe(false);

    typeInto(password, "short");
    expect(submit.disabled).toBe(true);
    expect(errorOf(panel, "login-password")).toBe("Password must be at least 6 characters long.");
  });

  it("shows errors only for fields the user has touched", () => {
    const panel = createLoginPanel(actions());
    const email = query<HTMLInputElement>(panel, "#login-email");

    expect(errorOf(panel, "login-email")).toBe("");
    leave(email);
    expect(errorOf(panel, "login-email")).toBe("Email is required.");
    expect(email.getAttribute("aria-invalid")).toBe("true");
    expect(errorOf(panel, "login-password")).toBe("");

    typeInto(email, "alex@rs.school");
    expect(errorOf(panel, "login-email")).toBe("");
    expect(email.getAttribute("aria-invalid")).toBe("false");
  });

  it("switches to registration from the inline link", () => {
    const panelActions = actions();
    const panel = createLoginPanel(panelActions);
    query<HTMLButtonElement>(panel, ".auth-dialog__link-inline").click();
    expect(panelActions.onSwitch).toHaveBeenCalledWith("register");
  });

  it("submits a valid form as an email sign-in request", async () => {
    const panelActions = actions();
    const panel = createLoginPanel(panelActions);
    typeInto(query(panel, "#login-email"), " alex@rs.school ");
    typeInto(query(panel, "#login-password"), "simple");
    query<HTMLFormElement>(panel, "form").requestSubmit();

    const [request, control] = panelActions.onAuthRequest.mock.calls[0];
    expect(control).toBe(query(panel, "button[type=submit]"));
    await request();
    expect(signInWithEmail).toHaveBeenCalledWith("alex@rs.school", "simple");
  });

  it("does not send an invalid form", () => {
    const panelActions = actions();
    const panel = createLoginPanel(panelActions);
    query<HTMLFormElement>(panel, "form").requestSubmit();
    expect(panelActions.onAuthRequest).not.toHaveBeenCalled();
  });
});

function fill(panel: HTMLElement, values: Record<string, string>): void {
  for (const [id, value] of Object.entries(values)) {
    typeInto(query<HTMLInputElement>(panel, `#register-${id}`), value);
  }
}

describe("register panel", () => {
  it("enables submit once all four fields are valid", () => {
    const panel = createRegisterPanel(actions());
    const submit = query<HTMLButtonElement>(panel, "button[type=submit]");

    fill(panel, { username: "Gamer1", email: "g@rs.school", password: "Secr3t!" });
    expect(submit.disabled).toBe(true);
    fill(panel, { "confirm-password": "Secr3t!" });
    expect(submit.disabled).toBe(false);
  });

  it("re-checks the confirmation whenever the password changes", () => {
    const panel = createRegisterPanel(actions());
    fill(panel, { password: "Secr3t!", "confirm-password": "Secr3t!" });
    expect(errorOf(panel, "register-confirm-password")).toBe("");

    fill(panel, { password: "Secr3t!!" });
    expect(errorOf(panel, "register-confirm-password")).toBe("Passwords do not match.");
  });

  it("submits a valid form as a registration request", async () => {
    const panelActions = actions();
    const panel = createRegisterPanel(panelActions);
    fill(panel, {
      username: "Gamer1",
      email: "g@rs.school",
      password: "Secr3t!",
      "confirm-password": "Secr3t!",
    });
    query<HTMLFormElement>(panel, "form").requestSubmit();

    const [request] = panelActions.onAuthRequest.mock.calls[0];
    await request();
    expect(registerWithEmail).toHaveBeenCalledWith("Gamer1", "g@rs.school", "Secr3t!");
  });

  it("reveals every error when the form is submitted invalid", () => {
    const panel = createRegisterPanel(actions());
    query<HTMLFormElement>(panel, "form").requestSubmit();

    expect(errorOf(panel, "register-username")).toBe("Username is required.");
    expect(errorOf(panel, "register-confirm-password")).toBe("Please confirm your password.");
  });
});
