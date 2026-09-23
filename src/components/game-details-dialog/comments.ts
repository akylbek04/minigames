import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { formatRelativeTime } from "../../utils/format";
import type { GameComment } from "../../types/game-details";

// Submitting is out of scope until Story 3, so the form never sends.
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

// Liking only toggles this button's own state for now; counts stay as loaded.
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
      el("span", { class: "game-details__comment-author" }, [comment.authorName]),
      el("time", { class: "game-details__comment-date", datetime: comment.createdAt }, [
        formatRelativeTime(comment.createdAt),
      ]),
    ]),
    el("p", { class: "game-details__comment-text" }, [comment.text]),
    createLikeButton(comment),
  ]);
}

export function createComments(comments: GameComment[]): HTMLElement {
  return el(
    "section",
    { class: "game-details__section", "aria-labelledby": "game-details-comments-title" },
    [
      el("h3", { id: "game-details-comments-title", class: "game-details__section-title" }, [
        `Comments (${comments.length})`,
      ]),
      createCommentForm(),
      el(
        "ul",
        { class: "game-details__comments" },
        comments.map((comment) => el("li", {}, [createComment(comment)])),
      ),
    ],
  );
}
