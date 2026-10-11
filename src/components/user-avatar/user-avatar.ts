import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { getInitials, getProfileName } from "../../auth/profile";
import type { AuthProfile } from "../../auth/auth-service";
import "./user-avatar.scss";

// The profile photo when there is one that loads; otherwise the name's
// initials, or a generic person icon when the name has no letters or digits.
export function createUserAvatar(profile: AuthProfile, className = ""): HTMLElement {
  const classes = `user-avatar ${className}`.trim();

  function createFallback(): HTMLElement {
    const initials = getInitials(getProfileName(profile));
    return el("span", { class: classes, "aria-hidden": "true" }, [
      initials || materialIcon("person"),
    ]);
  }

  if (!profile.avatarUrl) {
    return createFallback();
  }
  // Google photo URLs refuse requests that carry a foreign referrer.
  const image = el("img", {
    class: classes,
    src: profile.avatarUrl,
    alt: "",
    referrerpolicy: "no-referrer",
  });
  image.addEventListener("error", () => image.replaceWith(createFallback()), { once: true });
  return image;
}
