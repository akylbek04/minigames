import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import type { SortOption } from "../../types/game";
import "./sort-menu.scss";

// API sort values with the labels the mockup shows for them.
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "rating-asc", label: "Rating ↑" },
  { value: "rating-desc", label: "Rating ↓" },
  { value: "name-asc", label: "Name A→Z" },
  { value: "name-desc", label: "Name Z→A" },
];

export const DEFAULT_SORT: SortOption = "rating-desc";

export interface SortMenuOptions {
  // Choosing only reports the value; the URL then decides what is shown.
  onSelect: (value: SortOption) => void;
}

export interface SortMenu {
  element: HTMLElement;
  setValue: (value: string) => void;
}

export function createSortMenu({ onSelect }: SortMenuOptions): SortMenu {
  const label = el("span", {});

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

  const options = SORT_OPTIONS.map(({ value, label: optionLabel }) =>
    el(
      "button",
      { type: "button", class: "sort-menu__option", role: "menuitemradio", "data-value": value },
      [materialIcon("check", "sort-menu__check"), optionLabel],
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
      menu.hidePopover();
      onSelect(SORT_OPTIONS[index].value);
    });
  }

  menu.addEventListener("toggle", () => {
    toggle.setAttribute("aria-expanded", String(menu.matches(":popover-open")));
  });

  // An unknown value from the URL checks nothing; the list then shows the
  // Data Not Found state for it.
  function setValue(value: string): void {
    for (const option of options) {
      option.setAttribute("aria-checked", String(option.dataset.value === value));
    }
    label.textContent = SORT_OPTIONS.find((option) => option.value === value)?.label ?? "—";
  }

  setValue(DEFAULT_SORT);

  return { element: el("div", { class: "sort-menu" }, [toggle, menu]), setValue };
}
