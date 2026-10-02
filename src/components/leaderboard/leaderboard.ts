import { el } from "../../utils/dom";
import { formatCompactNumber } from "../../utils/format";
import { fetchLeaderboard } from "../../api/minigames-api";
import { createAsyncContent } from "../feedback/async-content";
import { createEmptyState } from "../feedback/empty-state";
import { createSkeleton, createSkeletonGroup } from "../feedback/skeleton";
import type { LeaderboardEntry } from "../../types/leaderboard";
import "./leaderboard.scss";

// Tablet and mobile headers use the mockup's shorter labels where given.
const COLUMNS: { label: string; shortLabel?: string; class: string }[] = [
  { label: "Rank", class: "leaderboard__col-rank" },
  { label: "Player", class: "leaderboard__col-player" },
  { label: "Games Played", shortLabel: "Games", class: "leaderboard__col-games" },
  { label: "Total Score", shortLabel: "Score", class: "leaderboard__col-score" },
  { label: "Streak", class: "leaderboard__col-streak" },
  { label: "Favorite Game", class: "leaderboard__col-favorite" },
];

// Desktop shows all 5 rows; tablet and mobile only show the top 3.
const EXTRA_ROW_START_INDEX = 3;

// The mock data has no "initials" field, so derive it from the player name's
// word boundaries (camelCase or underscore-separated): "CozyGamer_x" -> "CG".
function getInitials(playerName: string): string {
  const words = playerName.match(/[A-Z]?[a-z0-9]+|[A-Z]+(?![a-z])/g) ?? [playerName];
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function createScoreCell(score: number): HTMLElement[] {
  return [
    el("span", { class: "leaderboard__score-compact" }, [formatCompactNumber(score)]),
    el("span", { class: "leaderboard__score-full" }, [score.toLocaleString("en-US")]),
  ];
}

function createStreakCell(days: number): HTMLElement {
  return el("span", { class: "leaderboard__streak" }, [
    "🔥 ",
    el("span", { class: "leaderboard__streak-compact" }, [`${days}d`]),
    el("span", { class: "leaderboard__streak-full" }, [`${days} days`]),
  ]);
}

function createRow(entry: LeaderboardEntry, index: number): HTMLElement {
  const avatar = el(
    "span",
    { class: `leaderboard__avatar leaderboard__avatar--${(index % 5) + 1}` },
    [getInitials(entry.playerName)],
  );

  const player = el("td", { class: "leaderboard__col-player" }, [
    el("div", { class: "leaderboard__player" }, [
      avatar,
      el("span", { class: "leaderboard__username" }, [entry.playerName]),
    ]),
  ]);

  const favoriteGame = el("span", { class: "leaderboard__badge" }, [entry.favoriteGameName]);

  const rowClass =
    index >= EXTRA_ROW_START_INDEX
      ? "leaderboard__row leaderboard__row--extra"
      : "leaderboard__row";

  return el("tr", { class: rowClass }, [
    el("td", { class: "leaderboard__col-rank" }, [`#${entry.rank}`]),
    player,
    el("td", { class: "leaderboard__col-games" }, [String(entry.gamesPlayed)]),
    el("td", { class: "leaderboard__col-score" }, createScoreCell(entry.totalScore)),
    el("td", { class: "leaderboard__col-streak" }, [createStreakCell(entry.streakDays)]),
    el("td", { class: "leaderboard__col-favorite" }, [favoriteGame]),
  ]);
}

function createHeadRow(): HTMLElement {
  return el(
    "tr",
    {},
    COLUMNS.map(({ label, shortLabel, class: columnClass }) =>
      el(
        "th",
        { scope: "col", class: columnClass },
        shortLabel
          ? [
              el("span", { class: "leaderboard__label-short" }, [shortLabel]),
              el("span", { class: "leaderboard__label-full" }, [label]),
            ]
          : [label],
      ),
    ),
  );
}

function createTable(entries: LeaderboardEntry[]): HTMLElement {
  return el("table", { class: "leaderboard__table" }, [
    el("thead", {}, [createHeadRow()]),
    el(
      "tbody",
      {},
      entries.map((entry, index) => createRow(entry, index)),
    ),
  ]);
}

// The real header over rows of shimmering cells, as many rows as the
// leaderboard shows (the extra ones hide on smaller screens like real rows).
const SKELETON_ROW_COUNT = 5;

function createLeaderboardSkeleton(): Node {
  const rows = Array.from({ length: SKELETON_ROW_COUNT }, (_, index) =>
    el(
      "tr",
      {
        class:
          index >= EXTRA_ROW_START_INDEX
            ? "leaderboard__row leaderboard__row--extra"
            : "leaderboard__row",
      },
      COLUMNS.map(({ class: columnClass }) =>
        el("td", { class: columnClass }, [createSkeleton("leaderboard__skeleton-cell")]),
      ),
    ),
  );

  return createSkeletonGroup("Loading top players…", [
    el("table", { class: "leaderboard__table", "aria-hidden": "true" }, [
      el("thead", {}, [createHeadRow()]),
      el("tbody", {}, rows),
    ]),
  ]);
}

export interface Leaderboard {
  element: HTMLElement;
  load: () => void;
}

export function createLeaderboard(): Leaderboard {
  // Mobile shortens the heading to "Top Players", as in the mockup.
  // One inner span so the title mixin's flex gap doesn't split the words.
  const title = el("h2", { class: "leaderboard__title" }, [
    el("span", {}, [
      "Top Players",
      el("span", { class: "leaderboard__title-suffix" }, [" This Week"]),
    ]),
  ]);

  const content = createAsyncContent<LeaderboardEntry[]>({
    subject: "top players",
    renderLoading: createLeaderboardSkeleton,
    renderData: createTable,
    isEmpty: (entries) => entries.length === 0,
    renderEmpty: () =>
      createEmptyState({
        title: "No players yet",
        message: "Play a game this week to be the first on the leaderboard.",
        icon: "emoji_events",
      }),
  });

  const element = el("section", { class: "leaderboard", "aria-label": "Top Players This Week" }, [
    el("div", { class: "leaderboard__inner" }, [title, content.element]),
  ]);

  return { element, load: () => void content.load(fetchLeaderboard) };
}
