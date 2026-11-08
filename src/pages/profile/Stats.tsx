import { MaterialIcon } from "../../components/icons/MaterialIcon";
import type { ActivityType } from "../../profile/achievements";
import type { ProfileData } from "../../profile/profile-store";

const STAT_LABELS: [ActivityType | "games", string, string][] = [
  ["games", "Games opened", "videogame_asset"],
  ["favorite", "Favorites", "favorite"],
  ["comment", "Comments", "chat_bubble"],
  ["like", "Likes given", "thumb_up"],
];

export function Stats({ data }: { data: ProfileData }) {
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
