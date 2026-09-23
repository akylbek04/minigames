import "../styles/globals.scss";
import { createHeader } from "../components/header/header";
import { createBurgerMenu } from "../components/burger-menu/burger-menu";
import { createAuthDialog } from "../components/auth-dialog/auth-dialog";
import { createFooter } from "../components/footer/footer";
import { createHomePage } from "../pages/home/home-page";
import { createLibraryPage } from "../pages/library/library-page";
import { onNavigate, type Page } from "../utils/navigation";

// Both pages are built once and swapped, so each keeps its UI state (active
// chip, sort, pagination) across visits.
const pages: Record<Page, HTMLElement> = {
  home: createHomePage(),
  // The Game Details dialog is wired in with its own task.
  library: createLibraryPage({ onOpenDetails: () => {} }),
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
  pages.home,
  createFooter(),
);

onNavigate((page) => app.querySelector("main")?.replaceWith(pages[page]));

document.body.append(app);
