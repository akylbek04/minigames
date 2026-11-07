import { beforeEach, describe, expect, it } from "vitest";
import {
  HISTORY_LIMIT,
  clearHistory,
  loadProfile,
  onProfileChange,
  parseProfile,
  recordActivity,
  resetProfile,
  saveAvatar,
  watchOtherTabs,
} from "./profile-store";

const EMAIL = "Ana@x.io";
const PREFIX = "minigames:akylbek04-minigames:profile:";

beforeEach(() => localStorage.clear());

describe("recordActivity", () => {
  it("counts actions and unlocks a badge once", () => {
    const first = recordActivity(EMAIL, "view", "snake");
    expect(first.map((a) => a.id)).toEqual(["explorer"]);
    expect(recordActivity(EMAIL, "view", "snake")).toEqual([]);
    expect(loadProfile(EMAIL).counts.view).toBe(2);
  });

  it("counts a game once for distinct-game badges", () => {
    for (let i = 0; i < 6; i++) recordActivity(EMAIL, "view", "snake");
    expect(loadProfile(EMAIL).games).toEqual(["snake"]);
    for (const slug of ["a", "b", "c", "d"]) recordActivity(EMAIL, "view", slug);
    expect(loadProfile(EMAIL).unlocked).toHaveProperty("scout");
  });

  it("unlocks All-Rounder after favorite, comment and like", () => {
    recordActivity(EMAIL, "favorite", "snake");
    recordActivity(EMAIL, "comment", "snake");
    const ids = recordActivity(EMAIL, "like", "snake").map((a) => a.id);
    expect(ids).toContain("all-rounder");
  });

  it("counts each favorited game and liked comment only once", () => {
    recordActivity(EMAIL, "favorite", "snake");
    expect(recordActivity(EMAIL, "favorite", "snake")).toEqual([]);
    recordActivity(EMAIL, "like", "snake", 1, "c1");
    recordActivity(EMAIL, "like", "snake", 2, "c1");
    recordActivity(EMAIL, "like", "snake", 3, "c2");

    const { counts, history } = loadProfile(EMAIL);
    expect(counts).toMatchObject({ favorite: 1, like: 2 });
    expect(history).toHaveLength(3);
  });

  it("refreshes listeners when another tab changes a profile", () => {
    watchOtherTabs();
    const seen: string[] = [];
    onProfileChange((email) => {
      seen.push(email);
    });
    dispatchEvent(new StorageEvent("storage", { key: `${PREFIX}ana@x.io` }));
    dispatchEvent(new StorageEvent("storage", { key: "other" }));
    expect(seen).toEqual(["ana@x.io"]);
  });

  it("keeps the newest history first and caps it", () => {
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) recordActivity(EMAIL, "view", `g${i}`, i);
    const { history } = loadProfile(EMAIL);
    expect(history).toHaveLength(HISTORY_LIMIT);
    expect(history[0].slug).toBe(`g${HISTORY_LIMIT + 4}`);
  });

  it("keeps each user's data apart, ignoring email case", () => {
    recordActivity("ANA@x.io", "like", "snake");
    expect(loadProfile("ana@x.io").counts.like).toBe(1);
    expect(loadProfile("bob@x.io").counts.like).toBe(0);
  });
});

describe("profile settings", () => {
  it("saves and removes the avatar", () => {
    saveAvatar(EMAIL, { icon: "pets", color: 2 });
    expect(loadProfile(EMAIL).avatar).toEqual({ icon: "pets", color: 2 });
    saveAvatar(EMAIL, undefined);
    expect(loadProfile(EMAIL).avatar).toBeUndefined();
  });

  it("clearing history keeps counts and badges; reset wipes everything", () => {
    recordActivity(EMAIL, "view", "snake");
    clearHistory(EMAIL);
    expect(loadProfile(EMAIL).history).toEqual([]);
    expect(loadProfile(EMAIL).unlocked).toHaveProperty("explorer");
    resetProfile(EMAIL);
    expect(loadProfile(EMAIL).counts.view).toBe(0);
  });
});

describe("parseProfile", () => {
  it("falls back to an empty profile for missing or broken data", () => {
    for (const raw of [undefined, "{", "[]", "42"]) {
      expect(parseProfile(raw).counts).toEqual({ view: 0, favorite: 0, comment: 0, like: 0 });
    }
  });

  it("ignores avatars outside the presets", () => {
    for (const avatar of [
      { icon: "<b>x</b>", color: 1 },
      { icon: "pets", color: 9 },
    ]) {
      expect(parseProfile(JSON.stringify({ avatar })).avatar).toBeUndefined();
    }
  });

  it("drops invalid fields but keeps valid ones", () => {
    const raw = JSON.stringify({
      counts: { view: 3, like: -1, comment: "x" },
      games: ["a", 1, "a"],
      history: [
        { type: "view", slug: "a", at: 1 },
        { type: "bad", slug: "b", at: 2 },
      ],
      unlocked: { explorer: 5, nope: 6 },
      avatar: { icon: "pets", color: -2 },
    });
    const profile = parseProfile(raw);
    expect(profile.counts).toEqual({ view: 3, favorite: 0, comment: 0, like: 0 });
    expect(profile.games).toEqual(["a"]);
    expect(profile.history).toHaveLength(1);
    expect(profile.unlocked).toEqual({ explorer: 5 });
    expect(profile.avatar).toBeUndefined();
  });
});
