import { el } from "../../utils/dom";
import { createFilterChips } from "../../components/filter-chips/filter-chips";
import { DEFAULT_SORT, createSortMenu } from "../../components/sort-menu/sort-menu";
import { createGameCard, createGameCardsSkeleton } from "../../components/game-card/game-card";
import { createPagination } from "../../components/pagination/pagination";
import { createAsyncContent } from "../../components/feedback/async-content";
import { createEmptyState } from "../../components/feedback/empty-state";
import { LIBRARY_PAGE_SIZE, fetchGamesPage } from "../../api/minigames-api";
import { navigateTo, updateQuery } from "../../router/router";
import type { Game, GamesPageMeta, GamesQuery } from "../../types/game";
import type { AppPage } from "../app-page";
import "./library-page.scss";

const DEFAULT_PAGE = "1";
// Used only if the categories request fails and the API's default is unknown.
const FALLBACK_CATEGORY = "all";
const GAMES_LIST_CLASS = "library-page__games";

export interface LibraryPageCallbacks {
  onOpenDetails: (slug: string) => void;
}

function isSameQuery(a: GamesQuery | undefined, b: GamesQuery): boolean {
  return a?.category === b.category && a.sort === b.sort && a.page === b.page;
}

// The URL is the single source of truth for the Library: user actions only
// write the query, and show() turns the query into one API request whose
// response is rendered as-is. Nothing is filtered, sorted or sliced here.
export function createLibraryPage({ onOpenDetails }: LibraryPageCallbacks): AppPage {
  const state: {
    query?: GamesQuery;
    defaultCategory: string;
    categoriesLoad?: Promise<void>;
  } = { defaultCategory: FALLBACK_CATEGORY };

  // Category and sort changes start again from page 1 (RSS-QS-3-2-4).
  function selectQuery(changes: Partial<GamesQuery>): void {
    const current = state.query ?? {
      category: state.defaultCategory,
      sort: DEFAULT_SORT,
      page: DEFAULT_PAGE,
    };
    updateQuery({ ...current, page: DEFAULT_PAGE, ...changes });
  }

  const chips = createFilterChips({ onSelect: (category) => selectQuery({ category }) });
  const sortMenu = createSortMenu({ onSelect: (sort) => selectQuery({ sort }) });
  const pagination = createPagination({
    onSelect: (page) => selectQuery({ ...state.query, page: String(page) }),
  });

  function renderGames(games: Game[]): HTMLElement {
    return el(
      "ul",
      { class: GAMES_LIST_CLASS },
      games.map((game) =>
        el("li", {}, [
          createGameCard(game, { categoryLabel: chips.labelFor(game.category), onOpenDetails }),
        ]),
      ),
    );
  }

  // Shown both for an empty page and for query values the API rejects.
  function renderDataNotFound(): HTMLElement {
    pagination.update(1, 1);
    return createEmptyState({
      title: "Data Not Found",
      message: "No games match these filters. Try another category or page.",
      action: { label: "Reset filters", onClick: () => navigateTo("/library") },
    });
  }

  const games = createAsyncContent<{ data: Game[]; meta: GamesPageMeta }>({
    subject: "games",
    className: "library-page__results",
    renderLoading: () => createGameCardsSkeleton(LIBRARY_PAGE_SIZE, GAMES_LIST_CLASS),
    renderData: ({ data, meta }) => {
      pagination.update(meta.page, meta.totalPages);
      return renderGames(data);
    },
    isEmpty: ({ data }) => data.length === 0,
    renderEmpty: renderDataNotFound,
    renderNotFound: renderDataNotFound,
    // Pagination belongs to a result: hidden while loading or on failure.
    onStateChange: (contentState) => {
      pagination.element.hidden = contentState === "loading" || contentState === "error";
    },
  });

  // The default chip comes from the API (`isDefault`), so the first games
  // request waits for the categories.
  async function fetchCategoriesOnce(): Promise<void> {
    const categories = await chips.load();
    state.defaultCategory =
      categories.find((category) => category.isDefault)?.slug ?? FALLBACK_CATEGORY;
  }

  function loadCategories(): Promise<void> {
    state.categoriesLoad ??= fetchCategoriesOnce();
    return state.categoriesLoad;
  }

  async function show(params: URLSearchParams): Promise<void> {
    await loadCategories();
    const query: GamesQuery = {
      category: params.get("category") ?? state.defaultCategory,
      sort: params.get("sort") ?? DEFAULT_SORT,
      page: params.get("page") ?? DEFAULT_PAGE,
    };
    chips.setActive(query.category);
    sortMenu.setValue(query.sort);

    // Opening a game dialog also changes the URL; the list stays as it is.
    if (isSameQuery(state.query, query)) {
      return;
    }
    state.query = query;
    await games.load((signal) => fetchGamesPage(query, signal));
  }

  const intro = el("div", { class: "library-page__intro" }, [
    el("h1", { class: "library-page__title" }, ["Game Library"]),
    el("p", { class: "library-page__subtitle" }, ["Browse our collection of casual mini-games"]),
  ]);

  const controls = el("div", { class: "library-page__controls" }, [
    chips.element,
    sortMenu.element,
  ]);

  const element = el("main", { class: "library-page" }, [
    el("div", { class: "library-page__inner" }, [
      intro,
      controls,
      games.element,
      pagination.element,
    ]),
  ]);

  return { element, show: (params) => void show(params) };
}
