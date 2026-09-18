export function icon(markup: string, className = "icon"): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = className;
  span.setAttribute("aria-hidden", "true");
  span.innerHTML = markup;
  return span;
}
