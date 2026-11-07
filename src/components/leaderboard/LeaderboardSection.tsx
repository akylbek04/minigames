import { fetchLeaderboard } from "../../api/minigames-api";
import type { LeaderboardEntry } from "../../types/leaderboard";
import { formatCompactNumber } from "../../utils/format";
import { AsyncContent } from "../feedback/AsyncContent";
import { EmptyState } from "../feedback/EmptyState";
import { Skeleton, SkeletonGroup } from "../feedback/Skeletons";
import "./leaderboard.scss";

// Tablet and mobile headers use the mockup's shorter labels where given.
const COLUMNS: { label: string; shortLabel?: string; className: string }[] = [
  { label: "Rank", className: "leaderboard__col-rank" },
  { label: "Player", className: "leaderboard__col-player" },
  { label: "Games Played", shortLabel: "Games", className: "leaderboard__col-games" },
  { label: "Total Score", shortLabel: "Score", className: "leaderboard__col-score" },
  { label: "Streak", className: "leaderboard__col-streak" },
  { label: "Favorite Game", className: "leaderboard__col-favorite" },
];

// Desktop shows all 5 rows; tablet and mobile only show the top 3.
const EXTRA_ROW_START_INDEX = 3;
const SKELETON_ROW_COUNT = 5;

// The mock data has no "initials" field, so derive it from the player name's
// word boundaries (camelCase or underscore-separated): "CozyGamer_x" -> "CG".
function getPlayerInitials(playerName: string): string {
  const words = playerName.match(/[A-Z]?[a-z0-9]+|[A-Z]+(?![a-z])/g) ?? [playerName];
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

const rowClass = (index: number): string =>
  index >= EXTRA_ROW_START_INDEX ? "leaderboard__row leaderboard__row--extra" : "leaderboard__row";

function HeadRow() {
  return (
    <tr>
      {COLUMNS.map(({ label, shortLabel, className }) => (
        <th key={label} scope="col" className={className}>
          {shortLabel ? (
            <>
              <span className="leaderboard__label-short">{shortLabel}</span>
              <span className="leaderboard__label-full">{label}</span>
            </>
          ) : (
            label
          )}
        </th>
      ))}
    </tr>
  );
}

function Row({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  return (
    <tr className={rowClass(index)}>
      <td className="leaderboard__col-rank">#{entry.rank}</td>
      <td className="leaderboard__col-player">
        <div className="leaderboard__player">
          <span className={`leaderboard__avatar leaderboard__avatar--${(index % 5) + 1}`}>
            {getPlayerInitials(entry.playerName)}
          </span>
          <span className="leaderboard__username">{entry.playerName}</span>
        </div>
      </td>
      <td className="leaderboard__col-games">{entry.gamesPlayed}</td>
      <td className="leaderboard__col-score">
        <span className="leaderboard__score-compact">{formatCompactNumber(entry.totalScore)}</span>
        <span className="leaderboard__score-full">{entry.totalScore.toLocaleString("en-US")}</span>
      </td>
      <td className="leaderboard__col-streak">
        <span className="leaderboard__streak">
          🔥 <span className="leaderboard__streak-compact">{entry.streakDays}d</span>
          <span className="leaderboard__streak-full">{entry.streakDays} days</span>
        </span>
      </td>
      <td className="leaderboard__col-favorite">
        <span className="leaderboard__badge">{entry.favoriteGameName}</span>
      </td>
    </tr>
  );
}

// The real header over rows of shimmering cells, as many rows as the
// leaderboard shows (the extra ones hide on smaller screens like real rows).
function LeaderboardSkeleton() {
  return (
    <SkeletonGroup label="Loading top players…">
      <table className="leaderboard__table" aria-hidden="true">
        <thead>
          <HeadRow />
        </thead>
        <tbody>
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
            <tr key={index} className={rowClass(index)}>
              {COLUMNS.map(({ label, className }) => (
                <td key={label} className={className}>
                  <Skeleton className="leaderboard__skeleton-cell" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </SkeletonGroup>
  );
}

export function LeaderboardSection() {
  return (
    <section className="leaderboard" aria-label="Top Players This Week">
      <div className="leaderboard__inner">
        {/* Mobile shortens the heading to "Top Players", as in the mockup. */}
        <h2 className="leaderboard__title">
          <span>
            Top Players<span className="leaderboard__title-suffix"> This Week</span>
          </span>
        </h2>
        <AsyncContent<LeaderboardEntry[]>
          subject="top players"
          requestKey="leaderboard"
          request={fetchLeaderboard}
          renderLoading={() => <LeaderboardSkeleton />}
          renderData={(entries) => (
            <table className="leaderboard__table">
              <thead>
                <HeadRow />
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <Row key={entry.rank} entry={entry} index={index} />
                ))}
              </tbody>
            </table>
          )}
          isEmpty={(entries) => entries.length === 0}
          renderEmpty={() => (
            <EmptyState
              title="No players yet"
              message="Play a game this week to be the first on the leaderboard."
              icon="emoji_events"
            />
          )}
        />
      </div>
    </section>
  );
}
