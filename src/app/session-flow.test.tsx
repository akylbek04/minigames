import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signOutFromFirebase } from "../auth/auth-service";
import { DETAILS, stubApi } from "../test/api";
import { SESSION_KEY, storeSession } from "../test/app";
import { renderApp } from "../test/render-app";

vi.mock("../auth/auth-service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../auth/auth-service")>()),
  signOutFromFirebase: vi.fn(),
}));
vi.mock("../auth/firebase", () => ({ firebaseAuth: {} }));

const EXPIRED_MESSAGE = "Your session has expired. You're browsing as a guest now.";
const isGuestHeader = (): boolean => screen.queryByRole("button", { name: "Log In" }) !== null;
// The routes render once their loaders have run.
const appReady = () => screen.findByRole("banner");
const hasSnackbar = (message: string): boolean => screen.queryByText(message) !== null;
const guestAwareDetails = (url: URL) =>
  Response.json({
    data: { ...DETAILS, isLikedByCurrentUser: url.searchParams.has("userEmail") },
  });

describe("session flows", () => {
  beforeEach(() => {
    stubApi();
    vi.mocked(signOutFromFirebase).mockReset();
    vi.mocked(signOutFromFirebase).mockResolvedValue();
  });

  it("restores a valid session on load without extending it", async () => {
    const authenticatedAt = Date.now() - 60_000;
    storeSession(authenticatedAt);
    renderApp("/");
    await appReady();

    expect(isGuestHeader()).toBe(false);
    expect(document.querySelectorAll(".snackbar")).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem(SESSION_KEY) ?? "").authenticatedAt).toBe(
      authenticatedAt,
    );
  });

  it("drops to Guest Mode with one message when the session runs out in use", async () => {
    storeSession(Date.now() - 5 * 60_000 + 1000);
    renderApp("/?game=tiny-glade");
    await appReady();
    expect(isGuestHeader()).toBe(false);
    await screen.findByRole("textbox", { name: "Write a comment" });

    await act(async () => new Promise((resolve) => setTimeout(resolve, 1100)));
    act(() => void document.dispatchEvent(new Event("visibilitychange")));

    await waitFor(() => expect(isGuestHeader()).toBe(true));
    const textarea = await screen.findByRole("textbox", { name: "Write a comment" });
    expect((textarea as HTMLTextAreaElement).disabled).toBe(true);
    expect(screen.getAllByText(EXPIRED_MESSAGE)).toHaveLength(1);
    expect(signOutFromFirebase).toHaveBeenCalledOnce();
  });

  it("continues a navigation in Guest Mode when the session has expired", async () => {
    storeSession(Date.now() - 4 * 60_000);
    const { router } = renderApp("/");
    storeSession(Date.now() - 6 * 60_000);

    await act(async () => router.navigate("/library"));

    await waitFor(() => expect(document.querySelector("main")?.className).toBe("library-page"));
    await waitFor(() => expect(isGuestHeader()).toBe(true));
    expect(hasSnackbar(EXPIRED_MESSAGE)).toBe(true);
  });

  it("keeps the comment draft when the session ends with Game Details open", async () => {
    storeSession();
    renderApp("/?game=tiny-glade");
    const textarea = (await screen.findByRole("textbox", {
      name: "Write a comment",
    })) as HTMLTextAreaElement;
    await userEvent.type(textarea, "Half written");

    localStorage.removeItem(SESSION_KEY);
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    await waitFor(() => expect(isGuestHeader()).toBe(true));
    await waitFor(() => expect(textarea.disabled).toBe(true));
    expect(textarea.isConnected).toBe(true);
    expect(textarea.value).toBe("Half written");
  });

  it("recovers from an invalid stored session", async () => {
    localStorage.setItem(SESSION_KEY, "{broken");
    renderApp("/");
    await appReady();

    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(signOutFromFirebase).toHaveBeenCalledOnce();
    expect(isGuestHeader()).toBe(true);
    expect(
      await screen.findByText("Your saved session wasn't valid, so you've been signed out."),
    ).toBeTruthy();
  });

  it("logs out to Guest Mode, keeping other storage", async () => {
    storeSession();
    localStorage.setItem("unrelated", "1");
    stubApi({ "GET /games/:slug": guestAwareDetails });
    renderApp("/");
    await userEvent.click(await screen.findByRole("button", { name: "Log Out" }));

    await waitFor(() => expect(isGuestHeader()).toBe(true));
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(localStorage.getItem("unrelated")).toBe("1");
    expect(signOutFromFirebase).toHaveBeenCalledOnce();
    expect(screen.getByText("You've been logged out.")).toBeTruthy();
  });

  it("stays a guest and reports it when Firebase sign-out fails", async () => {
    storeSession();
    vi.mocked(signOutFromFirebase).mockRejectedValue(new Error("offline"));
    renderApp("/");
    await userEvent.click(await screen.findByRole("button", { name: "Open menu" }));
    const menu = document.querySelector<HTMLElement>("#mobile-menu")!;
    fireEvent.click(menu.querySelector(".mobile-menu__logout")!);

    await waitFor(() => expect(isGuestHeader()).toBe(true));
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(
      await screen.findByText("Couldn't sign out of Firebase. You're browsing as a guest."),
    ).toBeTruthy();
  });

  it("shows the guest state of open Game Details after the session ends", async () => {
    storeSession();
    stubApi({ "GET /games/:slug": guestAwareDetails });
    const { router } = renderApp("/?game=tiny-glade");
    const favorite = await screen.findByRole("button", { name: /Favorites/ });
    expect(favorite.getAttribute("aria-pressed")).toBe("true");

    localStorage.removeItem(SESSION_KEY);
    await act(async () => router.navigate("/?game=tiny-glade&page=1"));

    await waitFor(async () => {
      const again = await screen.findByRole("button", { name: /Favorites/ });
      expect(again.getAttribute("aria-pressed")).toBe("false");
    });
    const dialog = document.querySelector<HTMLDialogElement>("dialog.game-details")!;
    expect(dialog.open).toBe(true);
  });
});
