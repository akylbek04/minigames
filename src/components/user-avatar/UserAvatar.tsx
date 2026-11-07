import { useState } from "react";
import { getInitials, getProfileName } from "../../auth/profile";
import type { AuthProfile } from "../../auth/auth-service";
import { useProfile } from "../../hooks/use-profile";
import { MaterialIcon } from "../icons/MaterialIcon";
import "./user-avatar.scss";

// The avatar the user picked on the Profile page; else the profile photo
// when there is one that loads; otherwise the name's initials, or a generic
// person icon when the name has no letters or digits.
export function UserAvatar({
  profile,
  className = "",
}: {
  profile: AuthProfile;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const custom = useProfile(profile.email)?.avatar;
  const classes = `user-avatar ${className}`.trim();

  if (custom) {
    return (
      <span className={`${classes} user-avatar--color-${custom.color + 1}`} aria-hidden="true">
        <MaterialIcon name={custom.icon} />
      </span>
    );
  }
  if (profile.avatarUrl && profile.avatarUrl !== failedUrl) {
    // Google photo URLs refuse requests that carry a foreign referrer.
    return (
      <img
        className={classes}
        src={profile.avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(profile.avatarUrl)}
      />
    );
  }
  const initials = getInitials(getProfileName(profile));
  return (
    <span className={classes} aria-hidden="true">
      {initials || <MaterialIcon name="person" />}
    </span>
  );
}
