import { useState } from "react";
import { postComment } from "../../api/minigames-api";
import { getCommentAuthorName, getProfileName } from "../../auth/profile";
import type { AppSession } from "../../auth/session";
import { showSnackbar } from "../../hooks/snackbar-store";
import { trackActivity } from "../../profile/track";
import { BusyButton } from "../busy/BusyButton";
import { notifyMutationFailed } from "../feedback/request-notices";
import { MaterialIcon } from "../icons/MaterialIcon";

export const COMMENT_MAX_LENGTH = 500;

const isValidText = (text: string): boolean => text.length > 0 && text.length <= COMMENT_MAX_LENGTH;

interface CommentFormProps {
  slug: string;
  session: AppSession | undefined;
  requireSession: (reason: string) => AppSession | undefined;
  // A comment was created; the list should show the latest ones again.
  onPosted: () => void;
}

// The textarea grows with its text up to a max height, then scrolls (CSS
// field-sizing). Enter sends, Shift+Enter starts a new line. Open for a
// signed-in user, locked for guests; the draft is kept when that changes.
export function CommentForm({ slug, session, requireSession, onPosted }: CommentFormProps) {
  const [text, setText] = useState("");
  const [isSending, setSending] = useState(false);
  const isSignedIn = session !== undefined;
  const isLocked = !isSignedIn || isSending;

  async function send(): Promise<void> {
    if (isSending) {
      return;
    }
    const trimmed = text.trim();
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

    setSending(true);
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
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      className="game-details__comment-form"
      onSubmit={(event) => {
        event.preventDefault();
        void send();
      }}
    >
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
          void send();
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
