import { el } from "../../utils/dom";
import "./skeleton.scss";

// One shimmering placeholder block; its size comes from the caller's class.
export function createSkeleton(className = ""): HTMLSpanElement {
  return el("span", { class: `skeleton ${className}`.trim(), "aria-hidden": "true" });
}

// Wraps a section's placeholders so assistive tech hears one "Loading…"
// message instead of a pile of empty blocks.
export function createSkeletonGroup(
  label: string,
  children: Node[],
  className = "",
): HTMLDivElement {
  return el("div", { class: `skeleton-group ${className}`.trim(), role: "status" }, [
    el("span", { class: "visually-hidden" }, [label]),
    ...children,
  ]);
}
