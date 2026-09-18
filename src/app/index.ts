import "../styles/globals.scss";
import { createHeader } from "../components/header/header";
import { createHero } from "../components/hero/hero";

const app = document.createElement("div");
app.id = "app";

app.append(
  createHeader({
    onOpenAuth: () => {},
    onOpenMenu: () => {},
  }),
  createHero(),
);

document.body.append(app);
