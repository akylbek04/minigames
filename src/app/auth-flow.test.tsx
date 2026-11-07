import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signInWithEmail } from "../auth/auth-service";
import { getActiveSession } from "../auth/session";
import { renderApp } from "../test/render-app";
import { stubApi } from "../test/api";
import { storeSession } from "../test/app";

vi.mock("../auth/auth-service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../auth/auth-service")>()),
  signInWithEmail: vi.fn(),
  signOutFromFirebase: vi.fn(() => Promise.resolve()),
}));
vi.mock("../auth/firebase", () => ({ firebaseAuth: {} }));

const authDialog = (): HTMLDialogElement => document.querySelector("dialog.auth-dialog")!;
const isShown = (dialog: HTMLDialogElement): boolean =>
  dialog.open && !dialog.classList.contains("is-closing");

describe("auth dialog in the app", () => {
  beforeEach(() => {
    vi.mocked(signInWithEmail).mockReset();
    stubApi();
  });

  it("opens from a URL for guests", () => {
    renderApp("/library?auth=register");
    expect(isShown(authDialog())).toBe(true);
    expect(screen.getByRole("tab", { name: "Register", selected: true })).toBeTruthy();
  });

  it("removes only the auth parameter for a signed-in user, in place", async () => {
    storeSession();
    const { router } = renderApp("/library?category=puzzle&auth=login#top");

    await waitFor(() => expect(router.state.location.search).toBe("?category=puzzle"));
    expect(router.state.location.hash).toBe("#top");
    expect(isShown(authDialog())).toBe(false);
    expect(screen.getByText("You're already signed in.")).toBeTruthy();
  });

  it("blocks Auth reached through history while signed in", async () => {
    storeSession();
    const { router } = renderApp("/");
    await act(async () => router.navigate("/?auth=login"));
    await waitFor(() => expect(router.state.location.search).toBe(""));
    expect(isShown(authDialog())).toBe(false);
  });

  it("lets a user whose session expired open Auth from the URL", async () => {
    storeSession(Date.now() - 6 * 60_000);
    renderApp("/?auth=login");
    expect(isShown(authDialog())).toBe(true);
    expect(
      await screen.findByText("Your session has expired. You're browsing as a guest now."),
    ).toBeTruthy();
  });

  it("opens from the header and signs in, starting a session and closing the dialog", async () => {
    vi.mocked(signInWithEmail).mockResolvedValue({
      displayName: "Alex Doe",
      email: "alex@rs.school",
    });
    const { router } = renderApp("/");
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));
    expect(router.state.location.search).toBe("?auth=login");
    expect(isShown(authDialog())).toBe(true);

    await userEvent.type(screen.getByLabelText("Email Address"), "alex@rs.school");
    await userEvent.type(screen.getByLabelText("Password"), "simple");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(getActiveSession()?.email).toBe("alex@rs.school"));
    expect(await screen.findByText("Welcome, Alex Doe!")).toBeTruthy();
    await waitFor(() => expect(router.state.location.search).toBe(""));
    expect(screen.getByRole("link", { name: /open your profile/i })).toBeTruthy();
  });
});
