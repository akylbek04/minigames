import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { formatCompactNumber } from "../../utils/format";
import { assetUrl } from "../../utils/asset-url";
import { fetchFeaturedGames } from "../../api/minigames-api";
import { createAsyncContent } from "../feedback/async-content";
import { createEmptyState } from "../feedback/empty-state";
import { createSkeleton, createSkeletonGroup } from "../feedback/skeleton";
import type { Game } from "../../types/game";
import "./carousel.scss";

const AUTOPLAY_DELAY = 4000;
const SWIPE_THRESHOLD = 40;
// A press held at least this long is a "pause and look", not a click.
const LONG_PRESS_DELAY = 500;

// A card's role comes from its circular distance to the active card; CSS
// sizes each role per breakpoint (edge cards only show on desktop) and
// animates the change, so cards grow toward the center and shrink away.
const ROLES = ["wide", "medium", "edge"] as const;

// Signed distance from `active` to `index` on a loop of `total` cards,
// in the range [-floor(total / 2), floor((total - 1) / 2)].
export function circularOffset(index: number, active: number, total: number): number {
  const forward = (((index - active) % total) + total) % total;
  return forward > total / 2 ? forward - total : forward;
}

function createCard(game: Game): HTMLButtonElement {
  return el(
    "button",
    { type: "button", class: "carousel__card", "aria-label": game.name, "data-slug": game.slug },
    [
      el("img", {
        src: assetUrl(game.cardImage),
        alt: "",
        class: "carousel__card-image",
      }),
      el("span", { class: "carousel__card-info", "aria-hidden": "true" }, [
        el("span", { class: "carousel__card-title" }, [game.name]),
        el("span", { class: "carousel__card-stats" }, [
          el("span", { class: "carousel__card-rating" }, [
            materialIcon("star", "carousel__card-icon"),
            String(game.rating),
          ]),
          el("span", { class: "carousel__card-likes" }, [
            materialIcon("favorite", "carousel__card-icon"),
            formatCompactNumber(game.likesCount),
          ]),
        ]),
      ]),
    ],
  );
}

// Placeholder slots in the same roles as a loaded carousel, so the skeleton
// has the real layout at every breakpoint.
function createCarouselSkeleton(): Node {
  const roles = ["edge", "medium", "wide", "medium", "edge"];
  return createSkeletonGroup("Loading featured games…", [
    el(
      "ul",
      { class: "carousel__track", "aria-hidden": "true" },
      roles.map((role) =>
        el("li", { class: "carousel__slot", "data-role": role }, [
          createSkeleton("carousel__card carousel__card--skeleton"),
        ]),
      ),
    ),
  ]);
}

export interface CarouselCallbacks {
  onOpenDetails: (slug: string) => void;
}

export interface Carousel {
  element: HTMLElement;
  load: () => void;
}

export function createCarousel({ onOpenDetails }: CarouselCallbacks): Carousel {
  const title = el("h2", { class: "carousel__title" }, ["New Games"]);

  const prevButton = el(
    "button",
    { type: "button", class: "carousel__arrow", "aria-label": "Previous games" },
    [materialIcon("arrow_back")],
  );
  const nextButton = el(
    "button",
    {
      type: "button",
      class: "carousel__arrow carousel__arrow--filled",
      "aria-label": "Next games",
    },
    [materialIcon("arrow_forward")],
  );

  const header = el("div", { class: "carousel__header" }, [
    title,
    el("div", { class: "carousel__nav" }, [prevButton, nextButton]),
  ]);

  const track = el("ul", { class: "carousel__track" });
  const slots: HTMLElement[] = [];

  let activeIndex = 0;

  function render(): void {
    for (const [index, slot] of slots.entries()) {
      const offset = circularOffset(index, activeIndex, slots.length);
      const distance = Math.abs(offset);
      const role = distance < ROLES.length ? ROLES[distance] : "hidden";
      slot.dataset.role = role;
      slot.style.order = String(offset);
    }
  }

  // Autoplay timer that can pause and later resume with whatever time was
  // left, as RSS-QS-2-3-1 requires for press-and-hold.
  let timerId: number | undefined;
  let deadline = 0;
  let remaining = AUTOPLAY_DELAY;

  function startTimer(delay = AUTOPLAY_DELAY): void {
    clearTimeout(timerId);
    remaining = delay;
    deadline = performance.now() + delay;
    timerId = setTimeout(() => {
      step(1);
      startTimer();
    }, delay);
  }

  function pauseTimer(): void {
    clearTimeout(timerId);
    remaining = Math.max(0, deadline - performance.now());
  }

  function step(direction: 1 | -1): void {
    if (slots.length === 0) {
      return;
    }
    activeIndex = (activeIndex + direction + slots.length) % slots.length;
    render();
  }

  function stepAndRestart(direction: 1 | -1): void {
    step(direction);
    startTimer();
  }

  prevButton.addEventListener("click", () => stepAndRestart(-1));
  nextButton.addEventListener("click", () => stepAndRestart(1));

  // Press-and-hold pauses autoplay. Releasing without a swipe resumes the
  // remaining countdown; a swipe steps and starts a fresh 4s countdown.
  let pointerStartX: number | undefined;
  let pointerStartTime = 0;
  let shouldSuppressClick = false;

  track.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary) {
      return;
    }
    pointerStartX = event.clientX;
    pointerStartTime = performance.now();
    shouldSuppressClick = false;
    pauseTimer();
  });

  document.addEventListener("pointerup", (event) => {
    if (pointerStartX === undefined || !event.isPrimary) {
      return;
    }
    const deltaX = event.clientX - pointerStartX;
    pointerStartX = undefined;

    if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      shouldSuppressClick = true;
      stepAndRestart(deltaX < 0 ? 1 : -1);
    } else {
      shouldSuppressClick = performance.now() - pointerStartTime >= LONG_PRESS_DELAY;
      startTimer(remaining);
    }
  });

  document.addEventListener("pointercancel", () => {
    if (pointerStartX === undefined) {
      return;
    }

    pointerStartX = undefined;
    startTimer(remaining);
  });

  // Browsers' native image drag would swallow a mouse swipe.
  track.addEventListener("dragstart", (event) => event.preventDefault());

  track.addEventListener("click", (event) => {
    if (shouldSuppressClick) {
      shouldSuppressClick = false;
      return;
    }
    const card = event.target instanceof Element && event.target.closest(".carousel__card");
    if (card instanceof HTMLElement && card.dataset.slug) {
      onOpenDetails(card.dataset.slug);
    }
  });

  function setGames(games: Game[]): HTMLElement {
    slots.splice(
      0,
      slots.length,
      ...games.map((game) => el("li", { class: "carousel__slot" }, [createCard(game)])),
    );
    track.replaceChildren(...slots);
    activeIndex = 0;
    render();
    startTimer();
    return track;
  }

  const stage = createAsyncContent<Game[]>({
    subject: "featured games",
    className: "carousel__stage",
    renderLoading: createCarouselSkeleton,
    renderData: setGames,
    isEmpty: (games) => games.length === 0,
    renderEmpty: () =>
      createEmptyState({
        title: "No featured games yet",
        message: "New games will show up here as soon as they are featured.",
        icon: "sports_esports",
      }),
    // The arrows and autoplay only make sense while there are slides.
    onStateChange: (state) => {
      const hasSlides = state === "ready";
      prevButton.disabled = !hasSlides;
      nextButton.disabled = !hasSlides;
      if (!hasSlides) {
        clearTimeout(timerId);
      }
    },
  });

  const element = el("section", { class: "carousel", "aria-label": "New Games" }, [
    el("div", { class: "carousel__inner" }, [header, stage.element]),
  ]);

  return { element, load: () => void stage.load(fetchFeaturedGames) };
}
