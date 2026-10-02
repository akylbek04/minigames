import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import { navigateTo } from "../../router/router";
import type { AppPage } from "../app-page";
import "./not-found-page.scss";

// A malformed escape such as "/%E0%A4%A" makes decodeURI throw, and an
// invalid deep link must still render this page.
function readablePath(pathname: string): string {
  try {
    return decodeURI(pathname);
  } catch {
    return pathname;
  }
}

// Shown for any path the router doesn't know; the header and footer stay.
export function createNotFoundPage(): AppPage {
  const requestedPath = el("code", { class: "not-found-page__path" });

  const homeButton = el("button", { type: "button", class: "btn btn--filled btn--large" }, [
    materialIcon("home"),
    "Return to Home Page",
  ]);
  homeButton.addEventListener("click", () => navigateTo("/"));

  const element = el("main", { class: "not-found-page" }, [
    el("div", { class: "not-found-page__inner" }, [
      el("p", { class: "not-found-page__code", "aria-hidden": "true" }, ["404"]),
      el("h1", { class: "not-found-page__title" }, ["Page not found"]),
      el("p", { class: "not-found-page__message" }, [
        "The page ",
        requestedPath,
        " doesn't exist or has been moved.",
      ]),
      homeButton,
    ]),
  ]);

  return {
    element,
    show: () => {
      requestedPath.textContent = readablePath(location.pathname);
    },
  };
}
