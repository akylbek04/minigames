export type GameCategory = "puzzle" | "card" | "match" | "farm" | "strategy" | "arcade";

export interface Game {
  slug: string;
  name: string;
  category: GameCategory;
  price: string;
  shortDescription: string;
  rating: number;
  likesCount: number;
  cardImage: string;
  featured: boolean;
}

export interface Category {
  slug: GameCategory | "all";
  label: string;
  isDefault: boolean;
}
