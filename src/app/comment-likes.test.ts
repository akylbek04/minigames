import { beforeEach, describe, expect, it, vi } from "vitest";
import { COMMENT, requestsTo, stubApi, type FetchMock } from "../test/api";
import { PROFILE, isShown, mountApp, snackbarMessages, storeSession } from "../test/app";
import { flush, query } from "../test/dom";

vi.mock("../auth/firebase", () => ({ firebaseAuth: {} }));
vi.mock("firebase/auth", () => ({ signOut: vi.fn(() => Promise.resolve()) }));

const likeButton = (): HTMLButtonElement => query(document, ".game-details__like");

describe("comment likes", () => {
  let api: FetchMock;

  beforeEach(() => {
    api = stubApi();
  });

  it("sends guests to Auth with a warning instead of liking", async () => {
    await mountApp("/?game=tiny-glade");
    likeButton().click();
    await flush();

    expect(requestsTo(api, "POST /comments/:id/like")).toHaveLength(0);
    expect(isShown(query(document, ".auth-dialog"))).toBe(true);
    expect(snackbarMessages()).toContain("Log in to like comments.");
  });

  it("starts from the personalized list and updates from the response only", async () => {
    storeSession();
    const like = Promise.withResolvers<Response>();
    api = stubApi({
      "GET /games/:slug/comments": () =>
        Response.json({
          data: [{ ...COMMENT, isLikedByCurrentUser: true, likesCount: 5 }],
          meta: { totalComments: 1 },
        }),
      "POST /comments/:id/like": () => like.promise,
    });
    await mountApp("/?game=tiny-glade");

    expect(likeButton().getAttribute("aria-pressed")).toBe("true");
    likeButton().click();
    expect(likeButton().disabled).toBe(true);
    expect(likeButton().getAttribute("aria-busy")).toBe("true");
    // Nothing changes before the server answers.
    expect(likeButton().textContent).toContain("5");

    const [url] = requestsTo(api, "POST /comments/:id/like");
    expect(url.pathname).toBe(`/api/comments/${COMMENT.commentId}/like`);
    expect(JSON.parse(String(api.mock.lastCall?.[1]?.body))).toEqual({ userEmail: PROFILE.email });

    like.resolve(Response.json({ data: { isLikedByCurrentUser: false, likesCount: 4 } }));
    await flush();
    expect(likeButton().getAttribute("aria-pressed")).toBe("false");
    expect(likeButton().textContent).toContain("4");
    expect(likeButton().disabled).toBe(false);
  });

  it("keeps the state and does not resend after a lost connection", async () => {
    storeSession();
    api = stubApi({
      "POST /comments/:id/like": () => Promise.reject(new TypeError("Failed to fetch")),
    });
    await mountApp("/?game=tiny-glade");
    likeButton().click();
    await flush();

    expect(requestsTo(api, "POST /comments/:id/like")).toHaveLength(1);
    expect(likeButton().getAttribute("aria-pressed")).toBe("false");
    expect(snackbarMessages().join(" ")).toContain("We couldn't confirm the like.");
  });

  it("reports a rejected like as an error", async () => {
    storeSession();
    stubApi({
      "POST /comments/:id/like": () => Response.json({ error: "Gone" }, { status: 404 }),
    });
    await mountApp("/?game=tiny-glade");
    likeButton().click();
    await flush();

    expect(snackbarMessages()).toContain("Couldn't update the like. Please try again.");
  });
});
