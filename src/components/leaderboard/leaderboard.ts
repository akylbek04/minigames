import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { leaderboard } from "../../assets/data/leaderboard";
import type { LeaderboardEntry } from "../../types/leaderboard";
import "./leaderboard.scss";

const COLUMN_HEADINGS = [
  "Rank",
  "Player",
  "Games Played",
  "Total Score",
  "Streak",
  "Favorite Game",
];

function createRow(entry: LeaderboardEntry, index: number): HTMLElement {
  const avatar = el(
    "span",
    { class: `leaderboard__avatar leaderboard__avatar--${(index % 5) + 1}` },
    [entry.initials],
  );

  const player = el("td", { class: "leaderboard__player" }, [
    avatar,
    el("span", {}, [entry.playerName]),
  ]);

  const streak = el("span", { class: "leaderboard__streak" }, [
    materialIcon("local_fire_department", "leaderboard__streak-icon icon--filled"),
    `${entry.streakDays} days`,
  ]);

  const favoriteGame = el("span", { class: "leaderboard__badge" }, [entry.favoriteGameName]);

  return el("tr", { class: "leaderboard__row" }, [
    el("td", { class: "leaderboard__rank" }, [`#${entry.rank}`]),
    player,
    el("td", { class: "leaderboard__col-games" }, [String(entry.gamesPlayed)]),
    el("td", {}, [entry.totalScore.toLocaleString("en-US")]),
    el("td", {}, [streak]),
    el("td", { class: "leaderboard__col-favorite" }, [favoriteGame]),
  ]);
}

export function createLeaderboard(): HTMLElement {
  const title = el("h2", { class: "leaderboard__title" }, ["Top Players This Week"]);

  const headRow = el(
    "tr",
    {},
    COLUMN_HEADINGS.map((heading, index) =>
      el(
        "th",
        {
          scope: "col",
          ...(index === 2 && { class: "leaderboard__col-games" }),
          ...(index === 5 && { class: "leaderboard__col-favorite" }),
        },
        [heading],
      ),
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
