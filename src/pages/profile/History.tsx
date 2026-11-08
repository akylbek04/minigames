import type { ActivityType } from "../../profile/achievements";
import { clearHistory, type ProfileData } from "../../profile/profile-store";
import { formatRelativeTime } from "../../utils/format";

const HISTORY_VERBS: Record<ActivityType, string> = {
  view: "Opened",
  favorite: "Added to favorites",
  comment: "Commented on",
  like: "Liked a comment on",
};

// "tiny-glade" -> "Tiny Glade": the API gives a slug, the history needs a name.
function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function History({ data, email }: { data: ProfileData; email: string }) {
  return data.history.length === 0 ? (
    <p className="profile-page__empty">
      Nothing here yet. Open a game from the Library to start your history.
    </p>
  ) : (
    <>
      <ul className="profile-page__history">
        {data.history.map(({ type, slug, at }, index) => (
          <li key={`${index}-${at}`} className="profile-page__history-item">
            <span>
              {HISTORY_VERBS[type]} <strong>{slugToTitle(slug)}</strong>
            </span>
            <time dateTime={new Date(at).toISOString()}>
              {formatRelativeTime(new Date(at).toISOString())}
            </time>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn--outline" onClick={() => clearHistory(email)}>
        Clear history
      </button>
    </>
  );
}
