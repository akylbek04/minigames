import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { formatCompactNumber } from "../../utils/format";
import { assetUrl } from "../../utils/asset-url";
import { createSkeleton, createSkeletonGroup } from "../feedback/skeleton";
import type { Game } from "../../types/game";
import "./game-card.scss";

export interface GameCardOptions {
  // Badge text; the API only gives the category slug.
  categoryLabel: string;
  onOpenDetails: (slug: string) => void;
}

export function createGameCard(
  game: Game,
  { categoryLabel, onOpenDetails }: GameCardOptions,
): HTMLElement {
  const isFree = game.price === "Free";

  const detailsButton = el(
    "button",
    { type: "button", class: "btn btn--filled game-card__details" },
    ["Details"],
  );
  detailsButton.addEventListener("click", () => onOpenDetails(game.slug));

  const body = el("div", { class: "game-card__body" }, [
    el("h2", { class: "game-card__title" }, [game.name]),
    el("span", { class: "game-card__badge" }, [categoryLabel]),
    el("p", { class: `game-card__price${isFree ? " game-card__price--free" : ""}` }, [game.price]),
    el("p", { class: "game-card__description" }, [game.shortDescription]),
    el("p", { class: "game-card__stats" }, [
      el("span", { class: "game-card__stat" }, [
        materialIcon("star", "game-card__stat-icon game-card__stat-icon--rating"),
        el("span", { class: "visually-hidden" }, ["Rating "]),
        String(game.rating),
      ]),
      el("span", { class: "game-card__stat" }, [
        materialIcon("favorite", "game-card__stat-icon game-card__stat-icon--likes"),
        el("span", { class: "visually-hidden" }, ["Likes "]),
        formatCompactNumber(game.likesCount),
      ]),
    ]),
    detailsButton,
  ]);

  return el("article", { class: "game-card" }, [
    el("img", { src: assetUrl(game.cardImage), alt: "", class: "game-card__image" }),
    body,
  ]);
}

// A card-shaped placeholder: image block plus title, badge and text lines.
function createGameCardSkeleton(): HTMLElement {
  return el("article", { class: "game-card", "aria-hidden": "true" }, [
    createSkeleton("game-card__image game-card__image--skeleton"),
    el("div", { class: "game-card__skeleton-body" }, [
      createSkeleton("game-card__skeleton-line game-card__skeleton-line--title"),
      createSkeleton("game-card__skeleton-line game-card__skeleton-line--badge"),
      createSkeleton("game-card__skeleton-line"),
      createSkeleton("game-card__skeleton-line"),
      createSkeleton("game-card__skeleton-line game-card__skeleton-line--short"),
    ]),
  ]);
}

export function createGameCardsSkeleton(count: number, listClass: string): Node {
  return createSkeletonGroup("Loading games…", [
    el(
      "ul",
      { class: listClass },
      Array.from({ length: count }, () => el("li", {}, [createGameCardSkeleton()])),
    ),
  ]);
}
