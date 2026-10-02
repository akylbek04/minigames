import { el } from "../../utils/dom";
import { enableDragScroll } from "../../utils/drag-scroll";
import { fetchCategories } from "../../api/minigames-api";
import { createAsyncContent } from "../feedback/async-content";
import { createSkeleton, createSkeletonGroup } from "../feedback/skeleton";
import { createEmptyState } from "../feedback/empty-state";
import type { Category } from "../../types/game";
import "./filter-chips.scss";

const SKELETON_CHIP_COUNT = 7;

function createChipsSkeleton(): Node {
  return createSkeletonGroup("Loading categories…", [
    el(
      "div",
      { class: "filter-chips", "aria-hidden": "true" },
      Array.from({ length: SKELETON_CHIP_COUNT }, () =>
        createSkeleton("filter-chips__chip filter-chips__chip--skeleton"),
      ),
    ),
  ]);
}

export interface FilterChipsOptions {
  // A chip click only reports the choice; the URL then decides what is active.
  onSelect: (slug: string) => void;
}

export interface FilterChips {
  element: HTMLElement;
  // Resolves with the categories, or an empty list if they failed to load.
  load: () => Promise<Category[]>;
  setActive: (slug: string) => void;
  // Chip label for a category slug (falls back to the slug itself).
  labelFor: (slug: string) => string;
}

// Category chips rendered from GET /api/categories.
export function createFilterChips({ onSelect }: FilterChipsOptions): FilterChips {
  const state: { categories: Category[]; active?: string } = { categories: [] };
  const chips: HTMLButtonElement[] = [];

  function setActive(slug: string): void {
    state.active = slug;
    for (const chip of chips) {
      chip.setAttribute("aria-pressed", String(chip.dataset.slug === slug));
    }
  }

  function renderChips(categories: Category[]): Node {
    state.categories = categories;
    chips.splice(
      0,
      chips.length,
      ...categories.map((category) =>
        el("button", { type: "button", class: "filter-chips__chip", "data-slug": category.slug }, [
          category.label,
        ]),
      ),
    );

    const list = el(
      "ul",
      { class: "filter-chips" },
      chips.map((chip) => el("li", {}, [chip])),
    );
    enableDragScroll(list);
    list.addEventListener("click", (event) => {
      const chip = event.target instanceof Element && event.target.closest("button");
      if (chip instanceof HTMLButtonElement && chip.dataset.slug) {
        onSelect(chip.dataset.slug);
      }
    });

    setActive(state.active ?? categories.find((category) => category.isDefault)?.slug ?? "");
    return list;
  }

  const content = createAsyncContent<Category[]>({
    subject: "categories",
    className: "filter-chips__content",
    renderLoading: createChipsSkeleton,
    renderData: renderChips,
    isEmpty: (categories) => categories.length === 0,
    renderEmpty: () =>
      createEmptyState({
        title: "No categories",
        message: "All games are listed below.",
        icon: "category",
      }),
  });

  const element = el(
    "div",
    { class: "filter-chips__wrapper", role: "group", "aria-label": "Game categories" },
    [content.element],
  );

  return {
    element,
    load: async () => {
      await content.load(fetchCategories);
      return state.categories;
    },
    setActive,
    labelFor: (slug) => state.categories.find((category) => category.slug === slug)?.label ?? slug,
  };
}
