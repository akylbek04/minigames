import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { formatCompactNumber } from "../../utils/format";
import { assetUrl } from "../../utils/asset-url";
import allGamesData from "../../assets/data/all-games-seed.json";
import type { Game } from "../../types/game";
import "./carousel.scss";

const featuredGames = (allGamesData.data as Game[]).filter((game) => game.featured);

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
  return el("button", { type: "button", class: "carousel__card", "aria-label": game.name }, [
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
  ]);
}

export interface CarouselCallbacks {
  onOpenDetails: () => void;
}

export function createCarousel({ onOpenDetails }: CarouselCallbacks): HTMLElement {
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

  const cards = featuredGames.map((game) => createCard(game));
  const track = el(
    "ul",
    { class: "carousel__track" },
    cards.map((card) => el("li", { class: "carousel__slot" }, [card])),
  );
  const slots = [...track.children] as HTMLElement[];

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
    if (event.target instanceof Element && event.target.closest(".carousel__card")) {
      onOpenDetails();
    }
  });

  render();
  startTimer();

  return el("section", { class: "carousel", "aria-label": "New Games" }, [
    el("div", { class: "carousel__inner" }, [header, track]),
  ]);
}
