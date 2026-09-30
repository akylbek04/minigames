import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { formatCompactNumber } from "../../utils/format";
import type { GameDetails } from "../../types/game-details";

function createFavoriteButton(): HTMLButtonElement {
  const label = el("span", { class: "game-details__favorite-label" }, ["Add to Favorites"]);
  const button = el(
    "button",
    { type: "button", class: "btn btn--outline btn--large game-details__favorite" },
    [materialIcon("favorite", "game-details__favorite-icon"), label],
  );
  button.setAttribute("aria-pressed", "false");

  button.addEventListener("click", () => {
    const isFavorite = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(isFavorite));
    label.textContent = isFavorite ? "Remove from Favorites" : "Add to Favorites";
  });

  return button;
}

export function createGameInfo(game: GameDetails): HTMLElement {
  const specs = [
    ["Genre", game.specs.genre],
    ["Players", game.specs.players],
    ["Duration", game.specs.duration],
    ["Price", game.specs.price],
  ];

  const heading = el("div", { class: "game-details__heading" }, [
    el("h2", { id: "game-details-title", class: "game-details__title" }, [game.name]),
    el("p", { class: "game-details__stats" }, [
      el("span", { class: "game-details__stat" }, [
        materialIcon("star", "game-details__stat-icon game-details__stat-icon--rating"),
        el("span", { class: "visually-hidden" }, ["Rating "]),
        String(game.rating),
      ]),
      el("span", { class: "game-details__stat" }, [
        materialIcon("favorite", "game-details__stat-icon game-details__stat-icon--likes"),
        el("span", { class: "visually-hidden" }, ["Likes "]),
        formatCompactNumber(game.likesCount),
      ]),
    ]),
  ]);

  // Story 2's static game is free, so only the Play Now variant exists yet;
  // it deliberately does nothing.
  const playButton = el("button", { type: "button", class: "btn btn--filled btn--large" }, [
    "Play Now",
  ]);

  return el("section", { class: "game-details__info", "aria-labelledby": "game-details-title" }, [
    heading,
    el("p", { class: "game-details__description" }, [game.fullDescription]),
    el(
      "dl",
      { class: "game-details__specs" },
      specs.map(([term, value]) =>
        el("div", { class: "game-details__spec" }, [
          el("dt", { class: "game-details__spec-term" }, [term]),
          el("dd", { class: "game-details__spec-value" }, [value]),
        ]),
      ),
    ),
    el("div", { class: "game-details__actions" }, [playButton, createFavoriteButton()]),
  ]);
}
