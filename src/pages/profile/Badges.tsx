import { MaterialIcon } from "../../components/icons/MaterialIcon";
import { ACHIEVEMENTS } from "../../profile/achievements";
import type { ProfileData } from "../../profile/profile-store";
import { formatRelativeTime } from "../../utils/format";

export function Badges({ data }: { data: ProfileData }) {
  return (
    <ul className="profile-page__badges">
      {ACHIEVEMENTS.map(({ id, title, description, icon }) => {
        const unlockedAt = data.unlocked[id] as number | undefined;
        const isUnlocked = unlockedAt !== undefined;
        return (
          <li
            key={id}
            className={`profile-page__badge${isUnlocked ? "" : " profile-page__badge--locked"}`}
            data-achievement={id}
          >
            <MaterialIcon name={isUnlocked ? icon : "lock"} className="profile-page__badge-icon" />
            <h3 className="profile-page__badge-title">{title}</h3>
            <p className="profile-page__badge-text">{description}</p>
            <p className="profile-page__badge-status">
              {isUnlocked
                ? `Unlocked ${formatRelativeTime(new Date(unlockedAt).toISOString())}`
                : "Locked"}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
