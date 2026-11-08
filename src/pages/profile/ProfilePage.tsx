import { useEffect, useRef, useState } from "react";
import { getProfileName } from "../../auth/profile";
import type { AppSession } from "../../auth/session";
import { MaterialIcon } from "../../components/icons/MaterialIcon";
import { UserAvatar } from "../../components/user-avatar/UserAvatar";
import { showSnackbar } from "../../hooks/snackbar-store";
import { useProfile } from "../../hooks/use-profile";
import { useSession } from "../../hooks/use-session";
import { ACHIEVEMENTS, type ActivityType } from "../../profile/achievements";
import { AVATAR_COLOR_COUNT, AVATAR_ICONS } from "../../profile/avatar";
import {
  clearHistory,
  resetProfile,
  saveAvatar,
  type AvatarChoice,
  type ProfileData,
} from "../../profile/profile-store";
import { formatRelativeTime } from "../../utils/format";
import "./profile-page.scss";

const STAT_LABELS: [ActivityType | "games", string, string][] = [
  ["games", "Games opened", "videogame_asset"],
  ["favorite", "Favorites", "favorite"],
  ["comment", "Comments", "chat_bubble"],
  ["like", "Likes given", "thumb_up"],
];

const HISTORY_VERBS: Record<ActivityType, string> = {
  view: "Opened",
  favorite: "Added to favorites",
  comment: "Commented on",
  like: "Liked a comment on",
};

// How long "Reset all progress" waits for its confirming second click.
const RESET_CONFIRM_DELAY = 4000;

// "tiny-glade" -> "Tiny Glade": the API gives a slug, the history needs a name.
function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section className="profile-page__section" aria-labelledby={id}>
      <h2 className="profile-page__section-title" id={id}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Stats({ data }: { data: ProfileData }) {
  return (
    <ul className="profile-page__stats">
      {STAT_LABELS.map(([key, label, icon]) => (
        <li key={key} className="profile-page__stat">
          <MaterialIcon name={icon} className="profile-page__stat-icon" />
          <span className="profile-page__stat-value">
            {key === "games" ? data.games.length : data.counts[key]}
          </span>
          <span className="profile-page__stat-label">{label}</span>
        </li>
      ))}
    </ul>
  );
}

function Badges({ data }: { data: ProfileData }) {
  return (
    <ul className="profile-page__badges">
      {ACHIEVEMENTS.map(({ id, title, description, icon }) => {
        const unlockedAt = data.unlocked[id] as number | undefined;
        const isUnlocked = unlockedAt !== undefined;
        return (
          <li
            key={id}
            className={`profile-page__badge${isUnlocked ? "" : " profile-page__badge--locked"}`}
            data-achievement={id}
          >
            <MaterialIcon name={isUnlocked ? icon : "lock"} className="profile-page__badge-icon" />
            <h3 className="profile-page__badge-title">{title}</h3>
            <p className="profile-page__badge-text">{description}</p>
            <p className="profile-page__badge-status">
              {isUnlocked
                ? `Unlocked ${formatRelativeTime(new Date(unlockedAt).toISOString())}`
                : "Locked"}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function History({ data, email }: { data: ProfileData; email: string }) {
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

// Pick an icon and a color, preview it, then save. "Use default" goes back
// to the photo or initials.
function AvatarCustomizer({ email, current }: { email: string; current?: AvatarChoice }) {
  const [draft, setDraft] = useState<AvatarChoice>(current ?? { icon: AVATAR_ICONS[0], color: 0 });

  return (
    <div className="profile-page__customizer">
      <div className="profile-page__avatar-preview">
        <span
          className={`user-avatar user-avatar--color-${draft.color + 1} profile-page__avatar-large`}
          aria-hidden="true"
        >
          <MaterialIcon name={draft.icon} />
        </span>
      </div>
      <div className="profile-page__customizer-controls">
        <div className="profile-page__choices" role="group" aria-label="Avatar icon">
          {AVATAR_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              className="profile-page__choice"
              data-icon={icon}
              aria-label={icon.replaceAll("_", " ")}
              aria-pressed={icon === draft.icon}
              onClick={() => setDraft({ ...draft, icon })}
            >
              <MaterialIcon name={icon} />
            </button>
          ))}
        </div>
        <div className="profile-page__choices" role="group" aria-label="Avatar color">
          {Array.from({ length: AVATAR_COLOR_COUNT }, (_, color) => (
            <button
              key={color}
              type="button"
              className={`profile-page__choice profile-page__swatch user-avatar--color-${color + 1}`}
              data-color={color}
              aria-label={`Color ${color + 1}`}
              aria-pressed={color === draft.color}
              onClick={() => setDraft({ ...draft, color })}
            />
          ))}
        </div>
        <div className="profile-page__actions">
          <button
            type="button"
            className="btn btn--filled"
            onClick={() => {
              saveAvatar(email, draft);
              showSnackbar("Your avatar was saved.", "success");
            }}
          >
            Save avatar
          </button>
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => {
              saveAvatar(email, undefined);
              showSnackbar("Your avatar was reset.", "success");
            }}
          >
            Use default
          </button>
        </div>
      </div>
    </div>
  );
}

// Reset needs a second click: it erases counts and badges for good.
function Settings({ email }: { email: string }) {
  const [isArmed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function reset(): void {
    if (!isArmed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), RESET_CONFIRM_DELAY);
      return;
    }
    clearTimeout(timer.current);
    setArmed(false);
    resetProfile(email);
    showSnackbar("Your progress was reset.", "success");
  }

  return (
    <div className="profile-page__actions">
      <button type="button" className="btn btn--outline" onClick={reset}>
        {isArmed ? "Click again to erase everything" : "Reset all progress"}
      </button>
    </div>
  );
}

function ProfileContent({ session, data }: { session: AppSession; data: ProfileData }) {
  const unlockedCount = Object.keys(data.unlocked).length;
  return (
    <div className="profile-page__content">
      <div className="profile-page__hero">
        <UserAvatar profile={session} className="profile-page__avatar-large" />
        <div>
          <p className="profile-page__name">{getProfileName(session)}</p>
          <p className="profile-page__email">{session.email}</p>
          <p className="profile-page__summary">
            {unlockedCount} of {ACHIEVEMENTS.length} badges unlocked
          </p>
        </div>
      </div>
      <Section title="Statistics" id="profile-stats">
        <Stats data={data} />
      </Section>
      <Section title="Achievements" id="profile-badges">
        <Badges data={data} />
      </Section>
      <Section title="Customize your avatar" id="profile-avatar">
        <AvatarCustomizer
          key={data.avatar ? `${data.avatar.icon}|${data.avatar.color}` : "default"}
          email={session.email}
          current={data.avatar}
        />
      </Section>
      <Section title="Recent activity" id="profile-history">
        <History data={data} email={session.email} />
      </Section>
      <Section title="Settings" id="profile-settings">
        <Settings email={session.email} />
      </Section>
    </div>
  );
}

// Only for signed-in users: guests never get here (the route sends them
// Home with Auth open), and ending the session sends the user Home.
export function ProfilePage() {
  const session = useSession();
  const data = useProfile(session?.email);
  return (
    <main className="profile-page">
      <title>Your Profile — MiniGames</title>
      <div className="profile-page__inner">
        <h1 className="profile-page__title">Your profile</h1>
        {session && data && <ProfileContent session={session} data={data} />}
      </div>
    </main>
  );
}
