import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signInWithEmail } from "../auth/auth-service";
import { loadProfile } from "../profile/profile-store";
import { COMMENT, DETAILS, requestsTo, stubApi, type FetchMock } from "../test/api";
import { PROFILE, SESSION_KEY, storeSession } from "../test/app";
import { renderApp } from "../test/render-app";

vi.mock("../auth/auth-service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../auth/auth-service")>()),
  signInWithEmail: vi.fn(),
  signOutFromFirebase: vi.fn(() => Promise.resolve()),
}));
vi.mock("../auth/firebase", () => ({ firebaseAuth: {} }));

const profile = () => loadProfile(PROFILE.email);
const gameDialog = (): HTMLDialogElement => document.querySelector("dialog.game-details")!;
const authDialog = (): HTMLDialogElement => document.querySelector("dialog.auth-dialog")!;
const isShown = (dialog: HTMLDialogElement): boolean =>
  dialog.open && !dialog.classList.contains("is-closing");
const favorite = () => screen.findByRole("button", { name: /Favorites/ });
const favoriteButton = async () => (await favorite()) as HTMLButtonElement;
const comment = () =>
  screen.getByRole("textbox", { name: "Write a comment" }) as HTMLTextAreaElement;
const submit = () => screen.getByRole("button", { name: "Submit comment" }) as HTMLButtonElement;
const like = () => screen.findByRole("button", { name: /Like comment by/ });
const likeButton = async () => (await like()) as HTMLButtonElement;
const posts = (api: FetchMock) => api.mock.calls.filter(([, init]) => init?.method === "POST");

function open(url = "/?game=tiny-glade") {
  return renderApp(url);
}

async function opened(url?: string) {
  const view = open(url);
  await screen.findByRole("heading", { name: "Tiny Glade" });
  await screen.findByText(COMMENT.authorName);
  return view;
}

describe("game details dialog", () => {
  beforeEach(() => {
    stubApi();
  });

  it("opens from the URL, shows the details and closes by the URL", async () => {
    const { router } = await opened("/library?page=2&game=tiny-glade");
    expect(isShown(gameDialog())).toBe(true);
    expect(screen.getByText("Build tiny castles.")).toBeTruthy();
    expect(screen.getByText("Top Records")).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Close game details" }));
    expect(router.state.location.search).toBe("?page=2");
  });

  it("closes on the backdrop and on Esc", async () => {
    const { router } = await opened("/?game=tiny-glade");
    fireEvent.click(gameDialog());
    await waitFor(() => expect(router.state.location.search).toBe(""));

    await act(async () => router.navigate("/?game=tiny-glade"));
    await screen.findByRole("heading", { name: "Tiny Glade" });
    fireEvent(gameDialog(), new Event("cancel", { cancelable: true }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
  });

  it("offers Buy Now with the price for paid games", async () => {
    stubApi({
      "GET /games/:slug": () =>
        Response.json({ data: { ...DETAILS, specs: { ...DETAILS.specs, price: "$4.99" } } }),
    });
    open();
    expect(await screen.findByRole("button", { name: "Buy Now: $4.99" })).toBeTruthy();
  });

  it("shows Game Not Found for an unknown slug and closes from its button", async () => {
    stubApi({ "GET /games/:slug": () => Response.json({ error: "x" }, { status: 404 }) });
    const { router } = open("/?game=nope");
    expect(await screen.findByText("Game Not Found")).toBeTruthy();
    expect(screen.getByText(/called “nope”/)).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Back to games" }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
  });

  it("starts every opened game with an empty comment field", async () => {
    storeSession();
    const { router } = await opened();
    await userEvent.type(comment(), "Draft");
    await act(async () => router.navigate("/"));
    await act(async () => router.navigate("/?game=tiny-glade"));
    await screen.findByText(COMMENT.authorName);
    expect(comment().value).toBe("");
  });
});

describe("comments", () => {
  let api: FetchMock;
  beforeEach(() => {
    api = stubApi();
  });

  it("locks the form for guests and loads comments without an email", async () => {
    await opened();
    expect(comment().disabled).toBe(true);
    expect(comment().placeholder).toBe("Log in to write a comment");
    expect(submit().disabled).toBe(true);
    expect(requestsTo(api, "GET /games/:slug/comments")[0].searchParams.has("userEmail")).toBe(
      false,
    );
  });

  it("renders comment text and the total as plain text", async () => {
    await opened();
    expect(screen.getByText(COMMENT.text)).toBeTruthy();
    expect(document.querySelector(".game-details__comment-text b")).toBeNull();
    expect(screen.getByRole("heading", { name: "Comments (7)" })).toBeTruthy();
  });

  it("posts with Enter, locks while sending, then clears and reloads the latest", async () => {
    storeSession();
    const post = Promise.withResolvers<Response>();
    api = stubApi({ "POST /games/:slug/comments": () => post.promise });
    await opened();

    expect(document.querySelector(".game-details__avatar--self")?.textContent).toBe("A");
    await userEvent.type(comment(), "  So cozy!  ");
    expect(submit().disabled).toBe(false);
    await userEvent.type(comment(), "{Enter}");

    expect(comment().disabled).toBe(true);
    expect(submit().disabled).toBe(true);
    expect(posts(api).map(([, init]) => JSON.parse(String(init?.body)))).toEqual([
      { userEmail: PROFILE.email, authorName: PROFILE.displayName, text: "So cozy!" },
    ]);

    await act(async () => post.resolve(Response.json({ data: COMMENT }, { status: 201 })));
    await waitFor(() => expect(comment().value).toBe(""));
    expect(comment().disabled).toBe(false);
    const reload = requestsTo(api, "GET /games/:slug/comments").at(-1);
    expect(Object.fromEntries(reload?.searchParams ?? [])).toEqual({
      limit: "3",
      sort: "newest",
      userEmail: PROFILE.email,
    });
    expect(screen.getByText("Your comment was posted.")).toBeTruthy();
  });

  it("keeps Shift+Enter for new lines", async () => {
    storeSession();
    await opened();
    await userEvent.type(comment(), "Line one{Shift>}{Enter}{/Shift}two");
    expect(posts(api)).toHaveLength(0);
    expect(comment().value).toBe("Line one\ntwo");
  });

  it("rejects empty and over-long comments without sending", async () => {
    storeSession();
    await opened();

    await userEvent.type(comment(), "   {Enter}");
    expect(screen.getByText("Write something before sending.")).toBeTruthy();
    await userEvent.clear(comment());
    fireEvent.change(comment(), { target: { value: "x".repeat(501) } });
    expect(submit().disabled).toBe(true);
    fireEvent.keyDown(comment(), { key: "Enter" });

    expect(posts(api)).toHaveLength(0);
    expect(screen.getByText("Comments can be up to 500 characters long.")).toBeTruthy();
    // Opening the game as a signed-in user unlocks the first badge.
    expect(
      [...document.querySelectorAll(".snackbar__message")].map((node) => node.textContent),
    ).toEqual([
      "Achievement unlocked: Explorer!",
      "Write something before sending.",
      "Comments can be up to 500 characters long.",
    ]);
  });

  it("keeps the text for a retry when the server rejects the comment", async () => {
    storeSession();
    stubApi({
      "POST /games/:slug/comments": () => Response.json({ error: "Bad text" }, { status: 400 }),
    });
    await opened();
    await userEvent.type(comment(), "Hello");
    await userEvent.click(submit());

    expect(
      await screen.findByText(
        "Couldn't post your comment. Your text is kept, so you can try again.",
      ),
    ).toBeTruthy();
    expect(comment().value).toBe("Hello");
    expect(comment().disabled).toBe(false);
  });

  it("says the result is unknown after a lost connection and does not resend", async () => {
    storeSession();
    api = stubApi({
      "POST /games/:slug/comments": () => Promise.reject(new TypeError("Failed to fetch")),
    });
    await opened();
    await userEvent.type(comment(), "Hello{Enter}");

    expect(
      await screen.findByText(/We couldn't confirm whether your comment was posted/),
    ).toBeTruthy();
    expect(posts(api)).toHaveLength(1);
    expect(comment().value).toBe("Hello");
  });

  it("shows an empty state and keeps the details when the comments fail", async () => {
    stubApi({
      "GET /games/:slug/comments": () => Response.json({ data: [], meta: { totalComments: 0 } }),
    });
    open();
    expect(await screen.findByText("No comments yet")).toBeTruthy();

    stubApi({ "GET /games/:slug/comments": () => Response.json({ error: "x" }, { status: 500 }) });
    open();
    const banners = await screen.findAllByText(/The server didn't respond as expected/);
    expect(banners.length).toBeGreaterThan(0);
    const titles = await screen.findAllByRole("heading", { name: "Tiny Glade" });
    expect(titles.length).toBeGreaterThan(0);
  });
});

const avatars = () => [
  ...document.querySelectorAll<HTMLElement>(".game-details__comment .game-details__avatar"),
];
const colorOf = (avatar: HTMLElement) => /game-details__avatar--(\d)/.exec(avatar.className)?.[1];

describe("comment avatars", () => {
  const AUTHORS = ["  maple", "Birch", "maple", "🍄 Fungi"];
  beforeEach(() => {
    stubApi({
      "GET /games/:slug/comments": () =>
        Response.json({
          data: AUTHORS.map((authorName, index) => ({
            ...COMMENT,
            commentId: String(index),
            authorName,
          })),
          meta: { totalComments: AUTHORS.length },
        }),
    });
  });

  it("shows the first non-space character, uppercased, with a color token", async () => {
    open();
    await screen.findAllByText("Birch");
    expect(avatars().map((avatar) => avatar.textContent)).toEqual(["M", "B", "M", "🍄"]);
    for (const avatar of avatars()) {
      expect(colorOf(avatar)).toMatch(/^[1-5]$/);
    }
  });
});

describe("favorites", () => {
  let api: FetchMock;
  beforeEach(() => {
    api = stubApi();
  });

  it("sends guests to Auth with a warning instead of toggling", async () => {
    const { router } = await opened();
    await userEvent.click(await favorite());

    expect(posts(api)).toHaveLength(0);
    expect(router.state.location.search).toBe("?game=tiny-glade&auth=login");
    expect(isShown(authDialog())).toBe(true);
    expect(isShown(gameDialog())).toBe(false);
    expect(screen.getByText("Log in to add games to your favorites.")).toBeTruthy();
  });

  it("loads the signed-in user's favorite state and toggles it from the response", async () => {
    storeSession();
    const toggle = Promise.withResolvers<Response>();
    api = stubApi({
      "GET /games/:slug": () => Response.json({ data: { ...DETAILS, isLikedByCurrentUser: true } }),
      "POST /games/:slug/favorite": () => toggle.promise,
    });
    await opened();

    expect(requestsTo(api, "GET /games/:slug")[0].search).toBe("?userEmail=alex%40rs.school");
    const button = await favoriteButton();
    expect(button.textContent).toContain("Remove from Favorites");

    await userEvent.click(button);
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(button);
    expect(posts(api)).toHaveLength(1);
    expect(JSON.parse(String(posts(api)[0][1]?.body))).toEqual({ userEmail: PROFILE.email });

    await act(async () =>
      toggle.resolve(Response.json({ data: { isFavorited: false, likesCount: 999 } })),
    );
    await waitFor(() => expect(button.disabled).toBe(false));
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.textContent).toContain("Add to Favorites");
    expect(document.querySelector(".game-details__stats")?.textContent).toContain("999");
  });

  it("does not resend a toggle whose outcome is unknown", async () => {
    storeSession();
    api = stubApi({
      "POST /games/:slug/favorite": () => Promise.reject(new TypeError("Failed to fetch")),
    });
    await opened();
    await userEvent.click(await favorite());

    expect(await screen.findByText(/We couldn't confirm the favorites change/)).toBeTruthy();
    expect(posts(api)).toHaveLength(1);
    const again = await favoriteButton();
    expect(again.getAttribute("aria-pressed")).toBe("false");
  });

  it("reports a rejected toggle as an error", async () => {
    storeSession();
    stubApi({
      "POST /games/:slug/favorite": () => Response.json({ error: "Nope" }, { status: 404 }),
    });
    await opened();
    await userEvent.click(await favorite());
    expect(
      await screen.findByText("Couldn't update your favorites. Please try again."),
    ).toBeTruthy();
    expect(document.querySelector(".snackbar--error")).not.toBeNull();
  });

  it("blocks the request after expiry and restores Game Details when Auth closes", async () => {
    storeSession(Date.now() - 4 * 60_000);
    const { router } = await opened();
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...PROFILE, authenticatedAt: Date.now() - 6 * 60_000 }),
    );
    await userEvent.click(await favorite());

    expect(posts(api)).toHaveLength(0);
    expect(
      await screen.findByText("Your session has expired. You're browsing as a guest now."),
    ).toBeTruthy();
    expect(isShown(authDialog())).toBe(true);
    expect(isShown(gameDialog())).toBe(false);

    await act(async () => router.navigate(-1));
    await waitFor(() => expect(router.state.location.search).toBe("?game=tiny-glade"));
    expect(isShown(gameDialog())).toBe(true);
    expect(isShown(authDialog())).toBe(false);
    // Back in Guest Mode: the details were re-requested without an email.
    await waitFor(() => expect(requestsTo(api, "GET /games/:slug").at(-1)?.search).toBe(""));
  });

  it("restores Game Details in authenticated mode after signing in from it", async () => {
    vi.mocked(signInWithEmail).mockResolvedValue({
      displayName: PROFILE.displayName,
      email: PROFILE.email,
    });
    const { router } = await opened();
    await userEvent.click(await favorite());
    expect(isShown(authDialog())).toBe(true);

    await userEvent.type(screen.getByLabelText("Email Address"), PROFILE.email);
    await userEvent.type(screen.getByLabelText("Password"), "secret1");
    await userEvent.click(within(authDialog()).getByRole("button", { name: "Login" }));

    await waitFor(() => expect(router.state.location.search).toBe("?game=tiny-glade"));
    expect(isShown(gameDialog())).toBe(true);
    expect(isShown(authDialog())).toBe(false);
    await waitFor(() =>
      expect(requestsTo(api, "GET /games/:slug").at(-1)?.searchParams.get("userEmail")).toBe(
        PROFILE.email,
      ),
    );
    await waitFor(() => expect(comment().disabled).toBe(false));
    expect(screen.getByText("Welcome, Alex Doe!")).toBeTruthy();
    // The blocked favorite toggle is not replayed, and the visit is not counted.
    expect(posts(api)).toHaveLength(0);
    expect(profile().counts.view).toBe(0);
  });
});

describe("comment likes", () => {
  let api: FetchMock;
  beforeEach(() => {
    api = stubApi();
  });

  it("sends guests to Auth with a warning instead of liking", async () => {
    await opened();
    await userEvent.click(await like());
    expect(posts(api)).toHaveLength(0);
    expect(isShown(authDialog())).toBe(true);
    expect(screen.getByText("Log in to like comments.")).toBeTruthy();
  });

  it("starts from the personalized list and updates from the response only", async () => {
    storeSession();
    const answer = Promise.withResolvers<Response>();
    api = stubApi({
      "GET /games/:slug/comments": () =>
        Response.json({
          data: [{ ...COMMENT, isLikedByCurrentUser: true, likesCount: 5 }],
          meta: { totalComments: 1 },
        }),
      "POST /comments/:id/like": () => answer.promise,
    });
    await opened();
    const button = await likeButton();

    expect(button.getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(button);
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    // Nothing changes before the server answers.
    expect(button.textContent).toContain("5");
    expect(requestsTo(api, "POST /comments/:id/like")[0].pathname).toBe(
      `/api/comments/${COMMENT.commentId}/like`,
    );

    await act(async () =>
      answer.resolve(Response.json({ data: { isLikedByCurrentUser: false, likesCount: 4 } })),
    );
    await waitFor(() => expect(button.disabled).toBe(false));
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.textContent).toContain("4");
  });

  it("keeps the state and does not resend after a lost connection", async () => {
    storeSession();
    api = stubApi({
      "POST /comments/:id/like": () => Promise.reject(new TypeError("Failed to fetch")),
    });
    await opened();
    await userEvent.click(await like());
    expect(await screen.findByText(/We couldn't confirm the like/)).toBeTruthy();
    expect(requestsTo(api, "POST /comments/:id/like")).toHaveLength(1);
    const again = await likeButton();
    expect(again.getAttribute("aria-pressed")).toBe("false");
  });

  it("reports a rejected like as an error", async () => {
    storeSession();
    stubApi({ "POST /comments/:id/like": () => Response.json({ error: "Gone" }, { status: 404 }) });
    await opened();
    await userEvent.click(await like());
    expect(await screen.findByText("Couldn't update the like. Please try again.")).toBeTruthy();
  });
});

describe("activity tracking", () => {
  beforeEach(() => {
    stubApi({
      "POST /games/:slug/favorite": () =>
        Response.json({ data: { isFavorited: true, likesCount: 5 } }),
      "POST /comments/:id/like": () =>
        Response.json({ data: { isLikedByCurrentUser: true, likesCount: 2 } }),
    });
  });

  it("records nothing for guests", async () => {
    await opened();
    expect(profile().counts.view).toBe(0);
  });

  it("records a view, a favorite, a like and a comment for the signed-in user", async () => {
    storeSession();
    await opened();
    expect(profile().counts.view).toBe(1);
    expect(profile().games).toEqual(["tiny-glade"]);

    await userEvent.click(await favorite());
    await waitFor(() => expect(profile().counts.favorite).toBe(1));
    await userEvent.click(await like());
    await waitFor(() => expect(profile().counts.like).toBe(1));
    await userEvent.type(comment(), "Great game");
    await userEvent.click(submit());
    await waitFor(() => expect(profile().counts.comment).toBe(1));

    expect(profile().unlocked).toHaveProperty("all-rounder");
    expect(await screen.findByText("Achievement unlocked: All-Rounder!")).toBeTruthy();
  });

  it("counts a favorited game and a liked comment only once", async () => {
    storeSession();
    stubApi({
      "POST /games/:slug/favorite": () =>
        Response.json({ data: { isFavorited: true, likesCount: 5 } }),
    });
    await opened();
    await userEvent.click(await favorite());
    await waitFor(() => expect(profile().counts.favorite).toBe(1));
    await userEvent.click(await favorite());
    await act(async () => {});
    expect(profile().counts.favorite).toBe(1);
  });
});
