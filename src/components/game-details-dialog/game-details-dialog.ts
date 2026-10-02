import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { assetUrl } from "../../utils/asset-url";
import { closeDialogAnimated, openDialogAnimated } from "../../utils/animated-dialog";
import { fetchGameDetails } from "../../api/minigames-api";
import { createAsyncContent } from "../feedback/async-content";
import { createEmptyState } from "../feedback/empty-state";
import { createSkeleton, createSkeletonGroup } from "../feedback/skeleton";
import type { GameDetails } from "../../types/game-details";
import { createGameInfo } from "./game-info";
import { createTopRecords } from "./top-records";
import { createCommentsSection, type CommentsSection } from "./comments";
import "./game-details-dialog.scss";

function createDetailsSkeleton(): Node {
  const line = (modifier = ""): HTMLElement =>
    createSkeleton(`game-details__skeleton-line ${modifier}`.trim());

  return createSkeletonGroup("Loading game details…", [
    createSkeleton("game-details__hero-image game-details__hero-image--skeleton"),
    el("div", { class: "game-details__body", "aria-hidden": "true" }, [
      el("div", { class: "game-details__info" }, [
        line("game-details__skeleton-line--title"),
        line(),
        line(),
        line("game-details__skeleton-line--short"),
        line("game-details__skeleton-line--button"),
      ]),
      el("div", { class: "game-details__section" }, [line(), line(), line()]),
    ]),
  ]);
}

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
  // aria-label covers the loading and error states, before a title exists.
  const dialog = el("dialog", {
    class: "game-details",
    "aria-labelledby": "game-details-title",
    "aria-label": "Game details",
  });
  const state: { slug?: string; comments?: CommentsSection } = {};

  // Outside the loaded content, so it can close every state of the dialog.
  const closeButton = el(
    "button",
    { type: "button", class: "game-details__close", "aria-label": "Close game details" },
    [materialIcon("close")],
  );
  closeButton.addEventListener("click", onRequestClose);

  function renderGame(game: GameDetails): Node {
    const hero = el("div", { class: "game-details__hero" }, [
      el("img", { src: assetUrl(game.heroImage), alt: "", class: "game-details__hero-image" }),
    ]);
    const body = el("div", { class: "game-details__body" }, [
      createGameInfo(game),
      createTopRecords(game.topRecords),
      ...(state.comments ? [state.comments.element] : []),
    ]);
    return el("div", {}, [hero, body]);
  }

  // A slug the API doesn't know (e.g. a mistyped or outdated link).
  function renderGameNotFound(): Node {
    return el("div", { class: "game-details__not-found" }, [
      createEmptyState({
        title: "Game Not Found",
        message: `We couldn't find a game called “${state.slug ?? ""}”. It may have been removed, or the link is incorrect.`,
        icon: "videogame_asset_off",
        action: { label: "Back to games", onClick: onRequestClose },
      }),
    ]);
  }

  const content = createAsyncContent<GameDetails>({
    subject: "game details",
    className: "game-details__content",
    renderLoading: createDetailsSkeleton,
    renderData: renderGame,
    renderNotFound: renderGameNotFound,
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      onRequestClose();
    }
  });

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    onRequestClose();
  });

  // Every open starts fresh: details and the latest comments are requested
  // in parallel, and favorites, likes and the comment draft are reset.
  function open(slug: string): void {
    state.slug = slug;
    state.comments = createCommentsSection(slug);
    state.comments.load();
    dialog.replaceChildren(closeButton, content.element);
    void content.load((signal) => fetchGameDetails(slug, signal));
    openDialogAnimated(dialog);
    dialog.scrollTop = 0;
  }

  function sync(slug: string | undefined): void {
    if (slug === undefined) {
      state.slug = undefined;
      closeDialogAnimated(dialog);
      return;
    }
    if (slug === state.slug && dialog.open && !dialog.classList.contains("is-closing")) {
      return;
    }
    open(slug);
  }

  return { dialog, sync };
}
