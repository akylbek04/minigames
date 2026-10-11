import { beforeEach, describe, expect, it, vi } from "vitest";
import { COMMENT, requestsTo, stubApi, type FetchMock } from "../test/api";
import { PROFILE, mountApp, snackbarMessages, storeSession } from "../test/app";
import { flush, query, typeInto } from "../test/dom";

vi.mock("../auth/firebase", () => ({ firebaseAuth: {} }));
vi.mock("firebase/auth", () => ({ signOut: vi.fn(() => Promise.resolve()) }));

const textarea = (): HTMLTextAreaElement => query(document, ".game-details__comment-input");
const submit = (): HTMLButtonElement => query(document, ".game-details__comment-submit");

function pressEnter(isShiftPressed = false): void {
  textarea().dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter",
      shiftKey: isShiftPressed,
      bubbles: true,
      cancelable: true,
    }),
  );
}

function commentPosts(api: FetchMock): unknown[] {
  return api.mock.calls
    .filter(([, init]) => init?.method === "POST")
    .map(([, init]) => JSON.parse(String(init?.body)));
}

describe("comments", () => {
  let api: FetchMock;

  beforeEach(() => {
    api = stubApi();
  });

  it("locks the form for guests and loads comments without an email", async () => {
    await mountApp("/?game=tiny-glade");

    expect(textarea().disabled).toBe(true);
    expect(textarea().placeholder).toBe("Log in to write a comment");
    expect(submit().disabled).toBe(true);
    expect(requestsTo(api, "GET /games/:slug/comments")[0].searchParams.has("userEmail")).toBe(
      false,
    );
  });

  it("renders comment text and the total as plain text", async () => {
    await mountApp("/?game=tiny-glade");

    expect(query(document, ".game-details__comment-text").textContent).toBe(COMMENT.text);
    expect(document.querySelector(".game-details__comment-text b")).toBeNull();
    expect(query(document, "#game-details-comments-title").textContent).toBe("Comments (7)");
  });

  it("posts with Enter, locks while sending, then clears and reloads the latest", async () => {
    storeSession();
    const post = Promise.withResolvers<Response>();
    api = stubApi({ "POST /games/:slug/comments": () => post.promise });
    await mountApp("/?game=tiny-glade");

    expect(query(document, ".game-details__avatar--self").textContent).toBe("A");
    typeInto(textarea(), "  So cozy!  ");
    expect(submit().disabled).toBe(false);
    pressEnter();

    expect(textarea().disabled).toBe(true);
    expect(submit().disabled).toBe(true);
    expect(commentPosts(api)).toEqual([
      { userEmail: PROFILE.email, authorName: PROFILE.displayName, text: "So cozy!" },
    ]);

    post.resolve(Response.json({ data: COMMENT }, { status: 201 }));
    await flush();
    expect(textarea().value).toBe("");
    expect(textarea().disabled).toBe(false);
    const reload = requestsTo(api, "GET /games/:slug/comments").at(-1);
    expect(Object.fromEntries(reload?.searchParams ?? [])).toEqual({
      limit: "3",
      sort: "newest",
      userEmail: PROFILE.email,
    });
    expect(snackbarMessages()).toContain("Your comment was posted.");
  });

  it("keeps Shift+Enter for new lines", async () => {
    storeSession();
    await mountApp("/?game=tiny-glade");
    typeInto(textarea(), "Line one");
    pressEnter(true);
    expect(commentPosts(api)).toHaveLength(0);
  });

  it("rejects empty and over-long comments without sending", async () => {
    storeSession();
    await mountApp("/?game=tiny-glade");

    typeInto(textarea(), " ".repeat(3));
    pressEnter();
    typeInto(textarea(), "x".repeat(501));
    expect(submit().disabled).toBe(true);
    pressEnter();

    expect(commentPosts(api)).toHaveLength(0);
    expect(snackbarMessages()).toEqual([
      "Write something before sending.",
      "Comments can be up to 500 characters long.",
    ]);
  });

  it("keeps the text for a retry when the server rejects the comment", async () => {
    storeSession();
    stubApi({
      "POST /games/:slug/comments": () => Response.json({ error: "Bad text" }, { status: 400 }),
    });
    await mountApp("/?game=tiny-glade");
    typeInto(textarea(), "Hello");
    submit().click();
    await flush();

    expect(textarea().value).toBe("Hello");
    expect(textarea().disabled).toBe(false);
    expect(snackbarMessages()).toContain(
      "Couldn't post your comment. Your text is kept, so you can try again.",
    );
  });

  it("says the result is unknown after a lost connection and does not resend", async () => {
    storeSession();
    api = stubApi({
      "POST /games/:slug/comments": () => Promise.reject(new TypeError("Failed to fetch")),
    });
    await mountApp("/?game=tiny-glade");
    typeInto(textarea(), "Hello");
    pressEnter();
    await flush();

    expect(commentPosts(api)).toHaveLength(1);
    expect(textarea().value).toBe("Hello");
    expect(snackbarMessages().join(" ")).toContain(
      "We couldn't confirm whether your comment was posted.",
    );
  });

  it("starts every opened game with an empty comment field", async () => {
    storeSession();
    const router = await mountApp("/?game=tiny-glade");
    typeInto(textarea(), "Draft");
    router.updateQuery({ game: undefined });
    router.updateQuery({ game: "tiny-glade" });
    await flush();

    expect(textarea().value).toBe("");
  });
});
