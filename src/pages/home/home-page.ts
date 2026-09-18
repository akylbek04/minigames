import { el } from "../../utils/dom";
import { createHero } from "../../components/hero/hero";
import { createCarousel } from "../../components/carousel/carousel";
import { createLeaderboard } from "../../components/leaderboard/leaderboard";
import { createGameDevSection } from "../../components/game-dev-section/game-dev-section";

export function createHomePage(): HTMLElement {
  return el("main", { class: "home-page" }, [
    createHero(),
    createCarousel(),
    createLeaderboard(),
    createGameDevSection(),
  ]);
}
