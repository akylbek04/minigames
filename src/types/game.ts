export interface Game {
  slug: string;
  name: string;
  category: string;
  price: string;
  shortDescription: string;
  rating: number;
  likesCount: number;
  cardImage: string;
  // Only the Story 2 mock data carries this; the API marks featured games
  // through the `featured=true` query instead.
  featured?: boolean;
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
