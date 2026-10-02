import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import "./snackbar.scss";

export type SnackbarVariant = "success" | "error" | "warning" | "info";

const ICONS: Record<SnackbarVariant, string> = {
  success: "check_circle",
  error: "error",
  warning: "warning",
  info: "info",
};

const AUTO_DISMISS_DELAY = 5000;
const MAX_VISIBLE = 3;

const region = el("div", { class: "snackbar-region", popover: "manual" });

// A manual popover lives in the top layer, so snackbars stay visible above
// open modal dialogs. Re-showing it moves it above any dialog opened since.
function showRegion(): HTMLElement {
  if (!region.isConnected) {
    document.body.append(region);
  }
  if (region.matches(":popover-open")) {
    region.hidePopover();
  }
  region.showPopover();
  return region;
}

function dismiss(snackbar: HTMLElement): void {
  if (snackbar.classList.contains("is-leaving")) {
    return;
  }
  snackbar.classList.add("is-leaving");
  // getAnimations() flushes styles, so the exit transition is already running
  // (or absent, with reduced motion) by the time we wait on it.
  void Promise.all(snackbar.getAnimations().map((animation) => animation.finished)).then(() => {
    const parent = snackbar.parentElement;
    snackbar.remove();
    if (parent && !parent.hasChildNodes() && parent.matches(":popover-open")) {
      parent.hidePopover();
    }
  });
}

// Non-blocking feedback that any part of the app can trigger; it never
// steals focus and disappears on its own.
export function showSnackbar(message: string, variant: SnackbarVariant = "info"): void {
  const host = showRegion();

  const closeButton = el(
    "button",
    { type: "button", class: "snackbar__close", "aria-label": "Dismiss notification" },
    [materialIcon("close")],
  );

  const snackbar = el(
    "div",
    { class: `snackbar snackbar--${variant}`, role: variant === "error" ? "alert" : "status" },
    [
      materialIcon(ICONS[variant], "snackbar__icon"),
      el("p", { class: "snackbar__message" }, [message]),
      closeButton,
    ],
  );

  const timerId = setTimeout(() => dismiss(snackbar), AUTO_DISMISS_DELAY);
  closeButton.addEventListener("click", () => {
    clearTimeout(timerId);
    dismiss(snackbar);
  });

  host.append(snackbar);

  const active = [...host.children].filter((child) => !child.classList.contains("is-leaving"));
  const overflow = active.slice(0, Math.max(0, active.length - MAX_VISIBLE));
  for (const extra of overflow) {
    if (extra instanceof HTMLElement) {
      dismiss(extra);
    }
  }
}
