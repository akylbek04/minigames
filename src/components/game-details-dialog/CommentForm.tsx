import { startTransition, useActionState, useState } from "react";
import { postComment } from "../../api/minigames-api";
import { getCommentAuthorName, getProfileName } from "../../auth/profile";
import { showSnackbar } from "../../hooks/snackbar-store";
import { useRequireSession } from "../../hooks/use-require-session";
import { useSession } from "../../hooks/use-session";
import { trackActivity } from "../../profile/track";
import { BusyButton } from "../busy/BusyButton";
import { notifyMutationFailed } from "../feedback/request-notices";
import { MaterialIcon } from "../icons/MaterialIcon";

export const COMMENT_MAX_LENGTH = 500;

const isValidText = (text: string): boolean => text.length > 0 && text.length <= COMMENT_MAX_LENGTH;

interface CommentFormProps {
  slug: string;
  // A comment was created; the list should show the latest ones again.
  onPosted: () => void;
}

// The textarea grows with its text up to a max height, then scrolls (CSS
// field-sizing). Enter sends, Shift+Enter starts a new line. Open for a
// signed-in user, locked for guests; the draft is kept when that changes.
export function CommentForm({ slug, onPosted }: CommentFormProps) {
  const session = useSession();
  const requireSession = useRequireSession();
  const [text, setText] = useState("");
  const isSignedIn = session !== undefined;

  // A form action: React tracks it as pending, so a second send is
  // impossible while one runs and no flag has to be reset in a `finally`.
  const [, send, isSending] = useActionState<void, FormData>(async (_, form) => {
    const trimmed = String(form.get("comment")).trim();
    if (!isValidText(trimmed)) {
      showSnackbar(
        trimmed
          ? `Comments can be up to ${COMMENT_MAX_LENGTH} characters long.`
          : "Write something before sending.",
        "warning",
      );
      return;
    }
    const current = requireSession("Log in to post comments.");
    if (!current) {
      return;
    }
    try {
      await postComment(slug, {
        userEmail: current.email,
        authorName: getCommentAuthorName(current),
        text: trimmed,
      });
      setText("");
      showSnackbar("Your comment was posted.", "success");
      trackActivity(current, "comment", slug);
      onPosted();
    } catch (error) {
      // The draft stays in the textarea either way; nothing is resent.
      notifyMutationFailed(error, {
        failed: "Couldn't post your comment. Your text is kept, so you can try again.",
        unknown:
          "We couldn't confirm whether your comment was posted. Check the comments before sending it again.",
      });
    }
  }, undefined);
  const isLocked = !isSignedIn || isSending;

  return (
    <form className="game-details__comment-form" action={send}>
      <span className="game-details__avatar game-details__avatar--self" aria-hidden="true">
        {session ? [...getProfileName(session)][0].toUpperCase() : <MaterialIcon name="person" />}
      </span>
      <textarea
        className="game-details__comment-input"
        name="comment"
        rows={1}
        aria-label="Write a comment"
        placeholder={isSignedIn ? "Write a comment..." : "Log in to write a comment"}
        disabled={isLocked}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
            return;
          }
          event.preventDefault();
          const form = new FormData(event.currentTarget.form!);
          startTransition(() => send(form));
        }}
      />
      <BusyButton
        type="submit"
        className="game-details__comment-submit"
        aria-label="Submit comment"
        isBusy={isSending}
        disabled={isLocked || !isValidText(text.trim())}
      >
        <MaterialIcon name="send" />
      </BusyButton>
    </form>
  );
}
