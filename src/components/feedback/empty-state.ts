import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import "./empty-state.scss";

export interface EmptyStateOptions {
  title: string;
  message: string;
  icon?: string;
  action?: { label: string; onClick: () => void };
}

// Shown when a request succeeds but there is nothing to display - a calm,
// neutral placeholder, deliberately unlike the red error banner.
export function createEmptyState({
  title,
  message,
  icon = "search_off",
  action,
}: EmptyStateOptions): HTMLElement {
  const children: Node[] = [
    materialIcon(icon, "empty-state__icon"),
    el("p", { class: "empty-state__title" }, [title]),
    el("p", { class: "empty-state__message" }, [message]),
  ];

  if (action) {
    const button = el("button", { type: "button", class: "btn btn--outline" }, [action.label]);
    button.addEventListener("click", action.onClick);
    children.push(button);
  }

  return el("div", { class: "empty-state", role: "status" }, children);
}
