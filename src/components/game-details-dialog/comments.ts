import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
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

export function createComments(comments: GameComment[]): HTMLElement {
  return el(
    "section",
    { class: "game-details__section", "aria-labelledby": "game-details-comments-title" },
    [
      el("h3", { id: "game-details-comments-title", class: "game-details__section-title" }, [
        `Comments (${comments.length})`,
      ]),
      createCommentForm(),
    ],
  );
}
