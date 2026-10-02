import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import "./error-banner.scss";

export interface ErrorBannerOptions {
  title?: string;
  message: string;
  onRetry: () => void;
}

// Replaces a content area whose request failed on the network or server;
// the retry button re-dispatches that same request.
export function createErrorBanner({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorBannerOptions): HTMLElement {
  const retryButton = el(
    "button",
    { type: "button", class: "btn btn--filled error-banner__retry" },
    [materialIcon("refresh"), "Try again"],
  );
  retryButton.addEventListener("click", onRetry, { once: true });

  return el("div", { class: "error-banner", role: "alert" }, [
    materialIcon("cloud_off", "error-banner__icon"),
    el("div", { class: "error-banner__text" }, [
      el("p", { class: "error-banner__title" }, [title]),
      el("p", { class: "error-banner__message" }, [message]),
    ]),
    retryButton,
  ]);
}
