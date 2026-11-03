export type ActivityType = "view" | "favorite" | "comment" | "like";

// Everything the achievements are computed from; stored per user.
export interface ProfileStats {
  counts: Record<ActivityType, number>;
  // Slugs of the distinct games the user has opened.
  games: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  // Material Symbols icon name.
  icon: string;
  isUnlocked: (stats: ProfileStats) => boolean;
}

const atLeast = (type: ActivityType, n: number) => (stats: ProfileStats) => stats.counts[type] >= n;
const gamesAtLeast = (n: number) => (stats: ProfileStats) => stats.games.length >= n;

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "explorer",
    title: "Explorer",
    description: "Open your first game.",
    icon: "explore",
    isUnlocked: gamesAtLeast(1),
  },
  {
    id: "scout",
    title: "Scout",
    description: "Open 5 different games.",
    icon: "travel_explore",
    isUnlocked: gamesAtLeast(5),
  },
  {
    id: "completionist",
    title: "Completionist",
    description: "Open 10 different games.",
    icon: "workspace_premium",
    isUnlocked: gamesAtLeast(10),
  },
  {
    id: "fan",
    title: "Fan",
    description: "Add a game to your favorites.",
    icon: "favorite",
    isUnlocked: atLeast("favorite", 1),
  },
  {
    id: "superfan",
    title: "Superfan",
    description: "Add 5 games to your favorites.",
    icon: "stars",
    isUnlocked: atLeast("favorite", 5),
  },
  {
    id: "critic",
    title: "Critic",
    description: "Post your first comment.",
    icon: "chat_bubble",
    isUnlocked: atLeast("comment", 1),
  },
  {
    id: "voice",
    title: "Community Voice",
    description: "Post 5 comments.",
    icon: "forum",
    isUnlocked: atLeast("comment", 5),
  },
  {
    id: "supporter",
    title: "Supporter",
    description: "Like a comment.",
    icon: "thumb_up",
    isUnlocked: atLeast("like", 1),
  },
  {
    id: "cheerleader",
    title: "Cheerleader",
    description: "Like 10 comments.",
    icon: "celebration",
    isUnlocked: atLeast("like", 10),
  },
  {
    id: "all-rounder",
    title: "All-Rounder",
    description: "Favorite a game, comment and like a comment.",
    icon: "emoji_events",
    isUnlocked: (stats) =>
      stats.counts.favorite > 0 && stats.counts.comment > 0 && stats.counts.like > 0,
  },
];

export function getUnlockedIds(stats: ProfileStats): string[] {
  return ACHIEVEMENTS.filter((achievement) => achievement.isUnlocked(stats)).map(({ id }) => id);
}
