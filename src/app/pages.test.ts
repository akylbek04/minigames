import { beforeEach, describe, expect, it, vi } from "vitest";
import { DETAILS, GAME, requestsTo, stubApi, type FetchMock } from "../test/api";
import { isShown, mountApp, snackbarMessages } from "../test/app";
import { flush, query } from "../test/dom";

vi.mock("../auth/firebase", () => ({ firebaseAuth: {} }));
vi.mock("firebase/auth", () => ({ signOut: vi.fn(() => Promise.resolve()) }));

const serverError = (): Response => Response.json({ error: "Boom" }, { status: 500 });

function clickByText(selector: string, text: string): void {
  const match = [...document.querySelectorAll<HTMLElement>(selector)].find((node) =>
    node.textContent?.includes(text),
  );
  if (!match) {
    throw new Error(`No ${selector} with text ${text}`);
  }
  match.click();
}

describe("home page", () => {
  let api: FetchMock;

  beforeEach(() => {
    api = stubApi();
  });

  it("loads featured games and top players on first show", async () => {
    await mountApp("/");

    expect(query(document, ".carousel__card").getAttribute("aria-label")).toBe(GAME.name);
    expect(query(document, ".leaderboard__username").textContent).toBe("CozyGamer_x");
    expect(query(document, ".leaderboard__avatar").textContent).toBe("CG");
  });

  it("opens game details from a carousel card", async () => {
    await mountApp("/");
    query<HTMLButtonElement>(document, ".carousel__card").click();
    await flush();

    expect(location.search).toBe("?game=tiny-glade");
    expect(isShown(query(document, ".game-details"))).toBe(true);
    expect(query(document, "#game-details-title").textContent).toBe("Tiny Glade");
  });

  it("steps the carousel with its arrows", async () => {
    stubApi({
      "GET /games": () =>
        Response.json({ data: [GAME, { ...GAME, slug: "b" }, { ...GAME, slug: "c" }] }),
    });
    await mountApp("/");
    const roles = (): string[] =>
      [...document.querySelectorAll<HTMLElement>(".carousel__slot")].map(
        (slot) => slot.dataset.role ?? "",
      );

    expect(roles()).toEqual(["wide", "medium", "medium"]);
    query<HTMLButtonElement>(document, ".carousel__arrow--filled").click();
    expect(roles()).toEqual(["medium", "wide", "medium"]);
    query<HTMLButtonElement>(document, ".carousel__arrow:not(.carousel__arrow--filled)").click();
    expect(roles()).toEqual(["wide", "medium", "medium"]);
  });

  it("shows an error banner whose retry resends the request", async () => {
    let attempts = 0;
    api = stubApi({
      "GET /leaderboard": () => (++attempts === 1 ? serverError() : Response.json({ data: [] })),
    });
    await mountApp("/");

    expect(query(document, ".leaderboard .error-banner").textContent).toContain(
      "The server didn't respond as expected.",
    );
    expect(snackbarMessages()).toContain("Couldn't load top players.");

    query<HTMLButtonElement>(document, ".error-banner__retry").click();
    await flush();
    expect(requestsTo(api, "GET /leaderboard")).toHaveLength(2);
    expect(query(document, ".leaderboard .empty-state").textContent).toContain("No players yet");
    expect(snackbarMessages()).toContain("top players loaded successfully.");
  });

  it("explains a lost connection and a rate limit differently", async () => {
    stubApi({
      "GET /games": () => Promise.reject(new TypeError("Failed to fetch")),
      "GET /leaderboard": () => Response.json({ error: "Slow down" }, { status: 429 }),
    });
    await mountApp("/");

    expect(query(document, ".carousel .error-banner").textContent).toContain(
      "We couldn't reach the server.",
    );
    expect(query(document, ".leaderboard .error-banner").textContent).toContain("Slow down");
    expect(snackbarMessages()).toContain("Too many requests while loading top players. Slow down");
  });

  it("goes to the library from the hero button", async () => {
    await mountApp("/");
    query<HTMLButtonElement>(document, ".hero__cta").click();
    await flush();
    expect(document.querySelector("main")?.className).toBe("library-page");
  });
});

describe("library page", () => {
  let api: FetchMock;

  beforeEach(() => {
    api = stubApi();
  });

  it("requests the default category, sort and page and renders the cards", async () => {
    await mountApp("/library");

    const request = requestsTo(api, "GET /games").find((url) => !url.search.includes("featured"));
    expect(Object.fromEntries(request?.searchParams ?? [])).toEqual({
      category: "all",
      sort: "rating-desc",
      page: "1",
      limit: "6",
    });
    expect(query(document, ".game-card__title").textContent).toBe("Tiny Glade");
    expect(query(document, ".game-card__badge").textContent).toBe("Puzzle");
    expect(query(document, ".filter-chips__chip[aria-pressed=true]").textContent).toBe("All Games");
  });

  it("puts category, sort and page choices in the URL", async () => {
    await mountApp("/library");

    clickByText(".filter-chips__chip", "Puzzle");
    await flush();
    expect(location.search).toBe("?category=puzzle&sort=rating-desc&page=1");

    clickByText(".sort-menu__option", "Name A→Z");
    await flush();
    expect(location.search).toBe("?category=puzzle&sort=name-asc&page=1");
    expect(query(document, ".sort-menu__toggle").textContent).toBe("Sort by: Name A→Z");
  });

  it("pages through results from the API metadata", async () => {
    stubApi({
      "GET /games": (url) =>
        Response.json({
          data: [GAME],
          meta: {
            page: Number(url.searchParams.get("page")),
            limit: 6,
            totalItems: 30,
            totalPages: 5,
          },
        }),
    });
    await mountApp("/library?page=2");

    expect(query(document, ".pagination [aria-current=page]").textContent).toBe("2");
    query<HTMLButtonElement>(document, ".pagination__button[aria-label='Next page']").click();
    await flush();
    expect(new URLSearchParams(location.search).get("page")).toBe("3");
    clickByText(".pagination__pages .pagination__button", "4");
    await flush();
    expect(new URLSearchParams(location.search).get("page")).toBe("4");
  });

  it("shows Data Not Found for an empty page and resets the filters", async () => {
    stubApi({
      "GET /games": () =>
        Response.json({ data: [], meta: { page: 1, limit: 6, totalItems: 0, totalPages: 0 } }),
    });
    await mountApp("/library?category=nothing");

    expect(query(document, ".library-page .empty-state").textContent).toContain("Data Not Found");
    clickByText(".empty-state button", "Reset filters");
    await flush();
    expect(location.search).toBe("");
  });

  it("opens details from a card", async () => {
    await mountApp("/library");
    query<HTMLButtonElement>(document, ".game-card__details").click();
    await flush();
    expect(location.search).toContain("game=tiny-glade");
  });
});

describe("game details", () => {
  beforeEach(() => {
    stubApi();
  });

  it("shows Game Not Found for an unknown slug and closes from its button", async () => {
    stubApi({
      "GET /games/:slug": () => Response.json({ error: "Game not found" }, { status: 404 }),
      "GET /games/:slug/comments": () =>
        Response.json({ error: "Game not found" }, { status: 404 }),
    });
    await mountApp("/?game=nope");

    expect(query(document, ".game-details__not-found").textContent).toContain("“nope”");
    clickByText(".game-details__not-found button", "Back to games");
    await flush();
    expect(location.search).toBe("");
  });

  it("closes from the close button, backdrop and Esc", async () => {
    const router = await mountApp("/");
    const dialog = query<HTMLDialogElement>(document, ".game-details");

    router.openOverlay("game", "tiny-glade");
    await flush();
    query<HTMLButtonElement>(dialog, ".game-details__close").click();
    await flush();
    expect(location.search).toBe("");

    router.openOverlay("game", "tiny-glade");
    dialog.click();
    await flush();
    expect(location.search).toBe("");

    router.openOverlay("game", "tiny-glade");
    dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    await flush();
    expect(location.search).toBe("");
  });

  it("offers Buy Now with the price for paid games", async () => {
    stubApi({
      "GET /games/:slug": () =>
        Response.json({
          data: {
            ...DETAILS,
            specs: { genre: "Puzzle", players: "Solo", duration: "30 min", price: "$9.99" },
            topRecords: [],
          },
        }),
    });
    await mountApp("/?game=tiny-glade");
    expect(query(document, ".game-details__actions").textContent).toContain("Buy Now: $9.99");
  });
});

describe("not found page", () => {
  beforeEach(() => {
    stubApi();
  });

  it("names the unknown path and leads back home", async () => {
    await mountApp("/no/such/page");

    expect(query(document, ".not-found-page__path").textContent).toBe("/no/such/page");
    expect(document.title).toBe("Page Not Found — MiniGames");
    clickByText(".not-found-page button", "Return to Home Page");
    await flush();
    expect(document.querySelector("main")?.className).toBe("home-page");
  });
});
