import { el } from "../../utils/dom";
import "./library-page.scss";

export function createLibraryPage(): HTMLElement {
  const intro = el("div", { class: "library-page__intro" }, [
    el("h1", { class: "library-page__title" }, ["Game Library"]),
    el("p", { class: "library-page__subtitle" }, ["Browse our collection of casual mini-games"]),
  ]);

  return el("main", { class: "library-page" }, [
    el("div", { class: "library-page__inner" }, [intro]),
  ]);
}
