import type { AuthProfile } from "./auth-service";

const FALLBACK_NAME = "Player";
const AUTHOR_NAME_MIN = 2;
const AUTHOR_NAME_MAX = 30;
const ALPHANUMERIC = /[\p{L}\p{N}]/u;

function getEmailName(email: string): string {
  return email.split("@", 1)[0].trim();
}

// displayName, else the email's local part, else a generic name.
export function getProfileName({ displayName, email }: AuthProfile): string {
  return displayName.trim() || getEmailName(email) || FALLBACK_NAME;
}

// First letter or digit of the first one or two words, uppercased:
// "ana maria lopez" -> "AM", "Ömer" -> "Ö". Empty when there is none.
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => ALPHANUMERIC.exec(word)?.[0] ?? "")
    .join("")
    .toUpperCase();
}

// The comments API only accepts 2–30 character author names, which a
// Google displayName doesn't guarantee.
export function getCommentAuthorName({ displayName, email }: AuthProfile): string {
  return (
    [displayName.trim(), getEmailName(email)]
      .map((name) => name.slice(0, AUTHOR_NAME_MAX))
      .find((name) => name.length >= AUTHOR_NAME_MIN) ?? FALLBACK_NAME
  );
}
