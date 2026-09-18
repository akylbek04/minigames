import { el } from "../../utils/dom";
import "./hero.scss";

export function createHero(): HTMLElement {
  const title = el("h1", { class: "hero__title" }, ["Take a Short Break & Have Fun"]);

  const shortText = el("p", { class: "hero__text hero__text--short" }, [
    "Discover hundreds of curated casual mini-games right in your browser.",
  ]);

  const longText = el("p", { class: "hero__text hero__text--long" }, [
    "Discover hundreds of curated casual mini-games. Play instantly in your browser — puzzle, match 3, farm, and board classics.",
  ]);

  const cta = el("button", { type: "button", class: "btn btn--filled btn--large hero__cta" }, [
    "Browse Library",
  ]);

  const card = el("div", { class: "hero__card" }, [title, shortText, longText, cta]);
  const inner = el("div", { class: "hero__inner" }, [card]);

  return el("section", { class: "hero", "aria-label": "Welcome" }, [inner]);
}
