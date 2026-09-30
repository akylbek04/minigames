import { el } from "../../utils/dom";
import { materialIcon } from "../../utils/icon";
import "./pagination.scss";

// Figma shows at most 4 page buttons from tablet up and 3 on mobile.
const MAX_VISIBLE_WIDE = 4;
const MAX_VISIBLE_MOBILE = 3;
const wideQuery = matchMedia("(min-width: 768px)");

// First page of a window of `size` pages that keeps `active` as centered as
// the ends allow.
export function visiblePageStart(active: number, total: number, size: number): number {
  const centered = active - Math.floor((size - 1) / 2);
  return Math.max(1, Math.min(centered, total - size + 1));
}

// Only the control's own state changes for now; switching the cards follows
// with the API in Story 3.
export function createPagination(totalPages: number): HTMLElement {
  let activePage = 1;

  const prevButton = el(
    "button",
    { type: "button", class: "pagination__button", "aria-label": "Previous page" },
    [materialIcon("chevron_left")],
  );
  const nextButton = el(
    "button",
    { type: "button", class: "pagination__button", "aria-label": "Next page" },
    [materialIcon("chevron_right")],
  );
  const pages = el("ul", { class: "pagination__pages" });

  function render(): void {
    const size = Math.min(totalPages, wideQuery.matches ? MAX_VISIBLE_WIDE : MAX_VISIBLE_MOBILE);
    const start = visiblePageStart(activePage, totalPages, size);

    pages.replaceChildren(
      ...Array.from({ length: size }, (_, index) => {
        const page = start + index;
        const button = el(
          "button",
          {
            type: "button",
            class: "pagination__button",
            "aria-label": `Page ${page}`,
            ...(page === activePage && { "aria-current": "page" }),
          },
          [String(page)],
        );
        button.addEventListener("click", () => goTo(page));
        return el("li", {}, [button]);
      }),
    );

    prevButton.disabled = activePage === 1;
    nextButton.disabled = activePage === totalPages;
  }

  function goTo(page: number): void {
    activePage = page;
    render();
  }

  prevButton.addEventListener("click", () => goTo(activePage - 1));
  nextButton.addEventListener("click", () => goTo(activePage + 1));
  wideQuery.addEventListener("change", render);

  render();

  return el("nav", { class: "pagination", "aria-label": "Library pages" }, [
    prevButton,
    pages,
    nextButton,
  ]);
}
