import { beforeEach, describe, expect, it, vi } from "vitest";
import * as firebaseAuth from "firebase/auth";
import { DETAILS, requestsTo, stubApi, type FetchMock } from "../test/api";
import {
  PROFILE,
  SESSION_KEY,
  isShown,
  mountApp,
  snackbarMessages,
  storeSession,
} from "../test/app";
import { flush, query, typeInto } from "../test/dom";

vi.mock("../auth/firebase", () => ({ firebaseAuth: {} }));
vi.mock("firebase/auth", () => ({
  signOut: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
}));

const EXPIRED_MESSAGE = "Your session has expired. You're browsing as a guest now.";
const gameDialog = (): HTMLDialogElement => query(document, ".game-details");
const authDialog = (): HTMLDialogElement => query(document, ".auth-dialog");
const isGuestHeader = (): boolean => document.querySelector(".header__login") !== null;
const favorite = (): HTMLButtonElement => query(document, ".game-details__favorite");
const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

describe("session flows", () => {
  let api: FetchMock;

  beforeEach(() => {
    api = stubApi();
    vi.mocked(firebaseAuth.signOut).mockResolvedValue();
  });

  it("restores Game Details in authenticated mode after signing in from it", async () => {
    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValue({
      user: { displayName: PROFILE.displayName, email: PROFILE.email },
    } as unknown as firebaseAuth.UserCredential);
    await mountApp("/?game=tiny-glade");
    query<HTMLButtonElement>(document, ".game-details__favorite").click();
    await flush();
    expect(isShown(authDialog())).toBe(true);

    typeInto(query(document, "#login-email"), PROFILE.email);
    typeInto(query(document, "#login-password"), "secret1");
    query<HTMLFormElement>(authDialog(), "form").requestSubmit();
    await flush();

    expect(location.search).toBe("?game=tiny-glade");
    expect(isShown(gameDialog())).toBe(true);
    expect(isShown(authDialog())).toBe(false);
    expect(requestsTo(api, "GET /games/:slug").at(-1)?.searchParams.get("userEmail")).toBe(
      PROFILE.email,
    );
    expect(query<HTMLTextAreaElement>(document, ".game-details__comment-input").disabled).toBe(
      false,
    );
    expect(query(document, ".header__username").textContent).toBe(PROFILE.displayName);
    expect(snackbarMessages()).toContain("Welcome, Alex Doe!");
    // The blocked favorite toggle is not replayed.
    expect(requestsTo(api, "POST /games/:slug/favorite")).toHaveLength(0);
  });

  it("restores a valid session on load without extending it", async () => {
    const authenticatedAt = Date.now() - 60_000;
    storeSession(authenticatedAt);
    await mountApp("/");

    expect(isGuestHeader()).toBe(false);
    expect(snackbarMessages()).toEqual([]);
    expect(JSON.parse(localStorage.getItem(SESSION_KEY) ?? "").authenticatedAt).toBe(
      authenticatedAt,
    );
  });

  it("drops to Guest Mode with one message when the session runs out in use", async () => {
    storeSession(Date.now() - 5 * 60_000 + 1000);
    await mountApp("/?game=tiny-glade");
    expect(isGuestHeader()).toBe(false);

    await wait(1100);
    document.dispatchEvent(new Event("visibilitychange"));

    expect(isGuestHeader()).toBe(true);
    expect(query<HTMLTextAreaElement>(document, ".game-details__comment-input").disabled).toBe(
      true,
    );
    expect(snackbarMessages().filter((message) => message === EXPIRED_MESSAGE)).toHaveLength(1);
    expect(firebaseAuth.signOut).toHaveBeenCalledOnce();
  });

  it("continues a navigation in Guest Mode when the session has expired", async () => {
    storeSession(Date.now() - 4 * 60_000);
    const router = await mountApp("/");
    storeSession(Date.now() - 6 * 60_000);

    router.navigateTo("/library");
    await flush();

    expect(document.querySelector("main")?.className).toBe("library-page");
    expect(isGuestHeader()).toBe(true);
    expect(snackbarMessages()).toContain(EXPIRED_MESSAGE);
  });

  it("recovers from an invalid stored session", async () => {
    localStorage.setItem(SESSION_KEY, "{broken");
    await mountApp("/");

    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(firebaseAuth.signOut).toHaveBeenCalledOnce();
    expect(isGuestHeader()).toBe(true);
    expect(snackbarMessages()).toContain(
      "Your saved session wasn't valid, so you've been signed out.",
    );
  });

  it("logs out to Guest Mode, keeping other storage and resetting Game Details", async () => {
    storeSession();
    localStorage.setItem("unrelated", "1");
    api = stubApi({
      "GET /games/:slug": (url) =>
        Response.json({
          data: { ...DETAILS, isLikedByCurrentUser: url.searchParams.has("userEmail") },
        }),
    });
    await mountApp("/");
    query<HTMLButtonElement>(document, ".header__logout").click();
    await flush();

    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(localStorage.getItem("unrelated")).toBe("1");
    expect(firebaseAuth.signOut).toHaveBeenCalledOnce();
    expect(isGuestHeader()).toBe(true);
    expect(snackbarMessages()).toContain("You've been logged out.");
  });

  it("stays a guest and reports it when Firebase sign-out fails", async () => {
    storeSession();
    vi.mocked(firebaseAuth.signOut).mockRejectedValue(new Error("offline"));
    await mountApp("/");
    query<HTMLButtonElement>(document, ".mobile-menu__logout").click();
    await flush();

    expect(isGuestHeader()).toBe(true);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(snackbarMessages()).toContain(
      "Couldn't sign out of Firebase. You're browsing as a guest.",
    );
  });

  it("shows the guest state of open Game Details after the session ends", async () => {
    storeSession();
    api = stubApi({
      "GET /games/:slug": (url) =>
        Response.json({
          data: { ...DETAILS, isLikedByCurrentUser: url.searchParams.has("userEmail") },
        }),
    });
    const router = await mountApp("/?game=tiny-glade");
    expect(favorite().getAttribute("aria-pressed")).toBe("true");

    localStorage.removeItem(SESSION_KEY);
    router.updateQuery({ page: "1" });
    await flush();

    expect(favorite().getAttribute("aria-pressed")).toBe("false");
    expect(isShown(gameDialog())).toBe(true);
  });
});
