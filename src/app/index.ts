import "../styles/globals.scss";
import { createHeader } from "../components/header/header";
import { createBurgerMenu } from "../components/burger-menu/burger-menu";
import { createHero } from "../components/hero/hero";
import { createCarousel } from "../components/carousel/carousel";
import { createLeaderboard } from "../components/leaderboard/leaderboard";
import { createGameDevSection } from "../components/game-dev-section/game-dev-section";
import { createFooter } from "../components/footer/footer";

const app = document.createElement("div");
app.id = "app";

const burgerMenu = createBurgerMenu({
  onOpenAuth: () => {},
});

app.append(
  createHeader({
    onOpenAuth: () => {},
    menuToggle: burgerMenu.toggleButton,
  }),
  burgerMenu.dialog,
  createHero(),
  createCarousel(),
  createLeaderboard(),
  createGameDevSection(),
  createFooter(),
);

document.body.append(app);
