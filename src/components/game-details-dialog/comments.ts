import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { formatRelativeTime } from "../../utils/format";
import { fetchLatestComments, type CommentsResponse } from "../../api/minigames-api";
import { createAsyncContent } from "../feedback/async-content";
import { createEmptyState } from "../feedback/empty-state";
import { createSkeleton, createSkeletonGroup } from "../feedback/skeleton";
import type { GameComment } from "../../types/game-details";

// Posting is an authenticated feature (Story 4), so the form never sends.
function createCommentForm(): HTMLFormElement {
  const textarea = el("textarea", {
    class: "game-details__comment-input",
    name: "comment",
    rows: "1",
    placeholder: "Write a comment...",
    "aria-label": "Write a comment",
  });

  const submitButton = el(
    "button",
    { type: "submit", class: "game-details__comment-submit", "aria-label": "Submit comment" },
    [materialIcon("send")],
  );
  submitButton.disabled = true;

  textarea.addEventListener("input", () => {
    submitButton.disabled = textarea.value.trim() === "";
  });

  const form = el("form", { class: "game-details__comment-form" }, [
    el(
      "span",
      { class: "game-details__avatar game-details__avatar--self", "aria-hidden": "true" },
      ["U"],
    ),
    textarea,
    submitButton,
  ]);
  form.addEventListener("submit", (event) => event.preventDefault());

  return form;
}

const AVATAR_COLOR_COUNT = 5;

// Stable per author, so the same person always gets the same avatar color.
function avatarColor(name: string): number {
  return (
    ([...name].reduce((sum, char) => sum + (char.codePointAt(0) ?? 0), 0) % AVATAR_COLOR_COUNT) + 1
  );
}

// Liking is an authenticated feature (Story 4): the button only toggles its
// own pressed state and the count stays as loaded.
function createLikeButton(comment: GameComment): HTMLButtonElement {
  const button = el(
    "button",
    {
      type: "button",
      class: "game-details__like",
      "aria-pressed": String(comment.isLikedByCurrentUser),
      "aria-label": `Like comment by ${comment.authorName}, ${comment.likesCount} likes`,
    },
    [materialIcon("favorite", "game-details__like-icon"), String(comment.likesCount)],
  );
  button.addEventListener("click", () => {
    button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"));
  });
  return button;
}

function createComment(comment: GameComment): HTMLElement {
  return el("article", { class: "game-details__comment" }, [
    el("header", { class: "game-details__comment-header" }, [
      el(
        "span",
        {
          class: `game-details__avatar game-details__avatar--${avatarColor(comment.authorName)}`,
          "aria-hidden": "true",
        },
        [comment.authorName.charAt(0)],
      ),
      el("h4", { class: "game-details__comment-author" }, [comment.authorName]),
      el("time", { class: "game-details__comment-date", datetime: comment.createdAt }, [
        formatRelativeTime(comment.createdAt),
      ]),
    ]),
    el("p", { class: "game-details__comment-text" }, [comment.text]),
    createLikeButton(comment),
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

export interface CommentsSection {
  element: HTMLElement;
  load: () => void;
}

// The latest comments plus the game's total comment count, loaded on their
// own so a comments failure never hides the rest of the game details.
export function createCommentsSection(slug: string): CommentsSection {
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
        data.map((comment) => el("li", {}, [createComment(comment)])),
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

  const element = el(
    "section",
    { class: "game-details__section", "aria-labelledby": "game-details-comments-title" },
    [title, createCommentForm(), list.element],
  );

  return {
    element,
    load: () =>
      void list.load(async (signal) => {
        const response = await fetchLatestComments(slug, signal);
        // The exact total for the game, not just the 3 comments shown.
        title.textContent = `Comments (${response.meta.totalComments})`;
        return response;
      }),
  };
}
