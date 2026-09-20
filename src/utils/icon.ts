export function icon(markup: string, className = "icon"): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = className;
  span.setAttribute("aria-hidden", "true");
  span.innerHTML = markup;
  return span;
}

export function materialIcon(name: string, className = ""): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = `material-symbols-outlined ${className}`.trim();
  span.setAttribute("aria-hidden", "true");
  span.textContent = name;
  return span;
}
