import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { setBusy } from "../../utils/busy";
import { formatRelativeTime } from "../../utils/format";
import {
  fetchLatestComments,
  toggleCommentLike,
  type CommentsResponse,
} from "../../api/minigames-api";
import { notifyMutationFailed } from "../feedback/request-feedback";
import { createAsyncContent } from "../feedback/async-content";
import { createEmptyState } from "../feedback/empty-state";
import { createSkeleton, createSkeletonGroup } from "../feedback/skeleton";
import { createCommentForm } from "./comment-form";
import type { GameComment } from "../../types/game-details";
import type { AppSession } from "../../auth/session";

// The avatar-random-1…5 color tokens.
const AVATAR_COLOR_COUNT = 5;

// A random token per commenter, remembered for as long as the comments
// view lives, so reloads and re-renders keep each person's color.
function createAvatarColors(): (authorName: string) => number {
  const colors = new Map<string, number>();
  return (authorName) => {
    const color = colors.get(authorName) ?? Math.floor(Math.random() * AVATAR_COLOR_COUNT) + 1;
    colors.set(authorName, color);
    return color;
  };
}

// First non-whitespace character, uppercased (whole, even if it is an emoji).
function getAuthorInitial(authorName: string): string {
  return [...authorName.trim()][0]?.toUpperCase() ?? "?";
}

type RequireSession = (reason: string) => AppSession | undefined;

// The pressed state and count only ever come from the server: the
// personalized list on load, then each toggle response. Locked while a
// toggle is in flight and never resent.
function createLikeButton(comment: GameComment, requireSession: RequireSession): HTMLButtonElement {
  const count = el("span", {});
  const button = el("button", { type: "button", class: "game-details__like" }, [
    materialIcon("favorite", "game-details__like-icon"),
    count,
  ]);

  function render(isLiked: boolean, likesCount: number): void {
    button.setAttribute("aria-pressed", String(isLiked));
    button.setAttribute("aria-label", `Like comment by ${comment.authorName}, ${likesCount} likes`);
    count.textContent = String(likesCount);
  }

  async function toggle(): Promise<void> {
    const session = requireSession("Log in to like comments.");
    if (!session) {
      return;
    }
    button.disabled = true;
    setBusy(button, true);
    try {
      const result = await toggleCommentLike(comment.commentId, session.email);
      render(result.isLikedByCurrentUser, result.likesCount);
    } catch (error) {
      notifyMutationFailed(error, {
        failed: "Couldn't update the like. Please try again.",
        unknown: "We couldn't confirm the like. Reopen the game to check it before trying again.",
      });
    } finally {
      button.disabled = false;
      setBusy(button, false);
    }
  }

  render(comment.isLikedByCurrentUser, comment.likesCount);
  button.addEventListener("click", () => void toggle());
  return button;
}

function createComment(
  comment: GameComment,
  requireSession: RequireSession,
  avatarColor: number,
): HTMLElement {
  return el("article", { class: "game-details__comment" }, [
    el("header", { class: "game-details__comment-header" }, [
      el(
        "span",
        {
          class: `game-details__avatar game-details__avatar--${avatarColor}`,
          "aria-hidden": "true",
        },
        [getAuthorInitial(comment.authorName)],
      ),
      el("h4", { class: "game-details__comment-author" }, [comment.authorName]),
      el("time", { class: "game-details__comment-date", datetime: comment.createdAt }, [
        formatRelativeTime(comment.createdAt),
      ]),
    ]),
    el("p", { class: "game-details__comment-text" }, [comment.text]),
    createLikeButton(comment, requireSession),
  ]);
}

const SKELETON_COMMENT_COUNT = 3;

function createNoComments(): HTMLElement {
  return createEmptyState({
    title: "No comments yet",
    message: "Nobody has shared their thoughts on this game so far.",
    icon: "forum",
  });
}

function createCommentsSkeleton(): Node {
  return createSkeletonGroup("Loading comments…", [
    el(
      "ul",
      { class: "game-details__comments", "aria-hidden": "true" },
      Array.from({ length: SKELETON_COMMENT_COUNT }, () =>
        el("li", {}, [
          el("div", { class: "game-details__comment" }, [
            createSkeleton("game-details__skeleton-line game-details__skeleton-line--short"),
            createSkeleton("game-details__skeleton-line"),
            createSkeleton("game-details__skeleton-line"),
          ]),
        ]),
      ),
    ),
  ]);
}

export interface CommentsSectionOptions {
  slug: string;
  session: AppSession | undefined;
  requireSession: RequireSession;
}

export interface CommentsSection {
  element: HTMLElement;
  load: () => void;
  // Unlocks or locks the form and reloads the list for the new user.
  setSession: (session: AppSession | undefined) => void;
}

// The latest comments plus the game's total comment count, loaded on their
// own so a comments failure never hides the rest of the game details.
export function createCommentsSection({
  slug,
  session,
  requireSession,
}: CommentsSectionOptions): CommentsSection {
  const state = { session };
  const avatarColorFor = createAvatarColors();
  const title = el(
    "h3",
    { id: "game-details-comments-title", class: "game-details__section-title" },
    ["Comments"],
  );

  const list = createAsyncContent<CommentsResponse>({
    subject: "comments",
    renderLoading: createCommentsSkeleton,
    renderData: ({ data }) =>
      el(
        "ul",
        { class: "game-details__comments" },
        data.map((comment) =>
          el("li", {}, [
            createComment(comment, requireSession, avatarColorFor(comment.authorName)),
          ]),
        ),
      ),
    isEmpty: ({ data }) => data.length === 0,
    renderEmpty: createNoComments,
    // An unknown game has no comments either; the dialog itself already
    // shows Game Not Found, so this is not reported as a failure.
    renderNotFound: createNoComments,
    onStateChange: (state) => {
      if (state !== "ready" && state !== "empty") {
        title.textContent = "Comments";
      }
    },
  });

  // Personalized (each comment's like state) for a signed-in user.
  function load(): void {
    const email = state.session?.email;
    void list.load(async (signal) => {
      const response = await fetchLatestComments(slug, email, signal);
      // The exact total for the game, not just the 3 comments shown.
      title.textContent = `Comments (${response.meta.totalComments})`;
      return response;
    });
  }

  const form = createCommentForm({ slug, requireSession, onPosted: load });
  form.setSession(session);

  const element = el(
    "section",
    { class: "game-details__section", "aria-labelledby": "game-details-comments-title" },
    [title, form.element, list.element],
  );

  function setSession(nextSession: AppSession | undefined): void {
    state.session = nextSession;
    form.setSession(nextSession);
    load();
  }

  return { element, load, setSession };
}
