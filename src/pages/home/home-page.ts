import { el } from "../../utils/dom";
import { createHero } from "../../components/hero/hero";
import { createCarousel } from "../../components/carousel/carousel";
import { createLeaderboard } from "../../components/leaderboard/leaderboard";
import { createGameDevSection } from "../../components/game-dev-section/game-dev-section";
import type { AppPage } from "../app-page";

export interface HomePageCallbacks {
  onOpenDetails: (slug: string) => void;
}

export function createHomePage({ onOpenDetails }: HomePageCallbacks): AppPage {
  const carousel = createCarousel({ onOpenDetails });
  const leaderboard = createLeaderboard();
  const state = { hasLoaded: false };

  const element = el("main", { class: "home-page" }, [
    createHero(),
    carousel.element,
    leaderboard.element,
    createGameDevSection(),
  ]);

  return {
    element,
    // Data is requested the first time Home is shown, not when the app opens
    // on another page; a failed section keeps its own retry button.
    show: () => {
      if (state.hasLoaded) {
        return;
      }
      state.hasLoaded = true;
      carousel.load();
      leaderboard.load();
    },
  };
}
