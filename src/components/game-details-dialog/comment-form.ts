import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { setBusy } from "../../utils/busy";
import { postComment } from "../../api/minigames-api";
import { getCommentAuthorName, getProfileName } from "../../auth/profile";
import { notifyMutationFailed } from "../feedback/request-feedback";
import { showSnackbar } from "../snackbar/snackbar";
import type { AppSession } from "../../auth/session";

export const COMMENT_MAX_LENGTH = 500;

export interface CommentFormOptions {
  slug: string;
  requireSession: (reason: string) => AppSession | undefined;
  // A comment was created; the list should show the latest ones again.
  onPosted: () => void;
}

export interface CommentForm {
  element: HTMLFormElement;
  // Open for a signed-in user, locked for guests. The draft is kept.
  setSession: (session: AppSession | undefined) => void;
}

function isValidText(text: string): boolean {
  return text.length > 0 && text.length <= COMMENT_MAX_LENGTH;
}

// The textarea grows with its text up to a max height, then scrolls (CSS
// field-sizing). Enter sends, Shift+Enter starts a new line.
export function createCommentForm({
  slug,
  requireSession,
  onPosted,
}: CommentFormOptions): CommentForm {
  const avatar = el("span", {
    class: "game-details__avatar game-details__avatar--self",
    "aria-hidden": "true",
  });

  const textarea = el("textarea", {
    class: "game-details__comment-input",
    name: "comment",
    rows: "1",
    "aria-label": "Write a comment",
  });

  const submitButton = el(
    "button",
    { type: "submit", class: "game-details__comment-submit", "aria-label": "Submit comment" },
    [materialIcon("send")],
  );

  const state = { isSignedIn: false, isSending: false };

  function render(): void {
    textarea.disabled = !state.isSignedIn || state.isSending;
    submitButton.disabled = textarea.disabled || !isValidText(textarea.value.trim());
  }

  function setSession(session: AppSession | undefined): void {
    state.isSignedIn = session !== undefined;
    avatar.replaceChildren(
      session ? [...getProfileName(session)][0].toUpperCase() : materialIcon("person"),
    );
    textarea.placeholder = session ? "Write a comment..." : "Log in to write a comment";
    render();
  }

  async function send(): Promise<void> {
    if (state.isSending) {
      return;
    }
    const text = textarea.value.trim();
    if (!isValidText(text)) {
      showSnackbar(
        text
          ? `Comments can be up to ${COMMENT_MAX_LENGTH} characters long.`
          : "Write something before sending.",
        "warning",
      );
      return;
    }
    const session = requireSession("Log in to post comments.");
    if (!session) {
      return;
    }

    state.isSending = true;
    setBusy(submitButton, true);
    render();
    try {
      await postComment(slug, {
        userEmail: session.email,
        authorName: getCommentAuthorName(session),
        text,
      });
      textarea.value = "";
      showSnackbar("Your comment was posted.", "success");
      onPosted();
    } catch (error) {
      // The draft stays in the textarea either way; nothing is resent.
      notifyMutationFailed(error, {
        failed: "Couldn't post your comment. Your text is kept, so you can try again.",
        unknown:
          "We couldn't confirm whether your comment was posted. Check the comments before sending it again.",
      });
    } finally {
      state.isSending = false;
      setBusy(submitButton, false);
      render();
    }
  }

  textarea.addEventListener("input", render);
  textarea.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
      return;
    }
    event.preventDefault();
    void send();
  });

  const element = el("form", { class: "game-details__comment-form" }, [
    avatar,
    textarea,
    submitButton,
  ]);
  element.addEventListener("submit", (event) => {
    event.preventDefault();
    void send();
  });

  setSession(undefined);
  return { element, setSession };
}
