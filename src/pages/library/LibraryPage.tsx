import { useNavigate, useSearchParams } from "react-router";
import { LIBRARY_PAGE_SIZE, fetchCategories, fetchGamesPage } from "../../api/minigames-api";
import { AsyncView } from "../../components/feedback/AsyncContent";
import { EmptyState } from "../../components/feedback/EmptyState";
import { FilterChips } from "../../components/filter-chips/FilterChips";
import { GameCard, GameCardsSkeleton } from "../../components/game-card/GameCard";
import { PaginationNav } from "../../components/pagination/PaginationNav";
import { DEFAULT_SORT, SortMenu } from "../../components/sort-menu/SortMenu";
import { useAsyncResult } from "../../hooks/use-async-result";
import { useOverlay } from "../../hooks/use-overlay";
import type { Category, GamesPageMeta, GamesQuery, Game } from "../../types/game";
import "./library-page.scss";

const DEFAULT_PAGE = "1";
// Used only if the categories request fails and the API's default is unknown.
const FALLBACK_CATEGORY = "all";
const GAMES_LIST_CLASS = "library-page__games";

// The URL is the single source of truth for the Library: user actions only
// write the query, and the query becomes one API request whose response is
// rendered as-is. Nothing is filtered, sorted or sliced here.
export function LibraryPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const game = useOverlay("game");

  // The default chip comes from the API (`isDefault`), so the first games
  // request waits for the categories (or their failure).
  const categories = useAsyncResult<Category[]>({
    subject: "categories",
    requestKey: "categories",
    request: fetchCategories,
  });
  const loaded = categories.status === "ready" ? categories.data : [];
  const defaultCategory = loaded.find((category) => category.isDefault)?.slug ?? FALLBACK_CATEGORY;
  const haveCategoriesSettled = categories.status === "ready" || categories.status === "error";

  const query: GamesQuery = {
    category: params.get("category") ?? defaultCategory,
    sort: params.get("sort") ?? DEFAULT_SORT,
    page: params.get("page") ?? DEFAULT_PAGE,
  };
  // Opening a game dialog also changes the URL; the list stays as it is.
  const games = useAsyncResult<{ data: Game[]; meta: GamesPageMeta }>({
    subject: "games",
    requestKey: `${query.category}|${query.sort}|${query.page}`,
    request: haveCategoriesSettled ? (signal) => fetchGamesPage(query, signal) : undefined,
    canShowNotFound: true,
  });

  // Category and sort changes start again from page 1 (RSS-QS-3-2-4).
  function selectQuery(changes: Partial<GamesQuery>): void {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      const merged = { ...query, page: DEFAULT_PAGE, ...changes };
      for (const [key, value] of Object.entries(merged)) {
        next.set(key, value);
      }
      return next;
    });
  }

  const labelFor = (slug: string): string =>
    loaded.find((category) => category.slug === slug)?.label ?? slug;

  // Shown both for an empty page and for query values the API rejects.
  const renderDataNotFound = () => (
    <EmptyState
      title="Data Not Found"
      message="No games match these filters. Try another category or page."
      action={{ label: "Reset filters", onClick: () => void navigate("/library") }}
    />
  );

  // Pagination belongs to a result: hidden while loading or on failure.
  let pagination: { page: number; totalPages: number } | undefined;
  if (games.status === "not-found" || (games.status === "ready" && games.data.data.length === 0)) {
    pagination = { page: 1, totalPages: 1 };
  } else if (games.status === "ready") {
    pagination = { page: games.data.meta.page, totalPages: games.data.meta.totalPages };
  }

  return (
    <main className="library-page">
      <title>Game Library — MiniGames</title>
      <div className="library-page__inner">
        <div className="library-page__intro">
          <h1 className="library-page__title">Game Library</h1>
          <p className="library-page__subtitle">Browse our collection of casual mini-games</p>
        </div>
        <div className="library-page__controls">
          <FilterChips
            result={categories}
            active={query.category}
            onSelect={(category) => selectQuery({ category })}
          />
          <SortMenu value={query.sort} onSelect={(sort) => selectQuery({ sort })} />
        </div>
        <AsyncView
          result={games}
          className="library-page__results"
          renderLoading={() => (
            <GameCardsSkeleton count={LIBRARY_PAGE_SIZE} listClass={GAMES_LIST_CLASS} />
          )}
          renderData={({ data }) => (
            <ul className={GAMES_LIST_CLASS}>
              {data.map((item) => (
                <li key={item.slug}>
                  <GameCard
                    game={item}
                    categoryLabel={labelFor(item.category)}
                    onOpenDetails={game.open}
                  />
                </li>
              ))}
            </ul>
          )}
          isEmpty={({ data }) => data.length === 0}
          renderEmpty={renderDataNotFound}
          renderNotFound={renderDataNotFound}
        />
        {pagination && (
          <PaginationNav
            page={pagination.page}
            totalPages={pagination.totalPages}
            onSelect={(page) => selectQuery({ page: String(page) })}
          />
        )}
      </div>
    </main>
  );
}
