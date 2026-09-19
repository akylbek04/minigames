import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import illustration from "../../assets/images/game-dev-illustration.png";
import "./game-dev-section.scss";

export function createGameDevSection(): HTMLElement {
  const image = el("img", {
    src: illustration,
    alt: "Illustration of a game developer's desk setup",
    class: "game-dev__illustration",
  });

  const submitButton = el(
    "button",
    { type: "button", class: "btn btn--filled btn--large game-dev__cta" },
    [materialIcon("upload"), "Submit Form"],
  );

  const card = el("div", { class: "game-dev__card" }, [
    el("h2", { class: "game-dev__title" }, ["Are You a Game Developer?"]),
    el("p", { class: "game-dev__text" }, [
      "Want to see your game on MiniGames? We're always looking for fun, engaging mini games to add to our platform. Submit your game and reach thousands of players!",
    ]),
    submitButton,
    el("p", { class: "game-dev__contact" }, [
      "or contact us at ",
      el("a", { href: "mailto:developers@minigames.com" }, ["developers@minigames.com"]),
    ]),
  ]);

  return el("section", { class: "game-dev", "aria-label": "Are you a game developer?" }, [
    el("div", { class: "game-dev__inner" }, [image, card]),
  ]);
}
