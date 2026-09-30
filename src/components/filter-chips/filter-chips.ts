import { el } from "../../utils/dom";
import { enableDragScroll } from "../../utils/drag-scroll";
import categoriesData from "../../assets/data/categories.json";
import type { Category } from "../../types/game";
import "./filter-chips.scss";

const categories = categoriesData.data as Category[];

// Filtering itself arrives with the API in Story 3; for now a chip only
// becomes the single active one.
export function createFilterChips(): HTMLElement {
  const chips = categories.map((category) =>
    el(
      "button",
      {
        type: "button",
        class: "filter-chips__chip",
        "aria-pressed": String(category.isDefault),
      },
      [category.label],
    ),
  );

  const list = el(
    "ul",
    { class: "filter-chips" },
    chips.map((chip) => el("li", {}, [chip])),
  );

  enableDragScroll(list);

  list.addEventListener("click", (event) => {
    const chip = event.target instanceof Element && event.target.closest("button");
    if (!chip) {
      return;
    }
    for (const other of chips) {
      other.setAttribute("aria-pressed", String(other === chip));
    }
  });

  return el(
    "div",
    { class: "filter-chips__wrapper", role: "group", "aria-label": "Game categories" },
    [list],
  );
}
