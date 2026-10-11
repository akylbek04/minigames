import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { setBusy } from "../../utils/busy";
import { formatCompactNumber } from "../../utils/format";
import { toggleFavorite } from "../../api/minigames-api";
import { notifyMutationFailed } from "../feedback/request-feedback";
import { showSnackbar } from "../snackbar/snackbar";
import type { GameDetails } from "../../types/game-details";
import type { AppSession } from "../../auth/session";

export interface GameInfoOptions {
  requireSession: (reason: string) => AppSession | undefined;
}

// Shows only what the server said: the personalized details on open, then
// each toggle response. Locked while a toggle is in flight, never resent.
function createFavoriteButton(
  game: GameDetails,
  likesCount: HTMLElement,
  { requireSession }: GameInfoOptions,
): HTMLButtonElement {
  const label = el("span", { class: "game-details__favorite-label" });
  const button = el(
    "button",
    { type: "button", class: "btn btn--outline btn--large game-details__favorite" },
    [materialIcon("favorite", "game-details__favorite-icon"), label],
  );

  function render(isFavorited: boolean): void {
    button.setAttribute("aria-pressed", String(isFavorited));
    label.textContent = isFavorited ? "Remove from Favorites" : "Add to Favorites";
  }

  async function toggle(): Promise<void> {
    const session = requireSession("Log in to add games to your favorites.");
    if (!session) {
      return;
    }
    button.disabled = true;
    setBusy(button, true);
    try {
      const result = await toggleFavorite(game.slug, session.email);
      render(result.isFavorited);
      likesCount.textContent = formatCompactNumber(result.likesCount);
      showSnackbar(
        result.isFavorited ? "Added to your favorites." : "Removed from your favorites.",
        "success",
      );
    } catch (error) {
      notifyMutationFailed(error, {
        failed: "Couldn't update your favorites. Please try again.",
        unknown:
          "We couldn't confirm the favorites change. Reopen the game to check it before trying again.",
      });
    } finally {
      button.disabled = false;
      setBusy(button, false);
    }
  }

  render(game.isLikedByCurrentUser);
  button.addEventListener("click", () => void toggle());
  return button;
}

export function createGameInfo(game: GameDetails, options: GameInfoOptions): HTMLElement {
  const likesCount = el("span", {}, [formatCompactNumber(game.likesCount)]);
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
        likesCount,
      ]),
    ]),
  ]);

  // Free games get "Play Now", paid ones "Buy Now: <price>". Neither does
  // anything yet: playing and buying are outside this project's scope.
  const isFree = game.specs.price === "Free";
  const playButton = el("button", { type: "button", class: "btn btn--filled btn--large" }, [
    isFree ? "Play Now" : `Buy Now: ${game.specs.price}`,
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
    el("div", { class: "game-details__actions" }, [
      playButton,
      createFavoriteButton(game, likesCount, options),
    ]),
  ]);
}
