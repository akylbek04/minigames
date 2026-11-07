import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { visiblePageStart } from "../../components/pagination/PaginationNav";
import { GAME, requestsTo, stubApi, type FetchMock } from "../../test/api";
import { renderApp } from "../../test/render-app";

vi.mock("../../auth/firebase", () => ({ firebaseAuth: {} }));
vi.mock("firebase/auth", () => ({ signOut: vi.fn(() => Promise.resolve()) }));

const paged = (totalPages: number) => (url: URL) =>
  Response.json({
    data: [GAME],
    meta: { page: Number(url.searchParams.get("page")), limit: 6, totalItems: 30, totalPages },
  });

describe("library page", () => {
  let api: FetchMock;
  beforeEach(() => {
    api = stubApi();
  });

  it("requests the default category, sort and page and renders the cards", async () => {
    renderApp("/library");
    expect(await screen.findByRole("heading", { name: "Tiny Glade" })).toBeTruthy();

    const request = requestsTo(api, "GET /games").find((url) => !url.search.includes("featured"));
    expect(Object.fromEntries(request?.searchParams ?? [])).toEqual({
      category: "all",
      sort: "rating-desc",
      page: "1",
      limit: "6",
    });
    expect(screen.getByText("Puzzle", { selector: ".game-card__badge" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "All Games", pressed: true })).toBeTruthy();
  });

  it("puts category, sort and page choices in the URL and shows them", async () => {
    const { router } = renderApp("/library");
    await userEvent.click(await screen.findByRole("button", { name: "Puzzle" }));
    expect(router.state.location.search).toBe("?category=puzzle&sort=rating-desc&page=1");

    await userEvent.click(screen.getByRole("menuitemradio", { name: "Name A→Z", hidden: true }));
    expect(router.state.location.search).toBe("?category=puzzle&sort=name-asc&page=1");
    expect(screen.getByRole("button", { name: /Sort by/ }).textContent).toBe("Sort by: Name A→Z");
    await waitFor(() => expect(requestsTo(api, "GET /games").length).toBeGreaterThan(2));
  });

  it("does not refetch when only a dialog parameter changes", async () => {
    const { router } = renderApp("/library");
    await screen.findByRole("heading", { name: "Tiny Glade" });
    const before = requestsTo(api, "GET /games").length;

    await userEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(router.state.location.search).toContain("game=tiny-glade");
    expect(requestsTo(api, "GET /games")).toHaveLength(before);
  });

  it("pages through results from the API metadata", async () => {
    stubApi({ "GET /games": paged(5) });
    const { router } = renderApp("/library?page=2");

    const pages = await screen.findByRole("navigation", { name: "Library pages" });
    expect(within(pages).getByRole("button", { name: "Page 2" }).getAttribute("aria-current")).toBe(
      "page",
    );
    await userEvent.click(within(pages).getByRole("button", { name: "Next page" }));
    expect(new URLSearchParams(router.state.location.search).get("page")).toBe("3");
    await userEvent.click(await screen.findByRole("button", { name: "Page 4" }));
    expect(new URLSearchParams(router.state.location.search).get("page")).toBe("4");
  });

  it("shows Data Not Found for an empty page and resets the filters", async () => {
    stubApi({
      "GET /games": () =>
        Response.json({ data: [], meta: { page: 1, limit: 6, totalItems: 0, totalPages: 0 } }),
    });
    const { router } = renderApp("/library?category=nothing");

    expect(await screen.findByText("Data Not Found")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next page" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Reset filters" }));
    expect(router.state.location.search).toBe("");
  });

  it("treats a query the API rejects like an empty page", async () => {
    stubApi({ "GET /games": () => Response.json({ error: "Bad" }, { status: 400 }) });
    renderApp("/library?sort=nonsense");
    expect(await screen.findByText("Data Not Found")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Sort by/ }).textContent).toBe("Sort by: —");
  });

  it("shows an error banner for the games and retries it", async () => {
    let attempts = 0;
    stubApi({
      "GET /games": () =>
        ++attempts === 1
          ? Response.json({ error: "x" }, { status: 500 })
          : paged(1)(new URL("http://x/?page=1")),
    });
    renderApp("/library");
    expect(await screen.findByText(/The server didn't respond as expected/)).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Library pages" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("heading", { name: "Tiny Glade" })).toBeTruthy();
  });

  it("still loads games when the categories fail", async () => {
    stubApi({ "GET /categories": () => Response.json({ error: "x" }, { status: 500 }) });
    renderApp("/library");
    expect(await screen.findByRole("heading", { name: "Tiny Glade" })).toBeTruthy();
    expect(screen.getByText("Couldn't load categories.")).toBeTruthy();
  });
});

describe("visiblePageStart", () => {
  it("keeps the active page centered as far as the ends allow", () => {
    expect(visiblePageStart(1, 10, 4)).toBe(1);
    expect(visiblePageStart(5, 10, 4)).toBe(4);
    expect(visiblePageStart(10, 10, 4)).toBe(7);
  });
});
