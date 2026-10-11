import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { FirebaseError } from "firebase/app";
import { createAuthDialog, type AuthDialog, type AuthDialogOptions } from "./auth-dialog";
import { signInWithEmail, type AuthProfile } from "../../auth/auth-service";
import { flush, query, typeInto } from "../../test/dom";

vi.mock("../../auth/auth-service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../auth/auth-service")>()),
  signInWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
}));
vi.mock("../../auth/firebase", () => ({ firebaseAuth: {} }));

const PROFILE: AuthProfile = { displayName: "Alex", email: "alex@rs.school" };

function snackbarText(): string {
  return [...document.querySelectorAll(".snackbar__message")]
    .map((node) => node.textContent)
    .join(" ");
}

describe("auth dialog", () => {
  let auth: AuthDialog;
  let options: { [K in keyof AuthDialogOptions]: Mock<AuthDialogOptions[K]> };

  function submitLogin(): void {
    typeInto(query(auth.dialog, "#login-email"), "alex@rs.school");
    typeInto(query(auth.dialog, "#login-password"), "simple");
    query<HTMLFormElement>(auth.dialog, "form").requestSubmit();
  }

  beforeEach(() => {
    options = {
      onModeChange: vi.fn<AuthDialogOptions["onModeChange"]>(),
      onRequestClose: vi.fn<AuthDialogOptions["onRequestClose"]>(),
      onAuthenticated: vi.fn<AuthDialogOptions["onAuthenticated"]>(),
    };
    auth = createAuthDialog(options);
    document.body.append(auth.dialog);
    auth.sync("login");
  });

  it("opens on the mode from the URL and reports tab clicks", () => {
    expect(auth.dialog.open).toBe(true);
    expect(query(auth.dialog, ".auth-dialog__tab.is-active").textContent).toBe("Login");

    query<HTMLButtonElement>(auth.dialog, ".auth-dialog__tab:not(.is-active)").click();
    expect(options.onModeChange).toHaveBeenCalledWith("register");
  });

  it("clears the fields when switching between login and registration", () => {
    typeInto(query(auth.dialog, "#login-email"), "alex@rs.school");
    auth.sync("register");
    auth.sync("login");

    const emails = auth.dialog.querySelectorAll<HTMLInputElement>(
      ":scope .auth-dialog__panel:not(.is-leaving) #login-email",
    );
    expect([...emails].map((input) => input.value)).toEqual([""]);
  });

  it("closes through the URL on backdrop click or Esc", () => {
    auth.dialog.click();
    auth.dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    expect(options.onRequestClose).toHaveBeenCalledTimes(2);
  });

  it("locks every control and blocks closing while sign-in is pending", async () => {
    const request = Promise.withResolvers<AuthProfile>();
    vi.mocked(signInWithEmail).mockReturnValue(request.promise);
    submitLogin();

    const panel = query<HTMLFieldSetElement>(auth.dialog, "fieldset");
    const submit = query<HTMLButtonElement>(auth.dialog, "button[type=submit]");
    expect(panel.disabled).toBe(true);
    expect(submit.getAttribute("aria-busy")).toBe("true");
    expect(query<HTMLButtonElement>(auth.dialog, ".auth-dialog__tab").disabled).toBe(true);
    expect(auth.dialog.getAttribute("closedby")).toBe("none");

    auth.dialog.click();
    auth.dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    query<HTMLFormElement>(auth.dialog, "form").requestSubmit();
    expect(options.onRequestClose).not.toHaveBeenCalled();
    expect(signInWithEmail).toHaveBeenCalledOnce();

    request.resolve(PROFILE);
    await flush();
    expect(options.onAuthenticated).toHaveBeenCalledWith(PROFILE);
    expect(panel.disabled).toBe(false);
    expect(auth.dialog.getAttribute("closedby")).toBe("closerequest");
  });

  it("stays open and unlocks with an error message when sign-in fails", async () => {
    vi.mocked(signInWithEmail).mockRejectedValue(
      new FirebaseError("auth/invalid-credential", "bad"),
    );
    submitLogin();
    await flush();

    expect(options.onAuthenticated).not.toHaveBeenCalled();
    expect(query<HTMLFieldSetElement>(auth.dialog, "fieldset").disabled).toBe(false);
    expect(query<HTMLInputElement>(auth.dialog, "#login-email").value).toBe("alex@rs.school");
    expect(snackbarText()).toContain("Incorrect email or password.");
  });

  it("treats a cancelled provider window as a cancel, not an error", async () => {
    vi.mocked(signInWithEmail).mockRejectedValue(
      new FirebaseError("auth/popup-closed-by-user", "closed"),
    );
    submitLogin();
    await flush();

    expect(snackbarText()).toContain("Sign-in was cancelled.");
    expect(document.querySelector(".snackbar--info")).not.toBeNull();
  });

  it("closes when the URL drops the auth parameter", () => {
    auth.sync(undefined);
    expect(auth.dialog.classList.contains("is-closing") || !auth.dialog.open).toBe(true);
  });
});
