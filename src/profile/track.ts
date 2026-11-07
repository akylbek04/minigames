import { showSnackbar } from "../components/snackbar/snackbar";
import type { AppSession } from "../auth/session";
import type { ActivityType } from "./achievements";
import { recordActivity } from "./profile-store";

// Called after a successful action only; announces any new badge.
export function trackActivity(
  session: AppSession,
  type: ActivityType,
  slug: string,
  itemId = slug,
): void {
  for (const { title } of recordActivity(session.email, type, slug, Date.now(), itemId)) {
    showSnackbar(`Achievement unlocked: ${title}!`, "success");
  }
}
