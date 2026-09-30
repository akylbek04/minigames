import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import "./sort-menu.scss";

const SORT_OPTIONS = ["Rating ↑", "Rating ↓", "Name A→Z", "Name Z→A"];
const DEFAULT_OPTION = "Rating ↓";

// Sorting itself arrives with the API in Story 3; for now choosing an option
// only updates what the control shows.
export function createSortMenu(): HTMLElement {
  const label = el("span", {}, [DEFAULT_OPTION]);

  const toggle = el(
    "button",
    {
      type: "button",
      class: "sort-menu__toggle",
      popovertarget: "sort-menu-options",
      "aria-haspopup": "menu",
    },
    ["Sort by: ", label],
  );

  const options = SORT_OPTIONS.map((option) =>
    el(
      "button",
      {
        type: "button",
        class: "sort-menu__option",
        role: "menuitemradio",
        "aria-checked": String(option === DEFAULT_OPTION),
      },
      [materialIcon("check", "sort-menu__check"), option],
    ),
  );

  // popover gives outside-click and Esc dismissal for free.
  const menu = el(
    "ul",
    {
      id: "sort-menu-options",
      class: "sort-menu__options",
      role: "menu",
      "aria-label": "Sort games by",
      popover: "auto",
    },
    options.map((option) => el("li", { role: "none" }, [option])),
  );

  for (const [index, option] of options.entries()) {
    option.addEventListener("click", () => {
      for (const other of options) {
        other.setAttribute("aria-checked", String(other === option));
      }
      label.textContent = SORT_OPTIONS[index];
      menu.hidePopover();
    });
  }

  menu.addEventListener("toggle", () => {
    toggle.setAttribute("aria-expanded", String(menu.matches(":popover-open")));
  });

  return el("div", { class: "sort-menu" }, [toggle, menu]);
}
