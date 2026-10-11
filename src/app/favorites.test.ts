import { beforeEach, describe, expect, it, vi } from "vitest";
import { DETAILS, requestsTo, stubApi, type FetchMock } from "../test/api";
import { PROFILE, isShown, mountApp, snackbarMessages, storeSession } from "../test/app";
import { flush, query } from "../test/dom";

vi.mock("../auth/firebase", () => ({ firebaseAuth: {} }));
vi.mock("firebase/auth", () => ({ signOut: vi.fn(() => Promise.resolve()) }));

const gameDialog = (): HTMLDialogElement => query(document, ".game-details");
const authDialog = (): HTMLDialogElement => query(document, ".auth-dialog");
const favoriteButton = (): HTMLButtonElement => query(document, ".game-details__favorite");

describe("favorites", () => {
  let api: FetchMock;

  beforeEach(() => {
    api = stubApi();
  });

  it("sends guests to Auth with a warning instead of toggling", async () => {
    await mountApp("/?game=tiny-glade");
    favoriteButton().click();
    await flush();

    expect(requestsTo(api, "POST /games/:slug/favorite")).toHaveLength(0);
    expect(location.search).toBe("?game=tiny-glade&auth=login");
    expect(isShown(authDialog())).toBe(true);
    expect(isShown(gameDialog())).toBe(false);
    expect(snackbarMessages()).toContain("Log in to add games to your favorites.");
  });

  it("loads the signed-in user's favorite state and toggles it from the response", async () => {
    storeSession();
    const toggle = Promise.withResolvers<Response>();
    api = stubApi({
      "GET /games/:slug": () => Response.json({ data: { ...DETAILS, isLikedByCurrentUser: true } }),
      "POST /games/:slug/favorite": () => toggle.promise,
    });
    await mountApp("/?game=tiny-glade");

    const [detailsUrl] = requestsTo(api, "GET /games/:slug");
    expect(detailsUrl.search).toBe("?userEmail=alex%40rs.school");
    expect(favoriteButton().textContent).toContain("Remove from Favorites");

    favoriteButton().click();
    expect(favoriteButton().disabled).toBe(true);
    expect(favoriteButton().getAttribute("aria-busy")).toBe("true");
    favoriteButton().click();

    const posts = api.mock.calls.filter(([, init]) => init?.method === "POST");
    expect(posts).toHaveLength(1);
    expect(JSON.parse(String(posts[0][1]?.body))).toEqual({ userEmail: PROFILE.email });

    toggle.resolve(Response.json({ data: { isFavorited: false, likesCount: 999 } }));
    await flush();
    expect(favoriteButton().disabled).toBe(false);
    expect(favoriteButton().getAttribute("aria-pressed")).toBe("false");
    expect(favoriteButton().textContent).toContain("Add to Favorites");
    expect(query(document, ".game-details__stats").textContent).toContain("999");
  });

  it("does not resend a toggle whose outcome is unknown", async () => {
    storeSession();
    api = stubApi({
      "POST /games/:slug/favorite": () => Promise.reject(new TypeError("Failed to fetch")),
    });
    await mountApp("/?game=tiny-glade");
    favoriteButton().click();
    await flush();

    expect(requestsTo(api, "POST /games/:slug/favorite")).toHaveLength(1);
    expect(favoriteButton().getAttribute("aria-pressed")).toBe("false");
    expect(favoriteButton().disabled).toBe(false);
    expect(snackbarMessages().join(" ")).toContain("We couldn't confirm the favorites change.");
  });

  it("reports a rejected toggle as an error", async () => {
    storeSession();
    stubApi({
      "POST /games/:slug/favorite": () => Response.json({ error: "Nope" }, { status: 404 }),
    });
    await mountApp("/?game=tiny-glade");
    favoriteButton().click();
    await flush();

    expect(snackbarMessages()).toContain("Couldn't update your favorites. Please try again.");
    expect(document.querySelector(".snackbar--error")).not.toBeNull();
  });

  it("blocks the request after expiry and restores Game Details when Auth closes", async () => {
    storeSession(Date.now() - 4 * 60_000);
    const router = await mountApp("/?game=tiny-glade");
    localStorage.setItem(
      "minigames:akylbek04-minigames:app-session",
      JSON.stringify({ ...PROFILE, authenticatedAt: Date.now() - 6 * 60_000 }),
    );
    favoriteButton().click();
    await flush();

    expect(requestsTo(api, "POST /games/:slug/favorite")).toHaveLength(0);
    expect(snackbarMessages()).toContain(
      "Your session has expired. You're browsing as a guest now.",
    );
    expect(isShown(authDialog())).toBe(true);
    expect(isShown(gameDialog())).toBe(false);

    router.closeOverlay("auth");
    await flush();
    expect(location.search).toBe("?game=tiny-glade");
    expect(isShown(gameDialog())).toBe(true);
    expect(isShown(authDialog())).toBe(false);
    // Back in Guest Mode: the details were re-requested without an email.
    expect(requestsTo(api, "GET /games/:slug").at(-1)?.search).toBe("");
  });
});
