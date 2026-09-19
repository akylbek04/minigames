import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { formatCompactNumber } from "../../utils/format";
import { featuredGames } from "../../assets/data/featured-games";
import type { Game } from "../../types/game";
import "./carousel.scss";

function createCard(game: Game): HTMLElement {
  const image = el("img", {
    src: game.cardImage,
    alt: game.name,
    class: "carousel__card-image",
  });

  const info = el("div", { class: "carousel__card-info" }, [
    el("p", { class: "carousel__card-title" }, [game.name]),
    el("div", { class: "carousel__card-stats" }, [
      el("span", { class: "carousel__card-rating" }, [
        materialIcon("star", "carousel__card-icon icon--filled"),
        String(game.rating),
      ]),
      el("span", { class: "carousel__card-likes" }, [
        materialIcon("favorite", "carousel__card-icon icon--filled"),
        formatCompactNumber(game.likesCount),
      ]),
    ]),
  ]);

  return el("li", { class: "carousel__card" }, [image, info]);
}

export function createCarousel(): HTMLElement {
  const title = el("h2", { class: "carousel__title" }, ["New Games"]);

  const prevButton = el(
    "button",
    { type: "button", class: "carousel__arrow", "aria-label": "Previous games" },
    [materialIcon("chevron_left")],
  );
  const nextButton = el(
    "button",
    {
      type: "button",
      class: "carousel__arrow carousel__arrow--filled",
      "aria-label": "Next games",
    },
    [materialIcon("chevron_right")],
  );

  const header = el("div", { class: "carousel__header" }, [
    title,
    el("div", { class: "carousel__nav" }, [prevButton, nextButton]),
  ]);

  const track = el(
    "ul",
    { class: "carousel__track" },
    featuredGames.map((game) => createCard(game)),
  );

  return el("section", { class: "carousel", "aria-label": "New Games" }, [
    el("div", { class: "carousel__inner" }, [header, track]),
  ]);
}
