import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  dismissSnackbar,
  removeSnackbar,
  useSnackbars,
  type SnackbarItem,
  type SnackbarVariant,
} from "../../hooks/snackbar-store";
import { MaterialIcon } from "../icons/MaterialIcon";
import "./snackbar.scss";

const ICONS: Record<SnackbarVariant, string> = {
  success: "check_circle",
  error: "error",
  warning: "warning",
  info: "info",
};

// A modal dialog makes everything outside it inert, so while one is open the
// region lives inside it. As a popover it stays in the top layer either way:
// drawn above the dialog and positioned against the viewport.
function getHost(): HTMLElement {
  const openModals = [...document.querySelectorAll("dialog")].filter(
    (dialog) => dialog.matches(":modal") && !dialog.classList.contains("is-closing"),
  );
  return openModals.at(-1) ?? document.body;
}

function SnackbarView({ id, message, variant, isLeaving }: SnackbarItem) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLeaving) {
      return;
    }
    let isCurrent = true;
    // getAnimations() flushes styles, so the exit transition is already
    // running (or absent, with reduced motion) by the time we wait on it.
    const animations = ref.current?.getAnimations() ?? [];
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (isCurrent) {
        removeSnackbar(id);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [id, isLeaving]);

  return (
    <div
      ref={ref}
      className={`snackbar snackbar--${variant}${isLeaving ? " is-leaving" : ""}`}
      role={variant === "error" ? "alert" : "status"}
    >
      <MaterialIcon name={ICONS[variant]} className="snackbar__icon" />
      <p className="snackbar__message">{message}</p>
      <button
        type="button"
        className="snackbar__close"
        aria-label="Dismiss notification"
        onClick={() => dismissSnackbar(id)}
      >
        <MaterialIcon name="close" />
      </button>
    </div>
  );
}

function createRegion(): HTMLElement {
  const region = document.createElement("div");
  region.className = "snackbar-region";
  region.setAttribute("popover", "manual");
  return region;
}

// Mount once at the app root. Non-blocking: it never steals focus. The items
// render through a portal into a container that moves between the page and
// open dialogs; React keeps handling their events wherever it is.
export function SnackbarRegion() {
  const items = useSnackbars();
  const [region] = useState(createRegion);
  const newestId = items.at(-1)?.id;
  const hasItems = items.length > 0;

  // Re-showing moves the region above any dialog opened since. It only runs
  // for a new snackbar, so leaving ones keep playing their exit animation.
  useLayoutEffect(() => {
    if (!hasItems) {
      if (region.matches(":popover-open")) {
        region.hidePopover();
      }
      document.body.append(region);
      return;
    }
    const host = getHost();
    if (region.parentElement !== host) {
      host.append(region);
    }
    if (region.matches(":popover-open")) {
      region.hidePopover();
    }
    region.showPopover();
  }, [region, hasItems, newestId]);

  useEffect(() => () => region.remove(), [region]);

  return createPortal(
    items.map((item) => <SnackbarView key={item.id} {...item} />),
    region,
  );
}
