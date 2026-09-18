import "../styles/globals.scss";
import { createHeader } from "../components/header/header";
import { createHero } from "../components/hero/hero";
import { createCarousel } from "../components/carousel/carousel";

const app = document.createElement("div");
app.id = "app";

app.append(
  createHeader({
    onOpenAuth: () => {},
    onOpenMenu: () => {},
  }),
  createHero(),
  createCarousel(),
);

document.body.append(app);
