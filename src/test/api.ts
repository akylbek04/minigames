import { vi, type Mock } from "vitest";
import type { Category, Game } from "../types/game";
import type { GameComment, GameDetails } from "../types/game-details";
import type { LeaderboardEntry } from "../types/leaderboard";

export const GAME: Game = {
  slug: "tiny-glade",
  name: "Tiny Glade",
  category: "puzzle",
  price: "Free",
  shortDescription: "Build castles.",
  rating: 4.8,
  likesCount: 31_200,
  cardImage: "/assets/images/games/tiny-glade-card.jpg",
};

export const CATEGORIES: Category[] = [
  { slug: "all", label: "All Games", isDefault: true },
  { slug: "puzzle", label: "Puzzle", isDefault: false },
];

export const LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    playerName: "CozyGamer_x",
    gamesPlayed: 12,
    totalScore: 356_700,
    streakDays: 5,
    favoriteGameSlug: "tiny-glade",
    favoriteGameName: "Tiny Glade",
  },
];

export const DETAILS: GameDetails = {
  slug: GAME.slug,
  name: GAME.name,
  heroImage: "/assets/images/games/tiny-glade-hero.jpg",
  rating: 4.8,
  likesCount: 31_200,
  isLikedByCurrentUser: false,
  fullDescription: "Build tiny castles.",
  specs: { genre: "Puzzle", players: "Solo", duration: "30 min", price: "Free" },
  topRecords: [
    { position: 1, playerName: "ForestSpirit", score: 356_700, achievedAt: "2026-10-01T00:00:00Z" },
  ],
};

export const COMMENT: GameComment = {
  commentId: "c-1",
  authorName: "ForestDweller",
  text: "Magical <b>art</b>",
  likesCount: 12,
  isLikedByCurrentUser: false,
  createdAt: "2026-10-01T00:00:00Z",
};

type Handler = (url: URL, init: RequestInit | undefined) => Response | Promise<Response>;

// Answers every endpoint the app calls with the fixtures above; tests
// override single routes ("GET /games/tiny-glade") to change one answer.
const DEFAULT_ROUTES: Record<string, Handler> = {
  "GET /games": (url) =>
    url.searchParams.get("featured")
      ? Response.json({ data: [GAME] })
      : Response.json({
          data: [GAME],
          meta: {
            page: Number(url.searchParams.get("page") ?? 1),
            limit: 6,
            totalItems: 1,
            totalPages: 1,
          },
        }),
  "GET /categories": () => Response.json({ data: CATEGORIES }),
  "GET /leaderboard": () => Response.json({ data: LEADERBOARD }),
  "GET /games/:slug": () => Response.json({ data: DETAILS }),
  "GET /games/:slug/comments": () => Response.json({ data: [COMMENT], meta: { totalComments: 7 } }),
  "POST /games/:slug/favorite": () =>
    Response.json({ data: { gameSlug: GAME.slug, isFavorited: true, likesCount: 31_201 } }),
  "POST /games/:slug/comments": (_, init) =>
    Response.json({ data: { ...COMMENT, ...JSON.parse(String(init?.body)) } }, { status: 201 }),
  "POST /comments/:id/like": () =>
    Response.json({ data: { isLikedByCurrentUser: true, likesCount: 13 } }),
};

function routeKey(method: string, url: URL): string {
  const path = url.pathname.replace(/^\/api/, "");
  const pattern = path
    .replace(/^\/games\/[^/]+/, "/games/:slug")
    .replace(/^\/comments\/[^/]+/, "/comments/:id");
  return `${method} ${pattern}`;
}

export type FetchMock = Mock<(input: string, init?: RequestInit) => Promise<Response>>;

export function stubApi(overrides: Record<string, Handler> = {}): FetchMock {
  const routes = { ...DEFAULT_ROUTES, ...overrides };
  const fetchMock: FetchMock = vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input);
    const handler = routes[routeKey(init?.method ?? "GET", url)];
    if (!handler) {
      throw new Error(`Unexpected request: ${init?.method ?? "GET"} ${url.pathname}`);
    }
    return handler(url, init);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// URLs of the requests made so far to one route, e.g. "GET /games/:slug".
export function requestsTo(fetchMock: FetchMock, key: string): URL[] {
  return fetchMock.mock.calls
    .filter(([input, init]) => routeKey(init?.method ?? "GET", new URL(input)) === key)
    .map(([input]) => new URL(input));
}
