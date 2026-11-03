import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { formatRelativeTime } from "../../utils/format";
import { createUserAvatar } from "../../components/user-avatar/user-avatar";
import { getProfileName } from "../../auth/profile";
import { ACHIEVEMENTS, type ActivityType } from "../../profile/achievements";
import {
  clearHistory,
  loadProfile,
  onProfileChange,
  type ProfileData,
} from "../../profile/profile-store";
import type { AppSession } from "../../auth/session";
import type { AppPage } from "../app-page";
import "./profile-page.scss";

export interface ProfilePage extends AppPage {
  // The page shows the signed-in user's data; nothing without a session.
  setSession: (session: AppSession | undefined) => void;
}

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

// "tiny-glade" -> "Tiny Glade": the API gives a slug, the history needs a name.
function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function createSection(title: string, id: string, children: (Node | string)[]): HTMLElement {
  return el("section", { class: "profile-page__section", "aria-labelledby": id }, [
    el("h2", { class: "profile-page__section-title", id }, [title]),
    ...children,
  ]);
}

function createStats(data: ProfileData): HTMLElement {
  return el(
    "ul",
    { class: "profile-page__stats" },
    STAT_LABELS.map(([key, label, icon]) => {
      const value = key === "games" ? data.games.length : data.counts[key];
      return el("li", { class: "profile-page__stat" }, [
        materialIcon(icon, "profile-page__stat-icon"),
        el("span", { class: "profile-page__stat-value" }, [String(value)]),
        el("span", { class: "profile-page__stat-label" }, [label]),
      ]);
    }),
  );
}

function createBadges(data: ProfileData): HTMLElement {
  return el(
    "ul",
    { class: "profile-page__badges" },
    ACHIEVEMENTS.map(({ id, title, description, icon }) => {
      const unlockedAt = data.unlocked[id];
      const isUnlocked = unlockedAt !== undefined;
      return el(
        "li",
        {
          class: `profile-page__badge${isUnlocked ? "" : " profile-page__badge--locked"}`,
          "data-achievement": id,
        },
        [
          materialIcon(isUnlocked ? icon : "lock", "profile-page__badge-icon"),
          el("h3", { class: "profile-page__badge-title" }, [title]),
          el("p", { class: "profile-page__badge-text" }, [description]),
          el("p", { class: "profile-page__badge-status" }, [
            isUnlocked
              ? `Unlocked ${formatRelativeTime(new Date(unlockedAt).toISOString())}`
              : "Locked",
          ]),
        ],
      );
    }),
  );
}

function createHistory(data: ProfileData, onClear: () => void): HTMLElement[] {
  if (data.history.length === 0) {
    return [
      el("p", { class: "profile-page__empty" }, [
        "Nothing here yet. Open a game from the Library to start your history.",
      ]),
    ];
  }
  const clear = el("button", { type: "button", class: "btn btn--outline" }, ["Clear history"]);
  clear.addEventListener("click", onClear);
  return [
    el(
      "ul",
      { class: "profile-page__history" },
      data.history.map(({ type, slug, at }) =>
        el("li", { class: "profile-page__history-item" }, [
          el("span", {}, [`${HISTORY_VERBS[type]} `, el("strong", {}, [slugToTitle(slug)])]),
          el("time", { datetime: new Date(at).toISOString() }, [
            formatRelativeTime(new Date(at).toISOString()),
          ]),
        ]),
      ),
    ),
    clear,
  ];
}

export function createProfilePage(): ProfilePage {
  const content = el("div", { class: "profile-page__content" });
  const element = el("main", { class: "profile-page" }, [
    el("div", { class: "profile-page__inner" }, [
      el("h1", { class: "profile-page__title" }, ["Your profile"]),
      content,
    ]),
  ]);
  const state: { session?: AppSession } = {};

  function render(): void {
    const { session } = state;
    if (!session) {
      content.replaceChildren();
      return;
    }
    const data = loadProfile(session.email);
    const unlockedCount = Object.keys(data.unlocked).length;
    content.replaceChildren(
      el("div", { class: "profile-page__hero" }, [
        createUserAvatar(session, "profile-page__avatar-large"),
        el("div", {}, [
          el("p", { class: "profile-page__name" }, [getProfileName(session)]),
          el("p", { class: "profile-page__email" }, [session.email]),
          el("p", { class: "profile-page__summary" }, [
            `${unlockedCount} of ${ACHIEVEMENTS.length} badges unlocked`,
          ]),
        ]),
      ]),
      createSection("Statistics", "profile-stats", [createStats(data)]),
      createSection("Achievements", "profile-badges", [createBadges(data)]),
      createSection(
        "Recent activity",
        "profile-history",
        createHistory(data, () => clearHistory(session.email)),
      ),
    );
  }

  // Edits made here (and tracked actions elsewhere) refresh the page, but
  // only for the user it is showing.
  onProfileChange((email) => {
    if (email === state.session?.email) {
      render();
    }
  });

  return {
    element,
    setSession: (session) => {
      state.session = session;
      render();
    },
    show: render,
  };
}
