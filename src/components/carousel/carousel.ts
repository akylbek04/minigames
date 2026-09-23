import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { formatCompactNumber } from "../../utils/format";
import { assetUrl } from "../../utils/asset-url";
import allGamesData from "../../assets/data/all-games-seed.json";
import type { Game } from "../../types/game";
import "./carousel.scss";

const featuredGames = (allGamesData.data as Game[]).filter((game) => game.featured);

type CardRole = "edge" | "medium" | "wide";

// Fixed showcase order matching the mockup's five-card desktop row; tablet and
// mobile hide the two "edge" cards via CSS, leaving the middle three.
const CAROUSEL_CARDS: { slug: string; role: CardRole }[] = [
  { slug: "tailside-cozy-cafe-sim", role: "edge" },
  { slug: "islanders-new-shores", role: "medium" },
  { slug: "vacation-cafe-simulator", role: "wide" },
  { slug: "winter-burrow", role: "medium" },
  { slug: "shelve-the-potions", role: "edge" },
];

const gameBySlug = new Map(featuredGames.map((game) => [game.slug, game]));

function createCard(game: Game, role: CardRole): HTMLElement {
  const image = el("img", {
    src: assetUrl(game.cardImage),
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

  return el("li", { class: `carousel__card carousel__card--${role}` }, [image, info]);
}

export function createCarousel(): HTMLElement {
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

  const track = el(
    "ul",
    { class: "carousel__track" },
    CAROUSEL_CARDS.map(({ slug, role }) => createCard(gameBySlug.get(slug)!, role)),
  );

  return el("section", { class: "carousel", "aria-label": "New Games" }, [
    el("div", { class: "carousel__inner" }, [header, track]),
  ]);
}
