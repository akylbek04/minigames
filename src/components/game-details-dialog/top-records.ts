import { el } from "../../utils/dom";
import { formatRelativeTime } from "../../utils/format";
import type { TopRecord } from "../../types/game-details";

const MEDALS = ["🥇", "🥈", "🥉"];

// Informational only: no interactive elements in this section.
export function createTopRecords(records: TopRecord[]): HTMLElement {
  return el(
    "section",
    { class: "game-details__section", "aria-labelledby": "game-details-records-title" },
    [
      el("h3", { id: "game-details-records-title", class: "game-details__section-title" }, [
        el("span", { class: "game-details__trophy", "aria-hidden": "true" }, ["🏆"]),
        "Top Records",
      ]),
      el(
        "ol",
        { class: "game-details__records" },
        records.map((record) =>
          el("li", { class: "game-details__record" }, [
            el("span", { class: "game-details__medal", "aria-hidden": "true" }, [
              MEDALS[record.position - 1] ?? "",
            ]),
            el("span", { class: "game-details__record-player" }, [record.playerName]),
            el("span", { class: "game-details__record-score" }, [
              `${record.score.toLocaleString("en")} pts`,
            ]),
            el("time", { class: "game-details__record-date", datetime: record.achievedAt }, [
              formatRelativeTime(record.achievedAt),
            ]),
          ]),
        ),
      ),
    ],
  );
}
