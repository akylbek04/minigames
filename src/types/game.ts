export interface Game {
  slug: string;
  name: string;
  category: string;
  price: string;
  shortDescription: string;
  rating: number;
  likesCount: number;
  cardImage: string;
}

export interface Category {
  slug: string;
  label: string;
  isDefault: boolean;
}

export type SortOption = "rating-desc" | "rating-asc" | "name-asc" | "name-desc";

export interface GamesQuery {
  category: string;
  sort: string;
  page: string;
}

export interface GamesPageMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}
