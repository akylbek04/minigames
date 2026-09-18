import "../styles/globals.scss";
import { createHeader } from "../components/header/header";
import { createHero } from "../components/hero/hero";
import { createCarousel } from "../components/carousel/carousel";
import { createLeaderboard } from "../components/leaderboard/leaderboard";

const app = document.createElement("div");
app.id = "app";

app.append(
  createHeader({
    onOpenAuth: () => {},
    onOpenMenu: () => {},
  }),
  createHero(),
  createCarousel(),
  createLeaderboard(),
);

document.body.append(app);
