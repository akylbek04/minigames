export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MAX_WEEKS = 3;

function pluralize(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}

// Whole calendar months between two dates, not counting an unfinished one.
function monthsBetween(from: Date, to: Date): number {
  const months = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth();
  return to.getDate() < from.getDate() ? months - 1 : months;
}

// RSS-QS-3-3-2 scale, always rounded down to whole units: "just now",
// "N min ago", "N hours ago", "N days ago", "N weeks ago" (1-3),
// "N months ago" (1-11), then "N years ago".
export function formatRelativeTime(isoDate: string, now = Date.now()): string {
  const date = new Date(isoDate);
  const elapsed = Math.max(0, now - date.getTime());
  if (Number.isNaN(elapsed)) {
    return "";
  }

  if (elapsed < MINUTE) {
    return "just now";
  }
  if (elapsed < HOUR) {
    return `${Math.floor(elapsed / MINUTE)} min ago`;
  }
  if (elapsed < DAY) {
    return pluralize(Math.floor(elapsed / HOUR), "hour");
  }
  if (elapsed < WEEK) {
    return pluralize(Math.floor(elapsed / DAY), "day");
  }

  const months = monthsBetween(date, new Date(now));
  if (months < 1) {
    return pluralize(Math.min(Math.floor(elapsed / WEEK), MAX_WEEKS), "week");
  }
  return months < 12 ? pluralize(months, "month") : pluralize(Math.floor(months / 12), "year");
}
