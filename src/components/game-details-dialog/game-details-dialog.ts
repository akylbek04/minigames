import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { assetUrl } from "../../utils/asset-url";
import { closeDialogAnimated, openDialogAnimated } from "../../utils/animated-dialog";
import gameData from "../../assets/data/game-tukoni-forest-keepers.json";
import type { GameDetails } from "../../types/game-details";
import "./game-details-dialog.scss";

// Story 2 always shows the same static game, whichever card opened it.
const game: GameDetails = gameData.data;

export interface GameDetailsDialog {
  dialog: HTMLDialogElement;
  open: () => void;
}

export function createGameDetailsDialog(): GameDetailsDialog {
  const dialog = el("dialog", { class: "game-details", "aria-labelledby": "game-details-title" });

  function close(): void {
    closeDialogAnimated(dialog);
  }

  function createContent(): Node[] {
    const closeButton = el(
      "button",
      { type: "button", class: "game-details__close", "aria-label": "Close game details" },
      [materialIcon("close")],
    );
    closeButton.addEventListener("click", close);

    const hero = el("div", { class: "game-details__hero" }, [
      el("img", { src: assetUrl(game.heroImage), alt: "", class: "game-details__hero-image" }),
      closeButton,
    ]);

    const body = el("div", { class: "game-details__body" }, [
      el("h2", { id: "game-details-title", class: "game-details__title" }, [game.name]),
    ]);

    return [hero, body];
  }

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      close();
    }
  });

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });

  // Content is rebuilt on every open, which resets favorites, likes and the
  // comment draft as Story 2 requires (nothing is persisted yet).
  function open(): void {
    dialog.replaceChildren(...createContent());
    openDialogAnimated(dialog);
  }

  return { dialog, open };
}
