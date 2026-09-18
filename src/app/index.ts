import "../styles/globals.scss";
import { createHeader } from "../components/header/header";
import { createBurgerMenu } from "../components/burger-menu/burger-menu";
import { createAuthDialog } from "../components/auth-dialog/auth-dialog";
import { createHero } from "../components/hero/hero";
import { createCarousel } from "../components/carousel/carousel";
import { createLeaderboard } from "../components/leaderboard/leaderboard";
import { createGameDevSection } from "../components/game-dev-section/game-dev-section";
import { createFooter } from "../components/footer/footer";

const app = document.createElement("div");
app.id = "app";

const authDialog = createAuthDialog();
const burgerMenu = createBurgerMenu({ onOpenAuth: authDialog.open });

app.append(
  createHeader({
    onOpenAuth: authDialog.open,
    menuToggle: burgerMenu.toggleButton,
  }),
  burgerMenu.dialog,
  authDialog.dialog,
  createHero(),
  createCarousel(),
  createLeaderboard(),
  createGameDevSection(),
  createFooter(),
);

document.body.append(app);
