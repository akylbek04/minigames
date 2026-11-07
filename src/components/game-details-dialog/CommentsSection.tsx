import { useState } from "react";
import {
  fetchLatestComments,
  toggleCommentLike,
  type CommentsResponse,
} from "../../api/minigames-api";
import { useAsyncResult } from "../../hooks/use-async-result";
import { useRequireSession } from "../../hooks/use-require-session";
import { useSession } from "../../hooks/use-session";
import { trackActivity } from "../../profile/track";
import type { GameComment } from "../../types/game-details";
import { formatRelativeTime } from "../../utils/format";
import { BusyButton } from "../busy/BusyButton";
import { AsyncView } from "../feedback/AsyncContent";
import { EmptyState } from "../feedback/EmptyState";
import { notifyMutationFailed } from "../feedback/request-notices";
import { Skeleton, SkeletonGroup } from "../feedback/Skeletons";
import { MaterialIcon } from "../icons/MaterialIcon";
import { CommentForm } from "./CommentForm";

// The avatar-random-1…5 color tokens.
const AVATAR_COLOR_COUNT = 5;
const SKELETON_COMMENT_COUNT = 3;

// First non-whitespace character, uppercased (whole, even if it is an emoji).
function getAuthorInitial(authorName: string): string {
  return [...authorName.trim()][0]?.toUpperCase() ?? "?";
}

interface LikeAnswer {
  comment: GameComment;
  isLiked: boolean;
  likesCount: number;
}

// The pressed state and count only ever come from the server: the
// personalized list on load, then each toggle response. Locked while a
// toggle is in flight and never resent.
function LikeButton({ comment, slug }: { comment: GameComment; slug: string }) {
  const requireSession = useRequireSession();
  const [answer, setAnswer] = useState<LikeAnswer>();
  const [isPending, setPending] = useState(false);
  const { isLiked, likesCount } =
    answer?.comment === comment
      ? answer
      : { isLiked: comment.isLikedByCurrentUser, likesCount: comment.likesCount };

  async function toggle(): Promise<void> {
    const session = requireSession("Log in to like comments.");
    if (!session) {
      return;
    }
    setPending(true);
    try {
      const result = await toggleCommentLike(comment.commentId, session.email);
      setAnswer({
        comment,
        isLiked: result.isLikedByCurrentUser,
        likesCount: result.likesCount,
      });
      if (result.isLikedByCurrentUser) {
        trackActivity(session, "like", slug, String(comment.commentId));
      }
    } catch (error) {
      notifyMutationFailed(error, {
        failed: "Couldn't update the like. Please try again.",
        unknown: "We couldn't confirm the like. Reopen the game to check it before trying again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <BusyButton
      type="button"
      className="game-details__like"
      isBusy={isPending}
      disabled={isPending}
      aria-pressed={isLiked}
      aria-label={`Like comment by ${comment.authorName}, ${likesCount} likes`}
      onClick={() => void toggle()}
    >
      <MaterialIcon name="favorite" className="game-details__like-icon" />
      <span>{likesCount}</span>
    </BusyButton>
  );
}

function CommentItem({
  comment,
  slug,
  avatarColor,
}: {
  comment: GameComment;
  slug: string;
  avatarColor: number;
}) {
  return (
    <article className="game-details__comment">
      <header className="game-details__comment-header">
        <span
          className={`game-details__avatar game-details__avatar--${avatarColor}`}
          aria-hidden="true"
        >
          {getAuthorInitial(comment.authorName)}
        </span>
        <h4 className="game-details__comment-author">{comment.authorName}</h4>
        <time className="game-details__comment-date" dateTime={comment.createdAt}>
          {formatRelativeTime(comment.createdAt)}
        </time>
      </header>
      <p className="game-details__comment-text">{comment.text}</p>
      <LikeButton comment={comment} slug={slug} />
    </article>
  );
}

function NoComments() {
  return (
    <EmptyState
      title="No comments yet"
      message="Nobody has shared their thoughts on this game so far."
      icon="forum"
    />
  );
}

function CommentsSkeleton() {
  return (
    <SkeletonGroup label="Loading comments…">
      <ul className="game-details__comments" aria-hidden="true">
        {Array.from({ length: SKELETON_COMMENT_COUNT }, (_, index) => (
          <li key={index}>
            <div className="game-details__comment">
              <Skeleton className="game-details__skeleton-line game-details__skeleton-line--short" />
              <Skeleton className="game-details__skeleton-line" />
              <Skeleton className="game-details__skeleton-line" />
            </div>
          </li>
        ))}
      </ul>
    </SkeletonGroup>
  );
}

// The latest comments plus the game's total comment count, loaded on their
// own so a comments failure never hides the rest of the game details.
export function CommentsSection({ slug }: { slug: string }) {
  const email = useSession()?.email;
  const [reloads, setReloads] = useState(0);
  // A random token per commenter, remembered for as long as the comments
  // view lives, so reloads keep each person's color. Filled when comments
  // arrive, never while rendering.
  const [avatarColors] = useState(() => new Map<string, number>());

  // Personalized (each comment's like state) for a signed-in user.
  const result = useAsyncResult<CommentsResponse>({
    subject: "comments",
    requestKey: `${slug}|${email ?? ""}|${reloads}`,
    request: async (signal) => {
      const response = await fetchLatestComments(slug, email, signal);
      for (const { authorName } of response.data) {
        if (!avatarColors.has(authorName)) {
          avatarColors.set(authorName, Math.floor(Math.random() * AVATAR_COLOR_COUNT) + 1);
        }
      }
      return response;
    },
    // An unknown game has no comments either; the dialog itself already
    // shows Game Not Found, so this is not reported as a failure.
    canShowNotFound: true,
  });

  // The exact total for the game, not just the 3 comments shown.
  const title =
    result.status === "ready" ? `Comments (${result.data.meta.totalComments})` : "Comments";

  return (
    <section className="game-details__section" aria-labelledby="game-details-comments-title">
      <h3 id="game-details-comments-title" className="game-details__section-title">
        {title}
      </h3>
      <CommentForm slug={slug} onPosted={() => setReloads((count) => count + 1)} />
      <AsyncView
        result={result}
        renderLoading={() => <CommentsSkeleton />}
        renderData={({ data }) => (
          <ul className="game-details__comments">
            {data.map((comment) => (
              <li key={comment.commentId}>
                <CommentItem
                  comment={comment}
                  slug={slug}
                  avatarColor={avatarColors.get(comment.authorName) ?? 1}
                />
              </li>
            ))}
          </ul>
        )}
        isEmpty={({ data }) => data.length === 0}
        renderEmpty={() => <NoComments />}
        renderNotFound={() => <NoComments />}
      />
    </section>
  );
}
