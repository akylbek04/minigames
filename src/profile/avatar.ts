// Avatars are picked from these presets only; stored values outside them
// are ignored, so nothing free-form ever reaches the DOM.
export const AVATAR_ICONS = [
  "sports_esports",
  "stadia_controller",
  "rocket_launch",
  "pets",
  "bolt",
  "local_fire_department",
  "emoji_nature",
  "diamond",
] as const;

// The avatar-random-1…5 color tokens.
export const AVATAR_COLOR_COUNT = 5;

export function isAvatarIcon(value: string): boolean {
  return (AVATAR_ICONS as readonly string[]).includes(value);
}
