import { getJson, postJson } from "./client";
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

function gamePath(slug: string, rest = ""): string {
  return `/games/${encodeURIComponent(slug)}${rest}`;
}

// With `userEmail`, `isLikedByCurrentUser` is that user's favorite state;
// guests omit it and always get false.
export async function fetchGameDetails(
  slug: string,
  userEmail?: string,
  signal?: AbortSignal,
): Promise<GameDetails> {
  const response = await getJson<DataResponse<GameDetails>>(gamePath(slug), { userEmail }, signal);
  return response.data;
}

export function fetchLatestComments(
  slug: string,
  userEmail?: string,
  signal?: AbortSignal,
): Promise<CommentsResponse> {
  return getJson<CommentsResponse>(
    gamePath(slug, "/comments"),
    { limit: String(LATEST_COMMENTS_LIMIT), sort: "newest", userEmail },
    signal,
  );
}

export interface FavoriteState {
  isFavorited: boolean;
  likesCount: number;
}

// One endpoint flips the favorite either way; each success toggles it.
export async function toggleFavorite(slug: string, userEmail: string): Promise<FavoriteState> {
  const response = await postJson<DataResponse<FavoriteState>>(gamePath(slug, "/favorite"), {
    userEmail,
  });
  return response.data;
}

export interface NewComment {
  userEmail: string;
  // 2–30 characters; `text` 1–500 after trimming.
  authorName: string;
  text: string;
}

// Answers 201 with the created comment, but without the new total: the
// caller re-requests the latest comments for that.
export async function postComment(slug: string, comment: NewComment): Promise<GameComment> {
  const response = await postJson<DataResponse<GameComment>>(gamePath(slug, "/comments"), comment);
  return response.data;
}
