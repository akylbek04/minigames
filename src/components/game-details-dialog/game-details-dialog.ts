import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { assetUrl } from "../../utils/asset-url";
import { closeDialogAnimated, openDialogAnimated } from "../../utils/animated-dialog";
import gameData from "../../assets/data/game-tukoni-forest-keepers.json";
import commentsData from "../../assets/data/comments-tukoni-forest-keepers.json";
import type { GameComment, GameDetails } from "../../types/game-details";
import { createGameInfo } from "./game-info";
import { createTopRecords } from "./top-records";
import { createComments } from "./comments";
import "./game-details-dialog.scss";

// Story 2 always shows the same static game, whichever card opened it.
const game: GameDetails = gameData.data;
const comments: GameComment[] = commentsData.data;

export interface GameDetailsDialogOptions {
  // The dialog never closes itself: it asks for the URL to drop the game,
  // and sync() closes it once the URL says so.
  onRequestClose: () => void;
}

export interface GameDetailsDialog {
  dialog: HTMLDialogElement;
  // Opens, switches or closes the dialog to match the `game` URL parameter.
  sync: (slug: string | undefined) => void;
}

export function createGameDetailsDialog({
  onRequestClose,
}: GameDetailsDialogOptions): GameDetailsDialog {
  const dialog = el("dialog", { class: "game-details", "aria-labelledby": "game-details-title" });
  const state: { slug?: string } = {};

  function createContent(): Node[] {
    const closeButton = el(
      "button",
      { type: "button", class: "game-details__close", "aria-label": "Close game details" },
      [materialIcon("close")],
    );
    closeButton.addEventListener("click", onRequestClose);

    const hero = el("div", { class: "game-details__hero" }, [
      el("img", { src: assetUrl(game.heroImage), alt: "", class: "game-details__hero-image" }),
      closeButton,
    ]);

    const body = el("div", { class: "game-details__body" }, [
      createGameInfo(game),
      createTopRecords(game.topRecords),
      createComments(comments),
    ]);

    return [hero, body];
  }

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      onRequestClose();
    }
  });

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    onRequestClose();
  });

  // Content is rebuilt on every open, which resets favorites, likes and the
  // comment draft (nothing is persisted yet).
  function sync(slug: string | undefined): void {
    if (slug === undefined) {
      state.slug = undefined;
      closeDialogAnimated(dialog);
      return;
    }
    if (slug === state.slug && dialog.open && !dialog.classList.contains("is-closing")) {
      return;
    }
    state.slug = slug;
    dialog.replaceChildren(...createContent());
    openDialogAnimated(dialog);
  }

  return { dialog, sync };
}
