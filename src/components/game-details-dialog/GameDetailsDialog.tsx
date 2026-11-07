import { useEffect, useRef, useState } from "react";
import { fetchGameDetails } from "../../api/minigames-api";
import type { AppSession } from "../../auth/session";
import { useAsyncResult } from "../../hooks/use-async-result";
import { useRequireSession } from "../../hooks/use-require-session";
import { trackActivity } from "../../profile/track";
import type { GameDetails } from "../../types/game-details";
import { assetUrl } from "../../utils/asset-url";
import { AnimatedDialog } from "../dialog/AnimatedDialog";
import { AsyncView } from "../feedback/AsyncContent";
import { EmptyState } from "../feedback/EmptyState";
import { Skeleton, SkeletonGroup } from "../feedback/Skeletons";
import { MaterialIcon } from "../icons/MaterialIcon";
import { CommentsSection } from "./CommentsSection";
import { GameInfo } from "./GameInfo";
import { TopRecords } from "./TopRecords";
import "./game-details-dialog.scss";

function DetailsSkeleton() {
  return (
    <SkeletonGroup label="Loading game details…">
      <Skeleton className="game-details__hero-image game-details__hero-image--skeleton" />
      <div className="game-details__body" aria-hidden="true">
        <div className="game-details__info">
          <Skeleton className="game-details__skeleton-line game-details__skeleton-line--title" />
          <Skeleton className="game-details__skeleton-line" />
          <Skeleton className="game-details__skeleton-line" />
          <Skeleton className="game-details__skeleton-line game-details__skeleton-line--short" />
          <Skeleton className="game-details__skeleton-line game-details__skeleton-line--button" />
        </div>
        <div className="game-details__section">
          <Skeleton className="game-details__skeleton-line" />
          <Skeleton className="game-details__skeleton-line" />
          <Skeleton className="game-details__skeleton-line" />
        </div>
      </div>
    </SkeletonGroup>
  );
}

interface ContentProps {
  slug: string;
  session: AppSession | undefined;
  onRequestClose: () => void;
}

// One opening of a game. The dialog gives it a new key for every fresh
// open, so details, favorites, likes and the comment draft all start over.
function GameDetailsContent({ slug, session, onRequestClose }: ContentProps) {
  const requireSession = useRequireSession();
  const root = useRef<HTMLDivElement>(null);
  // The view counts for the user who opened the game, once: signing in with
  // the dialog already open doesn't count the same visit.
  const [openedBy] = useState(session?.email);
  const hasTracked = useRef(false);

  useEffect(() => {
    root.current?.closest("dialog")?.scrollTo({ top: 0 });
  }, []);

  // Personalized for the signed-in user; guests get the public state.
  const result = useAsyncResult<GameDetails>({
    subject: "game details",
    requestKey: `${slug}|${session?.email ?? ""}`,
    request: async (signal) => {
      const details = await fetchGameDetails(slug, session?.email, signal);
      // Closed or replaced meanwhile: that visit is not counted.
      signal.throwIfAborted();
      if (session && session.email === openedBy && !hasTracked.current) {
        hasTracked.current = true;
        trackActivity(session, "view", slug);
      }
      return details;
    },
    canShowNotFound: true,
  });

  return (
    <div ref={root}>
      {/* Outside the loaded content, so it can close every state. */}
      <button
        type="button"
        className="game-details__close"
        aria-label="Close game details"
        onClick={onRequestClose}
      >
        <MaterialIcon name="close" />
      </button>
      <AsyncView
        result={result}
        className="game-details__content"
        renderLoading={() => <DetailsSkeleton />}
        renderData={(game) => (
          <div>
            <div className="game-details__hero">
              <img src={assetUrl(game.heroImage)} alt="" className="game-details__hero-image" />
            </div>
            <div className="game-details__body">
              <GameInfo game={game} requireSession={requireSession} />
              <TopRecords records={game.topRecords} />
              <CommentsSection slug={slug} session={session} requireSession={requireSession} />
            </div>
          </div>
        )}
        // A slug the API doesn't know (e.g. a mistyped or outdated link).
        renderNotFound={() => (
          <div className="game-details__not-found">
            <EmptyState
              title="Game Not Found"
              message={`We couldn't find a game called “${slug}”. It may have been removed, or the link is incorrect.`}
              icon="videogame_asset_off"
              action={{ label: "Back to games", onClick: onRequestClose }}
            />
          </div>
        )}
      />
    </div>
  );
}

interface GameDetailsDialogProps {
  // From the `game` URL parameter; undefined closes the dialog.
  slug: string | undefined;
  // Auth is shown instead: the dialog hides but keeps its state.
  isCovered: boolean;
  session: AppSession | undefined;
  // The dialog never closes itself: it asks for the URL to drop the game.
  onRequestClose: () => void;
}

export function GameDetailsDialog({
  slug,
  isCovered,
  session,
  onRequestClose,
}: GameDetailsDialogProps) {
  // The content stays while the dialog plays its closing animation; every
  // fresh open (a new slug, or the same one after closing) gets a new id.
  const [shown, setShown] = useState<{ slug: string; opening: number; isOpen: boolean }>();
  if (slug !== undefined && (shown === undefined || shown.slug !== slug || !shown.isOpen)) {
    setShown({ slug, opening: (shown?.opening ?? 0) + 1, isOpen: true });
  } else if (slug === undefined && shown?.isOpen) {
    setShown({ ...shown, isOpen: false });
  }

  return (
    <AnimatedDialog
      className="game-details"
      labelledBy="game-details-title"
      label="Game details"
      isOpen={slug !== undefined && !isCovered}
      onRequestClose={onRequestClose}
    >
      {shown && (
        <GameDetailsContent
          key={shown.opening}
          slug={shown.slug}
          session={session}
          onRequestClose={onRequestClose}
        />
      )}
    </AnimatedDialog>
  );
}
