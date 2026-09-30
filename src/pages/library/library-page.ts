import { el } from "../../utils/dom";
import { createFilterChips } from "../../components/filter-chips/filter-chips";
import { createSortMenu } from "../../components/sort-menu/sort-menu";
import { createGameCard } from "../../components/game-card/game-card";
import { createPagination } from "../../components/pagination/pagination";
import allGamesData from "../../assets/data/all-games-seed.json";
import type { Game } from "../../types/game";

// One page of the Library, as in the mockup; real paging comes with the API.
const PAGE_SIZE = 6;
const allGames = allGamesData.data as Game[];
const games = allGames.slice(0, PAGE_SIZE);
import "./library-page.scss";

export interface LibraryPageCallbacks {
  onOpenDetails: () => void;
}

export function createLibraryPage({ onOpenDetails }: LibraryPageCallbacks): HTMLElement {
  const intro = el("div", { class: "library-page__intro" }, [
    el("h1", { class: "library-page__title" }, ["Game Library"]),
    el("p", { class: "library-page__subtitle" }, ["Browse our collection of casual mini-games"]),
  ]);

  const controls = el("div", { class: "library-page__controls" }, [
    createFilterChips(),
    createSortMenu(),
  ]);

  const cards = el(
    "ul",
    { class: "library-page__games" },
    games.map((game) => el("li", {}, [createGameCard(game, onOpenDetails)])),
  );

  return el("main", { class: "library-page" }, [
    el("div", { class: "library-page__inner" }, [
      intro,
      controls,
      cards,
      createPagination(Math.ceil(allGames.length / PAGE_SIZE)),
    ]),
  ]);
}
