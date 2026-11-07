import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACHIEVEMENTS } from "../../profile/achievements";
import { loadProfile, recordActivity } from "../../profile/profile-store";
import { stubApi } from "../../test/api";
import { PROFILE, storeSession } from "../../test/app";
import { renderApp } from "../../test/render-app";

vi.mock("../../auth/firebase", () => ({ firebaseAuth: {} }));
vi.mock("../../auth/auth-service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../auth/auth-service")>()),
  signOutFromFirebase: vi.fn(() => Promise.resolve()),
}));

const headerAvatar = () => document.querySelector<HTMLElement>(".header__avatar")!;
const badge = (id: string) =>
  document.querySelector<HTMLElement>(`[data-achievement="${CSS.escape(id)}"]`)!;
const section = (name: string) => screen.getByRole("region", { name });
const choice = (selector: string) => document.querySelector<HTMLButtonElement>(selector)!;

describe("profile page", () => {
  beforeEach(() => {
    stubApi();
  });

  it("shows the signed-in user's name, email and badge count", async () => {
    storeSession();
    renderApp("/profile");
    expect(
      await screen.findByText(PROFILE.displayName, { selector: ".profile-page__name" }),
    ).toBeTruthy();
    expect(screen.getByText(PROFILE.email)).toBeTruthy();
    expect(screen.getByText(`0 of ${ACHIEVEMENTS.length} badges unlocked`)).toBeTruthy();
  });

  it("shows statistics, locked and unlocked badges and the history", async () => {
    storeSession();
    recordActivity(PROFILE.email, "view", "tiny-glade");
    recordActivity(PROFILE.email, "view", "super-snake");
    renderApp("/profile");

    const stats = within(await screen.findByRole("region", { name: "Statistics" }));
    expect(stats.getByText("Games opened").previousElementSibling?.textContent).toBe("2");
    expect(screen.getByText("1 of 10 badges unlocked")).toBeTruthy();
    expect(badge("explorer").className).not.toContain("--locked");
    expect(within(badge("explorer")).getByText(/^Unlocked /)).toBeTruthy();
    expect(badge("fan").className).toContain("--locked");
    expect(within(badge("fan")).getByText("Locked")).toBeTruthy();

    const history = within(section("Recent activity")).getAllByRole("listitem");
    expect(history.map((item) => item.textContent)).toEqual([
      expect.stringContaining("Opened Super Snake"),
      expect.stringContaining("Opened Tiny Glade"),
    ]);
  });

  it("shows an empty history message and no clear button for a new user", async () => {
    storeSession();
    renderApp("/profile");
    const history = within(await screen.findByRole("region", { name: "Recent activity" }));
    expect(history.getByText(/Nothing here yet/)).toBeTruthy();
    expect(history.queryByRole("button")).toBeNull();
  });

  it("only shows the data of the signed-in user", async () => {
    storeSession();
    recordActivity("someone@else.io", "view", "tiny-glade");
    renderApp("/profile");
    await screen.findByText("Statistics");
    expect(screen.getByText("0 of 10 badges unlocked")).toBeTruthy();
  });

  it("opens from the header profile link", async () => {
    storeSession();
    const { router } = renderApp("/");
    await userEvent.click(screen.getByRole("link", { name: /open your profile/i }));
    expect(router.state.location.pathname).toBe("/profile");
    await waitFor(() => expect(document.title).toBe("Your Profile — MiniGames"));
    expect(await screen.findByRole("heading", { name: "Your profile" })).toBeTruthy();
  });

  it("returns to Home as a guest when the user logs out on the profile page", async () => {
    storeSession();
    const { router } = renderApp("/profile");
    await userEvent.click(await screen.findByRole("button", { name: "Log Out" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(document.querySelector(".profile-page__name")).toBeNull();
    expect(screen.getByText("You've been logged out.")).toBeTruthy();
  });

  it("updates live when activity is recorded elsewhere", async () => {
    storeSession();
    renderApp("/profile");
    await screen.findByText("0 of 10 badges unlocked");
    act(() => void recordActivity(PROFILE.email, "view", "tiny-glade"));
    expect(screen.getByText("1 of 10 badges unlocked")).toBeTruthy();
    expect(badge("explorer").className).not.toContain("--locked");
  });
});

describe("avatar customizer", () => {
  beforeEach(() => {
    stubApi();
    storeSession();
  });

  it("previews the choice and marks it pressed before saving", async () => {
    renderApp("/profile");
    await screen.findByText("Customize your avatar");
    expect(choice("[data-icon=sports_esports]").getAttribute("aria-pressed")).toBe("true");

    await userEvent.click(choice("[data-icon=rocket_launch]"));
    await userEvent.click(choice("[data-color='3']"));
    const preview = document.querySelector(".profile-page__avatar-preview .user-avatar")!;
    expect(preview.textContent).toBe("rocket_launch");
    expect(preview.className).toContain("user-avatar--color-4");
    expect(choice("[data-icon=rocket_launch]").getAttribute("aria-pressed")).toBe("true");
    expect(choice("[data-icon=sports_esports]").getAttribute("aria-pressed")).toBe("false");
    // Nothing is stored until Save.
    expect(loadProfile(PROFILE.email).avatar).toBeUndefined();
  });

  it("saves a custom avatar that replaces the initials, and can reset it", async () => {
    renderApp("/profile");
    await screen.findByText("Customize your avatar");
    expect(headerAvatar().textContent).toBe("AD");

    await userEvent.click(choice("[data-icon=pets]"));
    await userEvent.click(choice("[data-color='2']"));
    await userEvent.click(screen.getByRole("button", { name: "Save avatar" }));

    expect(loadProfile(PROFILE.email).avatar).toEqual({ icon: "pets", color: 2 });
    expect(headerAvatar().textContent).toBe("pets");
    expect(headerAvatar().className).toContain("user-avatar--color-3");
    expect(screen.getByText("Your avatar was saved.")).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Use default" }));
    expect(loadProfile(PROFILE.email).avatar).toBeUndefined();
    expect(headerAvatar().textContent).toBe("AD");
    expect(screen.getByText("Your avatar was reset.")).toBeTruthy();
    // The picker goes back to its starting point too.
    expect(choice("[data-icon=sports_esports]").getAttribute("aria-pressed")).toBe("true");
  });

  it("starts from the saved avatar", async () => {
    localStorage.setItem(
      "minigames:akylbek04-minigames:profile:alex@rs.school",
      JSON.stringify({ avatar: { icon: "diamond", color: 4 } }),
    );
    renderApp("/profile");
    await screen.findByText("Customize your avatar");
    expect(choice("[data-icon=diamond]").getAttribute("aria-pressed")).toBe("true");
    expect(choice("[data-color='4']").getAttribute("aria-pressed")).toBe("true");
  });
});

describe("profile settings", () => {
  beforeEach(() => {
    stubApi();
    storeSession();
  });

  it("clears the history but keeps the badges", async () => {
    recordActivity(PROFILE.email, "view", "tiny-glade");
    renderApp("/profile");
    await userEvent.click(await screen.findByRole("button", { name: "Clear history" }));

    expect(screen.getByText(/Nothing here yet/)).toBeTruthy();
    expect(loadProfile(PROFILE.email).unlocked).toHaveProperty("explorer");
    expect(badge("explorer").className).not.toContain("--locked");
  });

  it("resets all progress only on the second click", async () => {
    recordActivity(PROFILE.email, "view", "tiny-glade");
    renderApp("/profile");
    await userEvent.click(await screen.findByRole("button", { name: "Reset all progress" }));
    expect(loadProfile(PROFILE.email).counts.view).toBe(1);

    await userEvent.click(screen.getByRole("button", { name: "Click again to erase everything" }));
    expect(loadProfile(PROFILE.email).counts.view).toBe(0);
    expect(badge("explorer").className).toContain("--locked");
    expect(screen.getByRole("button", { name: "Reset all progress" })).toBeTruthy();
    expect(screen.getByText("Your progress was reset.")).toBeTruthy();
  });

  it("disarms the reset after 4 seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    recordActivity(PROFILE.email, "view", "tiny-glade");
    renderApp("/profile");
    await userEvent.click(await screen.findByRole("button", { name: "Reset all progress" }));
    expect(screen.getByRole("button", { name: "Click again to erase everything" })).toBeTruthy();

    await act(async () => void vi.advanceTimersByTime(4100));
    expect(screen.getByRole("button", { name: "Reset all progress" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Reset all progress" }));
    expect(loadProfile(PROFILE.email).counts.view).toBe(1);
    vi.useRealTimers();
  });
});
