import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubApi } from "../test/api";
import { PROFILE, mountApp, storeSession } from "../test/app";
import { flush, query, typeInto } from "../test/dom";
import { loadProfile } from "../profile/profile-store";

vi.mock("../auth/firebase", () => ({ firebaseAuth: {} }));
vi.mock("firebase/auth", () => ({ signOut: vi.fn(() => Promise.resolve()) }));

const profile = () => loadProfile(PROFILE.email);

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
    await mountApp("/?game=tiny-glade");
    expect(profile().counts.view).toBe(0);
  });

  it("records a view, a favorite, a like and a comment for the signed-in user", async () => {
    storeSession();
    await mountApp("/?game=tiny-glade");
    expect(profile().counts.view).toBe(1);
    expect(profile().games).toEqual(["tiny-glade"]);

    query<HTMLButtonElement>(document, ".game-details__favorite").click();
    await flush();
    expect(profile().counts.favorite).toBe(1);

    query<HTMLButtonElement>(document, ".game-details__like").click();
    await flush();
    expect(profile().counts.like).toBe(1);

    typeInto(query(document, "textarea"), "Great game");
    query<HTMLButtonElement>(document, ".game-details__comment-form [type=submit]").click();
    await flush();
    expect(profile().counts.comment).toBe(1);

    expect(profile().unlocked).toHaveProperty("all-rounder");
  });
});
