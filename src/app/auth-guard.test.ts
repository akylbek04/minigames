import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubApi } from "../test/api";
import { isShown, mountApp, snackbarMessages, storeSession } from "../test/app";
import { query } from "../test/dom";

vi.mock("../auth/firebase", () => ({ firebaseAuth: {} }));
vi.mock("firebase/auth", () => ({ signOut: vi.fn(() => Promise.resolve()) }));

const authDialog = (): HTMLDialogElement | null => document.querySelector(".auth-dialog");

describe("auth dialog guard", () => {
  beforeEach(() => {
    stubApi();
  });

  it("opens Auth from a URL for guests", async () => {
    await mountApp("/library?auth=register");
    expect(isShown(authDialog())).toBe(true);
    expect(query(document, ".auth-dialog__tab.is-active").textContent).toBe("Register");
  });

  it("removes only the auth parameter for a signed-in user, in place", async () => {
    storeSession();
    const length = history.length;
    await mountApp("/library?category=puzzle&auth=login#top");

    expect(isShown(authDialog())).toBe(false);
    expect(location.pathname + location.search + location.hash).toBe(
      "/library?category=puzzle#top",
    );
    expect(history.length).toBe(length);
    expect(document.querySelector("main")?.className).toBe("library-page");
    expect(snackbarMessages()).toEqual(["You're already signed in."]);
  });

  it("blocks Auth reached through history while signed in", async () => {
    storeSession();
    const router = await mountApp("/");
    router.navigate("/?auth=login");

    expect(location.search).toBe("");
    expect(isShown(authDialog())).toBe(false);
  });

  it("lets a user whose session expired open Auth from the URL", async () => {
    storeSession(Date.now() - 6 * 60_000);
    await mountApp("/?auth=login");

    expect(isShown(authDialog())).toBe(true);
    expect(snackbarMessages()).toContain(
      "Your session has expired. You're browsing as a guest now.",
    );
  });

  it("opens Auth from the header for guests only", async () => {
    await mountApp("/");
    query<HTMLButtonElement>(document, ".header__login").click();
    expect(location.search).toBe("?auth=login");
    expect(isShown(authDialog())).toBe(true);
  });
});
