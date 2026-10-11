import { beforeEach, describe, expect, it, vi } from "vitest";
import { COMMENT, stubApi } from "../test/api";
import { mountApp, storeSession } from "../test/app";
import { flush, query, typeInto } from "../test/dom";

vi.mock("../auth/firebase", () => ({ firebaseAuth: {} }));
vi.mock("firebase/auth", () => ({ signOut: vi.fn(() => Promise.resolve()) }));

const AUTHORS = ["  maple", "Birch", "maple", "🍄 Fungi"];

function avatars(): HTMLElement[] {
  return [
    ...document.querySelectorAll<HTMLElement>(".game-details__comment .game-details__avatar"),
  ];
}

function colorOf(avatar: HTMLElement): string | undefined {
  return /game-details__avatar--(\d)/.exec(avatar.className)?.[1];
}

describe("comment avatars", () => {
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

  it("shows the first non-space character of the name, uppercased", async () => {
    await mountApp("/?game=tiny-glade");
    expect(avatars().map((avatar) => avatar.textContent)).toEqual(["M", "B", "M", "🍄"]);
  });

  it("picks a random avatar-random token per commenter", async () => {
    const random = vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.99);
    await mountApp("/?game=tiny-glade");

    expect(random).toHaveBeenCalled();
    const [first, second] = avatars().map((avatar) => colorOf(avatar));
    expect(first).toBe("1");
    expect(second).toBe("5");
  });

  it("keeps each commenter's color across reloads of the list", async () => {
    storeSession();
    await mountApp("/?game=tiny-glade");
    const before = avatars().map((avatar) => colorOf(avatar));

    typeInto(query(document, ".game-details__comment-input"), "Hi");
    query<HTMLButtonElement>(document, ".game-details__comment-submit").click();
    await flush();

    expect(avatars().map((avatar) => colorOf(avatar))).toEqual(before);
  });
});
