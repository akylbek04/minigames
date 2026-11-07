import type { TopRecord } from "../../types/game-details";
import { formatRelativeTime } from "../../utils/format";
import { EmptyState } from "../feedback/EmptyState";

const MEDALS = ["🥇", "🥈", "🥉"];

// Informational only: no interactive elements in this section.
export function TopRecords({ records }: { records: TopRecord[] }) {
  return (
    <section className="game-details__section" aria-labelledby="game-details-records-title">
      <h3 id="game-details-records-title" className="game-details__section-title">
        <span className="game-details__trophy" aria-hidden="true">
          🏆
        </span>
        Top Records
      </h3>
      {records.length === 0 ? (
        <EmptyState
          title="No records yet"
          message="Nobody has set a score in this game so far."
          icon="emoji_events"
        />
      ) : (
        <ol className="game-details__records">
          {records.map((record) => (
            <li key={record.position} className="game-details__record">
              <span className="game-details__medal" aria-hidden="true">
                {MEDALS[record.position - 1] ?? ""}
              </span>
              <span className="game-details__record-player">{record.playerName}</span>
              <span className="game-details__record-score">
                {record.score.toLocaleString("en")} pts
              </span>
              <time className="game-details__record-date" dateTime={record.achievedAt}>
                {formatRelativeTime(record.achievedAt)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
