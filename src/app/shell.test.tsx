import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderApp } from "../test/render-app";
import { stubApi } from "../test/api";
import { SESSION_KEY, storeSession } from "../test/app";

vi.mock("../auth/firebase", () => ({ firebaseAuth: {} }));
vi.mock("firebase/auth", () => ({ signOut: vi.fn(() => Promise.resolve()) }));

const link = (name: string, scope: HTMLElement = document.body) =>
  within(scope).getByRole("link", { name });

describe("app shell", () => {
  beforeEach(() => {
    localStorage.removeItem(SESSION_KEY);
    stubApi();
  });

  it("sets the title for each page and marks the active link", async () => {
    const { router } = renderApp("/library");
    expect(document.title).toBe("Game Library — MiniGames");
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(link("Library", nav).getAttribute("aria-current")).toBe("page");
    expect(link("Home", nav).getAttribute("aria-current")).toBeNull();
    expect(link("Tournaments", nav).getAttribute("aria-current")).toBeNull();

    await userEvent.click(link("Home", nav));
    expect(router.state.location.pathname).toBe("/");
    expect(document.title).toBe("MiniGames — Take a Short Break & Have Fun");
  });

  it("names unknown paths as not found and leads back home", async () => {
    const { router } = renderApp("/no/such/page");
    expect(document.title).toBe("Page Not Found — MiniGames");
    expect(document.querySelector(".status-page__path")?.textContent).toBe("/no/such/page");

    await userEvent.click(screen.getByRole("button", { name: "Return to Home Page" }));
    expect(router.state.location.pathname).toBe("/");
    expect(document.querySelector("main")?.className).toBe("home-page");
  });

  it("still renders a deep link with a malformed escape", () => {
    renderApp("/%E0%A4%A");
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeTruthy();
  });

  it("offers Log In and Sign Up to guests, opening Auth through the URL", async () => {
    const { router } = renderApp("/library");
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));
    expect(router.state.location.search).toBe("?auth=login");
    expect(router.state.location.pathname).toBe("/library");

    await userEvent.click(screen.getByRole("button", { name: "Sign Up" }));
    expect(router.state.location.search).toBe("?auth=register");
  });

  it("closes an in-app Auth by stepping Back", async () => {
    const { router } = renderApp("/");
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));
    expect(router.state.location.state).toEqual({ overlay: "auth" });
    await act(async () => router.navigate(-1));
    expect(router.state.location.search).toBe("");
  });

  it("sends guests away from the profile with a warning and Auth open", async () => {
    const { router } = renderApp("/profile");
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(router.state.location.search).toBe("?auth=login");
    expect(screen.getByText("Log in to see your profile.")).toBeTruthy();
  });

  it("shows a signed-in user's profile link and logs out back to Home from the profile", async () => {
    storeSession();
    const { router } = renderApp("/profile");
    expect(router.state.location.pathname).toBe("/profile");
    const profile = await screen.findByRole("link", { name: /open your profile/i });
    expect(profile.textContent).toContain("Alex Doe");
    expect(screen.queryByRole("button", { name: "Log In" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Log Out" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(screen.getByRole("button", { name: "Log In" })).toBeTruthy();
    expect(screen.getByText("You've been logged out.")).toBeTruthy();
  });

  it("opens the mobile menu from the burger and closes it again", async () => {
    renderApp("/");
    const burger = screen.getByRole("button", { name: "Open menu" });
    await userEvent.click(burger);
    const menu = document.querySelector<HTMLDialogElement>("#mobile-menu")!;
    expect(menu.open).toBe(true);
    expect(screen.getByRole("button", { name: "Close menu", expanded: true })).toBeTruthy();

    await userEvent.click(within(menu).getByRole("button", { name: "Close menu" }));
    expect(screen.getByRole("button", { name: "Open menu" }).getAttribute("aria-expanded")).toBe(
      "false",
    );
  });

  it("closes the mobile menu and opens Auth from its guest buttons", async () => {
    const { router } = renderApp("/");
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = document.querySelector<HTMLDialogElement>("#mobile-menu")!;
    await userEvent.click(within(menu).getByRole("button", { name: "Sign Up" }));
    expect(router.state.location.search).toBe("?auth=register");
    expect(screen.getByRole("button", { name: "Open menu" })).toBeTruthy();
  });

  it("renders the footer links and credits", () => {
    renderApp("/");
    const footer = screen.getByRole("contentinfo");
    expect(link("Library", footer).getAttribute("href")).toBe("/library");
    expect(within(footer).getByText("RS School")).toBeTruthy();
  });

  it("renders a name as text, never as markup", () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ displayName: "<b>x</b>", email: "a@x.io", authenticatedAt: Date.now() }),
    );
    renderApp("/");
    expect(document.querySelector(".header__username")?.textContent).toBe("<b>x</b>");
    expect(document.querySelector(".header__username b")).toBeNull();
  });
});
