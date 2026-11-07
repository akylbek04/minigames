import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirebaseError } from "firebase/app";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  type AuthProfile,
} from "../../auth/auth-service";
import { SnackbarRegion } from "../snackbar/SnackbarRegion";
import { AuthDialog } from "./AuthDialog";

vi.mock("../../auth/auth-service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../auth/auth-service")>()),
  signInWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  registerWithEmail: vi.fn(),
}));
vi.mock("../../auth/firebase", () => ({ firebaseAuth: {} }));

const PROFILE: AuthProfile = { displayName: "Alex", email: "alex@rs.school" };

const dialog = () => document.querySelector<HTMLDialogElement>("dialog.auth-dialog")!;

function setup(mode: "login" | "register" = "login") {
  const props = { onModeChange: vi.fn(), onRequestClose: vi.fn(), onAuthenticated: vi.fn() };
  const view = render(
    <>
      <AuthDialog mode={mode} {...props} />
      <SnackbarRegion />
    </>,
  );
  return { ...props, dialog, rerender: view.rerender };
}

async function fillLogin(email = "alex@rs.school", password = "simple") {
  await userEvent.type(screen.getByLabelText("Email Address"), email);
  await userEvent.type(screen.getByLabelText("Password"), password);
}

const submit = (name: string) => screen.getByRole("button", { name });

describe("auth dialog", () => {
  beforeEach(() => {
    vi.mocked(signInWithEmail).mockReset();
    vi.mocked(signInWithGoogle).mockReset();
    vi.mocked(registerWithEmail).mockReset();
  });

  it("opens on the mode from the URL and reports tab clicks", async () => {
    const { dialog, onModeChange } = setup();
    expect(dialog().open).toBe(true);
    expect(screen.getByRole("tab", { name: "Login", selected: true })).toBeTruthy();

    await userEvent.click(screen.getByRole("tab", { name: "Register" }));
    expect(onModeChange).toHaveBeenCalledWith("register");
  });

  it("clears the fields when switching between login and registration", async () => {
    const { rerender, ...rest } = setup();
    await fillLogin();
    const props = {
      onModeChange: rest.onModeChange,
      onRequestClose: rest.onRequestClose,
      onAuthenticated: rest.onAuthenticated,
    };
    rerender(<AuthDialog mode="register" {...props} />);
    rerender(<AuthDialog mode="login" {...props} />);
    expect((screen.getByLabelText("Email Address") as HTMLInputElement).value).toBe("");
  });

  it("closes through the URL on backdrop click or Esc", () => {
    const { dialog, onRequestClose } = setup();
    fireEvent.click(dialog());
    fireEvent(dialog(), new Event("cancel", { cancelable: true }));
    expect(onRequestClose).toHaveBeenCalledTimes(2);
  });

  it("keeps submit disabled until email and password are valid, and shows touched errors", async () => {
    setup();
    expect((submit("Login") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByLabelText("Email Address").getAttribute("aria-invalid")).toBe("false");

    await userEvent.type(screen.getByLabelText("Email Address"), "nope");
    expect(screen.getByText("Enter a valid email, e.g. name@example.com.")).toBeTruthy();
    expect(screen.getByLabelText("Password").getAttribute("aria-invalid")).toBe("false");

    await userEvent.clear(screen.getByLabelText("Email Address"));
    await fillLogin("alex@rs.school", "short");
    expect((submit("Login") as HTMLButtonElement).disabled).toBe(true);
    await userEvent.type(screen.getByLabelText("Password"), "er");
    expect((submit("Login") as HTMLButtonElement).disabled).toBe(false);
  });

  it("toggles password visibility", async () => {
    setup();
    const password = screen.getByLabelText("Password") as HTMLInputElement;
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password.type).toBe("text");
    await userEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password.type).toBe("password");
  });

  it("locks every control and blocks closing while sign-in is pending", async () => {
    const request = Promise.withResolvers<AuthProfile>();
    vi.mocked(signInWithEmail).mockReturnValue(request.promise);
    const { dialog, onRequestClose, onAuthenticated } = setup();
    await fillLogin();
    await userEvent.click(submit("Login"));

    expect(signInWithEmail).toHaveBeenCalledWith("alex@rs.school", "simple");
    expect(document.querySelector("fieldset")!.disabled).toBe(true);
    expect(submit("Login").getAttribute("aria-busy")).toBe("true");
    expect((screen.getByRole("tab", { name: "Register" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(dialog().getAttribute("closedby")).toBe("none");

    fireEvent.click(dialog());
    fireEvent(dialog(), new Event("cancel", { cancelable: true }));
    expect(onRequestClose).not.toHaveBeenCalled();
    expect(signInWithEmail).toHaveBeenCalledOnce();

    await act(async () => request.resolve(PROFILE));
    expect(onAuthenticated).toHaveBeenCalledWith(PROFILE);
    expect(document.querySelector("fieldset")!.disabled).toBe(false);
    expect(dialog().getAttribute("closedby")).toBeNull();
  });

  it("stays open and unlocks with an error message when sign-in fails", async () => {
    vi.mocked(signInWithEmail).mockRejectedValue(
      new FirebaseError("auth/invalid-credential", "bad"),
    );
    const { onAuthenticated } = setup();
    await fillLogin();
    await userEvent.click(submit("Login"));

    expect(await screen.findByText("Incorrect email or password.")).toBeTruthy();
    expect(onAuthenticated).not.toHaveBeenCalled();
    expect(document.querySelector("fieldset")!.disabled).toBe(false);
    expect((screen.getByLabelText("Email Address") as HTMLInputElement).value).toBe(
      "alex@rs.school",
    );
  });

  it("signs in with Google from either panel, locking the dialog meanwhile", async () => {
    const request = Promise.withResolvers<AuthProfile>();
    vi.mocked(signInWithGoogle).mockReturnValue(request.promise);
    const { onAuthenticated, onRequestClose, dialog } = setup("register");
    await userEvent.click(screen.getByRole("button", { name: "Sign up with Google" }));

    expect(
      screen.getByRole("button", { name: "Sign up with Google" }).getAttribute("aria-busy"),
    ).toBe("true");
    fireEvent(dialog(), new Event("cancel", { cancelable: true }));
    expect(onRequestClose).not.toHaveBeenCalled();

    const google = { ...PROFILE, avatarUrl: "https://img/a" };
    await act(async () => request.resolve(google));
    expect(onAuthenticated).toHaveBeenCalledWith(google);
  });

  it("reports a closed Google window as info and a blocked one as an error", async () => {
    vi.mocked(signInWithGoogle).mockRejectedValueOnce(
      new FirebaseError("auth/popup-closed-by-user", "closed"),
    );
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    expect(await screen.findByText("Google sign-in was cancelled.")).toBeTruthy();
    expect(document.querySelector(".snackbar--info")).not.toBeNull();

    vi.mocked(signInWithGoogle).mockRejectedValueOnce(new FirebaseError("auth/popup-blocked", ""));
    await userEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    expect(await screen.findByText(/The browser blocked the Google window/)).toBeTruthy();
    expect(document.querySelector(".snackbar--error")).not.toBeNull();
  });

  it("switches to registration from the inline link", async () => {
    const { onModeChange } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Register" }));
    expect(onModeChange).toHaveBeenCalledWith("register");
  });

  it("registers once all four fields are valid and re-checks the confirmation", async () => {
    vi.mocked(registerWithEmail).mockResolvedValue(PROFILE);
    const { onAuthenticated } = setup("register");
    await userEvent.type(screen.getByLabelText("Username"), "Alex");
    await userEvent.type(screen.getByLabelText("Email Address"), "alex@rs.school");
    await userEvent.type(screen.getByLabelText("Password"), "Passw0rd!");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "Passw0rd!");
    expect((submit("Create Account") as HTMLButtonElement).disabled).toBe(false);

    await userEvent.type(screen.getByLabelText("Password"), "x");
    expect(screen.getByText("Passwords do not match.")).toBeTruthy();
    expect((submit("Create Account") as HTMLButtonElement).disabled).toBe(true);
    await userEvent.type(screen.getByLabelText("Confirm Password"), "x");

    await userEvent.click(submit("Create Account"));
    expect(registerWithEmail).toHaveBeenCalledWith("Alex", "alex@rs.school", "Passw0rd!x");
    await act(async () => {});
    expect(onAuthenticated).toHaveBeenCalledWith(PROFILE);
  });

  it("reveals every error when an invalid form is submitted", async () => {
    setup("register");
    fireEvent.submit(document.querySelector("form")!);
    expect(await screen.findByText("Username is required.")).toBeTruthy();
    expect(screen.getByText("Email is required.")).toBeTruthy();
    expect(screen.getByText("Please confirm your password.")).toBeTruthy();
    expect(registerWithEmail).not.toHaveBeenCalled();
  });
});
