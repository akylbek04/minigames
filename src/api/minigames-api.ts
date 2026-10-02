import { getJson } from "./client";
import type { Category, Game, GamesPageMeta, GamesQuery } from "../types/game";
import type { GameComment, GameDetails } from "../types/game-details";
import type { LeaderboardEntry } from "../types/leaderboard";

interface DataResponse<T> {
  data: T;
}

interface GamesPageResponse {
  data: Game[];
  meta: GamesPageMeta;
}

export interface CommentsResponse {
  data: GameComment[];
  meta: { totalComments: number };
}

// The Library requests a fixed page of 6 cards (RSS-QS-3-2-1).
export const LIBRARY_PAGE_SIZE = 6;
const LATEST_COMMENTS_LIMIT = 3;

export async function fetchFeaturedGames(signal?: AbortSignal): Promise<Game[]> {
  const response = await getJson<DataResponse<Game[]>>("/games", { featured: "true" }, signal);
  return response.data;
}

// Filtering, sorting and paging all happen on the server: the query is
// passed through as-is and the response page is rendered unchanged.
export function fetchGamesPage(
  query: GamesQuery,
  signal?: AbortSignal,
): Promise<GamesPageResponse> {
  return getJson<GamesPageResponse>(
    "/games",
    { ...query, limit: String(LIBRARY_PAGE_SIZE) },
    signal,
  );
}

export async function fetchCategories(signal?: AbortSignal): Promise<Category[]> {
  const response = await getJson<DataResponse<Category[]>>("/categories", {}, signal);
  return response.data;
}

export async function fetchLeaderboard(signal?: AbortSignal): Promise<LeaderboardEntry[]> {
  const response = await getJson<DataResponse<LeaderboardEntry[]>>("/leaderboard", {}, signal);
  return response.data;
}

export async function fetchGameDetails(slug: string, signal?: AbortSignal): Promise<GameDetails> {
  const response = await getJson<DataResponse<GameDetails>>(
    `/games/${encodeURIComponent(slug)}`,
    {},
    signal,
  );
  return response.data;
}

export function fetchLatestComments(slug: string, signal?: AbortSignal): Promise<CommentsResponse> {
  return getJson<CommentsResponse>(
    `/games/${encodeURIComponent(slug)}/comments`,
    { limit: String(LATEST_COMMENTS_LIMIT), sort: "newest" },
    signal,
  );
}
