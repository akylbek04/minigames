import { useState } from "react";
import { toggleFavorite } from "../../api/minigames-api";
import { showSnackbar } from "../../hooks/snackbar-store";
import { useRequireSession } from "../../hooks/use-require-session";
import { trackActivity } from "../../profile/track";
import type { GameDetails } from "../../types/game-details";
import { formatCompactNumber } from "../../utils/format";
import { BusyButton } from "../busy/BusyButton";
import { notifyMutationFailed } from "../feedback/request-notices";
import { MaterialIcon } from "../icons/MaterialIcon";

interface Favorite {
  game: GameDetails;
  isFavorited: boolean;
  likesCount: number;
}

// Shows only what the server said: the personalized details on open, then
// each toggle response. Locked while a toggle is in flight, never resent.
export function GameInfo({ game }: { game: GameDetails }) {
  const requireSession = useRequireSession();
  const [answer, setAnswer] = useState<Favorite>();
  const [isPending, setPending] = useState(false);
  // A toggle answer belongs to the details it was made for; reloaded
  // details (a new session) start from what the server says again.
  const { isFavorited, likesCount } =
    answer?.game === game
      ? answer
      : { isFavorited: game.isLikedByCurrentUser, likesCount: game.likesCount };

  async function toggle(): Promise<void> {
    const session = requireSession("Log in to add games to your favorites.");
    if (!session) {
      return;
    }
    setPending(true);
    try {
      const result = await toggleFavorite(game.slug, session.email);
      setAnswer({ game, isFavorited: result.isFavorited, likesCount: result.likesCount });
      showSnackbar(
        result.isFavorited ? "Added to your favorites." : "Removed from your favorites.",
        "success",
      );
      if (result.isFavorited) {
        trackActivity(session, "favorite", game.slug);
      }
    } catch (error) {
      notifyMutationFailed(error, {
        failed: "Couldn't update your favorites. Please try again.",
        unknown:
          "We couldn't confirm the favorites change. Reopen the game to check it before trying again.",
      });
    } finally {
      setPending(false);
    }
  }

  const specs = [
    ["Genre", game.specs.genre],
    ["Players", game.specs.players],
    ["Duration", game.specs.duration],
    ["Price", game.specs.price],
  ];
  // Free games get "Play Now", paid ones "Buy Now: <price>". Neither does
  // anything yet: playing and buying are outside this project's scope.
  const isFree = game.specs.price === "Free";

  return (
    <section className="game-details__info" aria-labelledby="game-details-title">
      <div className="game-details__heading">
        <h2 id="game-details-title" className="game-details__title">
          {game.name}
        </h2>
        <p className="game-details__stats">
          <span className="game-details__stat">
            <MaterialIcon
              name="star"
              className="game-details__stat-icon game-details__stat-icon--rating"
            />
            <span className="visually-hidden">Rating </span>
            {game.rating}
          </span>
          <span className="game-details__stat">
            <MaterialIcon
              name="favorite"
              className="game-details__stat-icon game-details__stat-icon--likes"
            />
            <span className="visually-hidden">Likes </span>
            <span>{formatCompactNumber(likesCount)}</span>
          </span>
        </p>
      </div>
      <p className="game-details__description">{game.fullDescription}</p>
      <dl className="game-details__specs">
        {specs.map(([term, value]) => (
          <div key={term} className="game-details__spec">
            <dt className="game-details__spec-term">{term}</dt>
            <dd className="game-details__spec-value">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="game-details__actions">
        <button type="button" className="btn btn--filled btn--large">
          {isFree ? "Play Now" : `Buy Now: ${game.specs.price}`}
        </button>
        <BusyButton
          type="button"
          className="btn btn--outline btn--large game-details__favorite"
          isBusy={isPending}
          disabled={isPending}
          aria-pressed={isFavorited}
          onClick={() => void toggle()}
        >
          <MaterialIcon name="favorite" className="game-details__favorite-icon" />
          <span className="game-details__favorite-label">
            {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
          </span>
        </BusyButton>
      </div>
    </section>
  );
}
