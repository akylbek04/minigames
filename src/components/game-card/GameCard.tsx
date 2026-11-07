import type { Game } from "../../types/game";
import { assetUrl } from "../../utils/asset-url";
import { formatCompactNumber } from "../../utils/format";
import { SkeletonGroup, Skeleton } from "../feedback/Skeletons";
import { MaterialIcon } from "../icons/MaterialIcon";
import "./game-card.scss";

interface GameCardProps {
  game: Game;
  // Badge text; the API only gives the category slug.
  categoryLabel: string;
  onOpenDetails: (slug: string) => void;
}

export function GameCard({ game, categoryLabel, onOpenDetails }: GameCardProps) {
  const isFree = game.price === "Free";
  return (
    <article className="game-card">
      <img src={assetUrl(game.cardImage)} alt="" className="game-card__image" />
      <div className="game-card__body">
        <h2 className="game-card__title">{game.name}</h2>
        <span className="game-card__badge">{categoryLabel}</span>
        <p className={`game-card__price${isFree ? " game-card__price--free" : ""}`}>{game.price}</p>
        <p className="game-card__description">{game.shortDescription}</p>
        <p className="game-card__stats">
          <span className="game-card__stat">
            <MaterialIcon
              name="star"
              className="game-card__stat-icon game-card__stat-icon--rating"
            />
            <span className="visually-hidden">Rating </span>
            {game.rating}
          </span>
          <span className="game-card__stat">
            <MaterialIcon
              name="favorite"
              className="game-card__stat-icon game-card__stat-icon--likes"
            />
            <span className="visually-hidden">Likes </span>
            {formatCompactNumber(game.likesCount)}
          </span>
        </p>
        <button
          type="button"
          className="btn btn--filled game-card__details"
          onClick={() => onOpenDetails(game.slug)}
        >
          Details
        </button>
      </div>
    </article>
  );
}

// A card-shaped placeholder: image block plus title, badge and text lines.
function GameCardSkeleton() {
  return (
    <article className="game-card" aria-hidden="true">
      <Skeleton className="game-card__image game-card__image--skeleton" />
      <div className="game-card__skeleton-body">
        <Skeleton className="game-card__skeleton-line game-card__skeleton-line--title" />
        <Skeleton className="game-card__skeleton-line game-card__skeleton-line--badge" />
        <Skeleton className="game-card__skeleton-line" />
        <Skeleton className="game-card__skeleton-line" />
        <Skeleton className="game-card__skeleton-line game-card__skeleton-line--short" />
      </div>
    </article>
  );
}

export function GameCardsSkeleton({ count, listClass }: { count: number; listClass: string }) {
  return (
    <SkeletonGroup label="Loading games…">
      <ul className={listClass}>
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <GameCardSkeleton />
          </li>
        ))}
      </ul>
    </SkeletonGroup>
  );
}
