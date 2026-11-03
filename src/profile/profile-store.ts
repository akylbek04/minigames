import {
  ACHIEVEMENTS,
  type Achievement,
  type ActivityType,
  type ProfileStats,
} from "./achievements";
import { AVATAR_COLOR_COUNT, isAvatarIcon } from "./avatar";

// One record per user (by email), kept on this device only: the backend has
// no profile endpoints, and the app session never stores user data.
const STORAGE_PREFIX = "minigames:akylbek04-minigames:profile:";
export const HISTORY_LIMIT = 50;
export const ACTIVITY_TYPES: readonly ActivityType[] = ["view", "favorite", "comment", "like"];

export interface HistoryEntry {
  type: ActivityType;
  slug: string;
  at: number;
}

// The avatar is built from these presets, never from free-form input.
export interface AvatarChoice {
  icon: string;
  color: number;
}

export interface ProfileData extends ProfileStats {
  history: HistoryEntry[];
  // Achievement id -> unlock time.
  unlocked: Record<string, number>;
  avatar?: AvatarChoice;
}

type ProfileListener = (email: string, data: ProfileData) => void;
const listeners: ProfileListener[] = [];

export function onProfileChange(listener: ProfileListener): void {
  listeners.push(listener);
}

const keyFor = (email: string): string => STORAGE_PREFIX + email.trim().toLowerCase();

function emptyProfile(): ProfileData {
  return {
    counts: { view: 0, favorite: 0, comment: 0, like: 0 },
    games: [],
    history: [],
    unlocked: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

// Anything malformed is dropped field by field, so a hand-edited or old
// record can never break the Profile page.
export function parseProfile(raw: string | undefined): ProfileData {
  const profile = emptyProfile();
  let value: unknown;
  try {
    value = raw === undefined ? undefined : JSON.parse(raw);
  } catch {
    return profile;
  }
  if (!isRecord(value)) {
    return profile;
  }

  if (isRecord(value.counts)) {
    for (const type of ACTIVITY_TYPES) {
      const count = value.counts[type];
      profile.counts[type] = isCount(count) ? count : 0;
    }
  }
  if (Array.isArray(value.games)) {
    profile.games = [...new Set(value.games.filter((g): g is string => typeof g === "string"))];
  }
  if (Array.isArray(value.history)) {
    profile.history = value.history
      .filter(
        (entry): entry is HistoryEntry =>
          isRecord(entry) &&
          ACTIVITY_TYPES.includes(entry.type as ActivityType) &&
          typeof entry.slug === "string" &&
          typeof entry.at === "number",
      )
      .slice(0, HISTORY_LIMIT);
  }
  if (isRecord(value.unlocked)) {
    for (const [id, at] of Object.entries(value.unlocked)) {
      if (typeof at === "number" && ACHIEVEMENTS.some((a) => a.id === id)) {
        profile.unlocked[id] = at;
      }
    }
  }
  const { avatar } = value;
  if (
    isRecord(avatar) &&
    typeof avatar.icon === "string" &&
    isAvatarIcon(avatar.icon) &&
    isCount(avatar.color) &&
    avatar.color < AVATAR_COLOR_COUNT
  ) {
    profile.avatar = { icon: avatar.icon, color: avatar.color };
  }
  return profile;
}

export function loadProfile(email: string): ProfileData {
  try {
    return parseProfile(localStorage.getItem(keyFor(email)) ?? undefined);
  } catch {
    return emptyProfile();
  }
}

function saveProfile(email: string, data: ProfileData): void {
  try {
    localStorage.setItem(keyFor(email), JSON.stringify(data));
  } catch {
    // Storage full or blocked: the profile is a convenience, not required.
  }
  for (const listener of listeners) {
    listener(email, data);
  }
}

// Counts one successful action and returns the achievements it unlocked.
export function recordActivity(
  email: string,
  type: ActivityType,
  slug: string,
  now = Date.now(),
): Achievement[] {
  const data = loadProfile(email);
  data.counts[type] += 1;
  if (type === "view" && !data.games.includes(slug)) {
    data.games.push(slug);
  }
  data.history = [{ type, slug, at: now }, ...data.history].slice(0, HISTORY_LIMIT);

  const unlockedNow = ACHIEVEMENTS.filter(
    (achievement) => data.unlocked[achievement.id] === undefined && achievement.isUnlocked(data),
  );
  for (const { id } of unlockedNow) {
    data.unlocked[id] = now;
  }
  saveProfile(email, data);
  return unlockedNow;
}

export function saveAvatar(email: string, avatar: AvatarChoice | undefined): void {
  const data = loadProfile(email);
  if (avatar) {
    data.avatar = avatar;
  } else {
    delete data.avatar;
  }
  saveProfile(email, data);
}

// Clears the history list only; counts and unlocked badges are kept.
export function clearHistory(email: string): void {
  const data = loadProfile(email);
  data.history = [];
  saveProfile(email, data);
}

export function resetProfile(email: string): void {
  saveProfile(email, emptyProfile());
}
