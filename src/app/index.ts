import "../styles/globals.scss";
import { createHeader } from "../components/header/header";
import { createBurgerMenu } from "../components/burger-menu/burger-menu";
import { createAuthDialog } from "../components/auth-dialog/auth-dialog";
import { createFooter } from "../components/footer/footer";
import { createHomePage } from "../pages/home/home-page";

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
  createHomePage(),
  createFooter(),
);

document.body.append(app);
