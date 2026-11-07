import { useRef, useState } from "react";
import type { SortOption } from "../../types/game";
import { MaterialIcon } from "../icons/MaterialIcon";
import "./sort-menu.scss";

// API sort values with the labels the mockup shows for them.
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "rating-asc", label: "Rating ↑" },
  { value: "rating-desc", label: "Rating ↓" },
  { value: "name-asc", label: "Name A→Z" },
  { value: "name-desc", label: "Name Z→A" },
];

export const DEFAULT_SORT: SortOption = "rating-desc";

interface SortMenuProps {
  value: string;
  // Choosing only reports the value; the URL then decides what is shown.
  onSelect: (value: SortOption) => void;
}

export function SortMenu({ value, onSelect }: SortMenuProps) {
  const menu = useRef<HTMLUListElement>(null);
  const [isExpanded, setExpanded] = useState(false);
  // An unknown value from the URL checks nothing; the list then shows the
  // Data Not Found state for it.
  const label = SORT_OPTIONS.find((option) => option.value === value)?.label ?? "—";

  return (
    <div className="sort-menu">
      <button
        type="button"
        className="sort-menu__toggle"
        popoverTarget="sort-menu-options"
        aria-haspopup="menu"
        aria-expanded={isExpanded}
      >
        Sort by: <span>{label}</span>
      </button>
      {/* popover gives outside-click and Esc dismissal for free. */}
      <ul
        ref={menu}
        id="sort-menu-options"
        className="sort-menu__options"
        role="menu"
        aria-label="Sort games by"
        popover="auto"
        onToggle={(event) => setExpanded(event.currentTarget.matches(":popover-open"))}
      >
        {SORT_OPTIONS.map((option) => (
          <li key={option.value} role="none">
            <button
              type="button"
              className="sort-menu__option"
              role="menuitemradio"
              aria-checked={option.value === value}
              data-value={option.value}
              onClick={() => {
                menu.current?.hidePopover();
                onSelect(option.value);
              }}
            >
              <MaterialIcon name="check" className="sort-menu__check" />
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
