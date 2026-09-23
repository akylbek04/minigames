import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { formatCompactNumber } from "../../utils/format";
import { assetUrl } from "../../utils/asset-url";
import categoriesData from "../../assets/data/categories.json";
import type { Category, Game } from "../../types/game";
import "./game-card.scss";

const categoryLabels = new Map(
  (categoriesData.data as Category[]).map((category) => [category.slug, category.label]),
);

export function createGameCard(game: Game, onOpenDetails: () => void): HTMLElement {
  const isFree = game.price === "Free";

  const detailsButton = el(
    "button",
    { type: "button", class: "btn btn--filled game-card__details" },
    ["Details"],
  );
  detailsButton.addEventListener("click", onOpenDetails);

  const body = el("div", { class: "game-card__body" }, [
    el("h2", { class: "game-card__title" }, [game.name]),
    el("span", { class: "game-card__badge" }, [categoryLabels.get(game.category) ?? game.category]),
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
