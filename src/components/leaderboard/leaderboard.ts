import { el } from "../../utils/dom";
import { formatCompactNumber } from "../../utils/format";
import leaderboardData from "../../assets/data/leaderboard.json";
import type { LeaderboardEntry } from "../../types/leaderboard";
import "./leaderboard.scss";

const leaderboard = leaderboardData.data as LeaderboardEntry[];

const COLUMNS = [
  { label: "Rank", class: "leaderboard__col-rank" },
  { label: "Player", class: "leaderboard__col-player" },
  { label: "Games Played", class: "leaderboard__col-games" },
  { label: "Total Score", class: "leaderboard__col-score" },
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

export function createLeaderboard(): HTMLElement {
  const title = el("h2", { class: "leaderboard__title" }, ["Top Players This Week"]);

  const headRow = el(
    "tr",
    {},
    COLUMNS.map(({ label, class: columnClass }) =>
      el("th", { scope: "col", class: columnClass }, [label]),
    ),
  );

  const table = el("table", { class: "leaderboard__table" }, [
    el("thead", {}, [headRow]),
    el(
      "tbody",
      {},
      leaderboard.map((entry, index) => createRow(entry, index)),
    ),
  ]);

  return el("section", { class: "leaderboard", "aria-label": "Top Players This Week" }, [
    el("div", { class: "leaderboard__inner" }, [title, table]),
  ]);
}
