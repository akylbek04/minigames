import "../styles/globals.scss";
import { createHeader } from "../components/header/header";
import { createBurgerMenu } from "../components/burger-menu/burger-menu";
import { createAuthDialog } from "../components/auth-dialog/auth-dialog";
import { createFooter } from "../components/footer/footer";
import { createGameDetailsDialog } from "../components/game-details-dialog/game-details-dialog";
import { createHomePage } from "../pages/home/home-page";
import { createLibraryPage } from "../pages/library/library-page";
import { onNavigate, type Page } from "../utils/navigation";

const gameDetailsDialog = createGameDetailsDialog();

// Both pages are built once and swapped, so each keeps its UI state (active
// chip, sort, pagination) across visits.
const pages: Record<Page, HTMLElement> = {
  home: createHomePage({ onOpenDetails: gameDetailsDialog.open }),
  library: createLibraryPage({ onOpenDetails: gameDetailsDialog.open }),
};

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
  gameDetailsDialog.dialog,
  pages.home,
  createFooter(),
);

onNavigate((page) => app.querySelector("main")?.replaceWith(pages[page]));

document.body.append(app);
