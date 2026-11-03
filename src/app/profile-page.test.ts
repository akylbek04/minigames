import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubApi } from "../test/api";
import { PROFILE, isShown, mountApp, snackbarMessages, storeSession } from "../test/app";
import { flush, query } from "../test/dom";
import { loadProfile, recordActivity } from "../profile/profile-store";

vi.mock("../auth/firebase", () => ({ firebaseAuth: {} }));
vi.mock("firebase/auth", () => ({ signOut: vi.fn(() => Promise.resolve()) }));

const click = (selector: string, index = 0): void =>
  [...document.querySelectorAll<HTMLElement>(selector)][index].click();
const headerAvatar = (): HTMLElement => query(document, ".header__avatar");

describe("profile page", () => {
  beforeEach(() => {
    stubApi();
  });

  it("sends guests Home with Auth open and a warning", async () => {
    await mountApp("/profile");

    expect(location.pathname).toBe("/");
    expect(location.search).toBe("?auth=login");
    expect(isShown(query(document, ".auth-dialog"))).toBe(true);
    expect(snackbarMessages()).toContain("Log in to see your profile.");
  });

  it("shows the signed-in user's statistics and badges", async () => {
    storeSession();
    recordActivity(PROFILE.email, "view", "tiny-glade");
    await mountApp("/profile");

    expect(query(document, ".profile-page__name").textContent).toBe(PROFILE.displayName);
    expect(query(document, ".profile-page__summary").textContent).toContain("1 of 10");
    expect(query(document, "[data-achievement=explorer]").className).not.toContain("--locked");
    expect(query(document, "[data-achievement=fan]").className).toContain("--locked");
    expect(query(document, ".profile-page__history-item").textContent).toContain("Tiny Glade");
  });

  it("returns to Home as a guest when the user logs out on the profile page", async () => {
    storeSession();
    await mountApp("/profile");
    query<HTMLButtonElement>(document, ".header__logout").click();
    await flush();

    expect(location.pathname).toBe("/");
    expect(document.querySelector(".profile-page__name")).toBeNull();
    expect(snackbarMessages()).toContain("You've been logged out.");
  });

  it("opens from the header profile link", async () => {
    storeSession();
    await mountApp("/");
    query<HTMLAnchorElement>(document, "a.header__profile").click();
    expect(location.pathname).toBe("/profile");
    expect(document.title).toBe("Your Profile — MiniGames");
  });

  it("saves a custom avatar that replaces the initials, and can reset it", async () => {
    storeSession();
    await mountApp("/profile");
    expect(headerAvatar().textContent).toBe("AD");

    click("[data-icon=pets]");
    click("[data-color='2']");
    click(".profile-page__actions .btn--filled");
    await flush();

    expect(loadProfile(PROFILE.email).avatar).toEqual({ icon: "pets", color: 2 });
    expect(headerAvatar().textContent).toBe("pets");
    expect(headerAvatar().className).toContain("user-avatar--color-3");

    click(".profile-page__actions .btn--outline", 0);
    await flush();
    expect(loadProfile(PROFILE.email).avatar).toBeUndefined();
    expect(headerAvatar().textContent).toBe("AD");
  });

  it("clears the history but keeps the badges", async () => {
    storeSession();
    recordActivity(PROFILE.email, "view", "tiny-glade");
    await mountApp("/profile");

    click("[aria-labelledby=profile-history] .btn--outline");
    await flush();

    expect(document.querySelector(".profile-page__history-item")).toBeNull();
    expect(loadProfile(PROFILE.email).unlocked).toHaveProperty("explorer");
  });

  it("resets all progress only on the second click", async () => {
    storeSession();
    recordActivity(PROFILE.email, "view", "tiny-glade");
    await mountApp("/profile");

    click("[aria-labelledby=profile-settings] .btn");
    expect(loadProfile(PROFILE.email).counts.view).toBe(1);

    click("[aria-labelledby=profile-settings] .btn");
    await flush();
    expect(loadProfile(PROFILE.email).counts.view).toBe(0);
    expect(query(document, "[data-achievement=explorer]").className).toContain("--locked");
  });
});
