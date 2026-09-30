import { el } from "../../utils/dom";
import { createHero } from "../../components/hero/hero";
import { createCarousel } from "../../components/carousel/carousel";
import { createLeaderboard } from "../../components/leaderboard/leaderboard";
import { createGameDevSection } from "../../components/game-dev-section/game-dev-section";

export interface HomePageCallbacks {
  onOpenDetails: () => void;
}

export function createHomePage({ onOpenDetails }: HomePageCallbacks): HTMLElement {
  return el("main", { class: "home-page" }, [
    createHero(),
    createCarousel({ onOpenDetails }),
    createLeaderboard(),
    createGameDevSection(),
  ]);
}
