import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GAME, requestsTo, stubApi, type FetchMock } from "../../test/api";
import { renderApp } from "../../test/render-app";
import { circularOffset } from "../../components/carousel/GameCarousel";

vi.mock("../../auth/firebase", () => ({ firebaseAuth: {} }));
vi.mock("firebase/auth", () => ({ signOut: vi.fn(() => Promise.resolve()) }));

const serverError = () => Response.json({ error: "boom" }, { status: 500 });
const roles = (): string[] =>
  [...document.querySelectorAll<HTMLElement>(".carousel__slot")].map(
    (slot) => slot.dataset.role ?? "",
  );

describe("home page", () => {
  let api: FetchMock;
  beforeEach(() => {
    api = stubApi();
  });

  it("loads featured games and top players", async () => {
    renderApp("/");
    expect(await screen.findByRole("button", { name: GAME.name })).toBeTruthy();
    const board = screen.getByRole("region", { name: "Top Players This Week" });
    expect(await within(board).findByText("CozyGamer_x")).toBeTruthy();
    expect(board.querySelector(".leaderboard__avatar")?.textContent).toBe("CG");
  });

  it("opens game details from a carousel card through the URL", async () => {
    const { router } = renderApp("/");
    await userEvent.click(await screen.findByRole("button", { name: GAME.name }));
    expect(router.state.location.search).toBe("?game=tiny-glade");
  });

  it("steps the carousel with its arrows", async () => {
    stubApi({
      "GET /games": () =>
        Response.json({ data: [GAME, { ...GAME, slug: "b" }, { ...GAME, slug: "c" }] }),
    });
    renderApp("/");
    await screen.findAllByRole("button", { name: GAME.name });
    expect(roles()).toEqual(["wide", "medium", "medium"]);

    await userEvent.click(screen.getByRole("button", { name: "Next games" }));
    expect(roles()).toEqual(["medium", "wide", "medium"]);
    await userEvent.click(screen.getByRole("button", { name: "Previous games" }));
    expect(roles()).toEqual(["wide", "medium", "medium"]);
  });

  it("advances by itself every 4 seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    stubApi({
      "GET /games": () => Response.json({ data: [GAME, { ...GAME, slug: "b" }] }),
    });
    renderApp("/");
    await screen.findAllByRole("button", { name: GAME.name });
    await act(async () => {}); // lets the autoplay timer start
    const before = roles();
    await act(async () => void vi.advanceTimersByTime(4100));
    expect(roles()).not.toEqual(before);
    vi.useRealTimers();
  });

  it("steps on a swipe and does not open details after it", async () => {
    stubApi({
      "GET /games": () =>
        Response.json({ data: [GAME, { ...GAME, slug: "b" }, { ...GAME, slug: "c" }] }),
    });
    const { router } = renderApp("/");
    const [first] = await screen.findAllByRole("button", { name: GAME.name });
    const track = document.querySelector(".carousel__track")!;

    fireEvent.pointerDown(track, { clientX: 200, isPrimary: true });
    fireEvent.pointerUp(document, { clientX: 100, isPrimary: true });
    expect(roles()).toEqual(["medium", "wide", "medium"]);

    // The browser's click after a swipe arrives without a new pointerdown.
    fireEvent.click(first);
    expect(router.state.location.search).toBe("");
  });

  it("disables the arrows while there is nothing to step through", async () => {
    stubApi({ "GET /games": () => Response.json({ data: [] }) });
    renderApp("/");
    expect(await screen.findByText("No featured games yet")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Next games" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("shows an error banner whose retry resends the request", async () => {
    let attempts = 0;
    api = stubApi({
      "GET /leaderboard": () => (++attempts === 1 ? serverError() : Response.json({ data: [] })),
    });
    renderApp("/");

    const board = screen.getByRole("region", { name: "Top Players This Week" });
    expect(await within(board).findByText(/The server didn't respond as expected/)).toBeTruthy();
    expect(screen.getByText("Couldn't load top players.")).toBeTruthy();

    await userEvent.click(within(board).getByRole("button", { name: /try again/i }));
    expect(await within(board).findByText("No players yet")).toBeTruthy();
    expect(requestsTo(api, "GET /leaderboard")).toHaveLength(2);
    expect(screen.getByText("top players loaded successfully.")).toBeTruthy();
  });

  it("explains a lost connection and a rate limit differently", async () => {
    stubApi({
      "GET /games": () => Promise.reject(new TypeError("Failed to fetch")),
      "GET /leaderboard": () => Response.json({ error: "Slow down" }, { status: 429 }),
    });
    renderApp("/");

    expect(await screen.findByText(/We couldn't reach the server/)).toBeTruthy();
    await waitFor(() =>
      expect(
        screen.getByText("Too many requests while loading top players. Slow down"),
      ).toBeTruthy(),
    );
  });

  it("goes to the library from the hero button", async () => {
    const { router } = renderApp("/");
    await userEvent.click(screen.getByRole("button", { name: "Browse Library" }));
    expect(router.state.location.pathname).toBe("/library");
  });
});

describe("circularOffset", () => {
  it("is the shortest signed distance around the loop", () => {
    expect(circularOffset(0, 0, 5)).toBe(0);
    expect(circularOffset(4, 0, 5)).toBe(-1);
    expect(circularOffset(1, 4, 5)).toBe(2);
    expect(circularOffset(2, 0, 4)).toBe(2);
  });
});
