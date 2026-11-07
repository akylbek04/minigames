import { cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach } from "vitest";
import { clearSnackbars } from "../hooks/snackbar-store";

// user-event patches input value setters the first time it is used. Doing it
// before any React input renders keeps React's own value tracking intact in
// every later test; otherwise typing only works in the first test of a file.
userEvent.setup();

// happy-dom has no Popover API and no :modal / :popover-open matching, which
// the snackbar and sort menu rely on. These stand-ins keep the same contract:
// an open popover or modal dialog matches its pseudo-class.
const POPOVER_OPEN_ATTR = "data-test-popover-open";

function setPopoverOpen(element: HTMLElement, isOpen: boolean): void {
  element.toggleAttribute(POPOVER_OPEN_ATTR, isOpen);
  element.dispatchEvent(new Event("toggle"));
}

Object.assign(HTMLElement.prototype, {
  showPopover(this: HTMLElement) {
    setPopoverOpen(this, true);
  },
  hidePopover(this: HTMLElement) {
    setPopoverOpen(this, false);
  },
  togglePopover(this: HTMLElement) {
    setPopoverOpen(this, !this.hasAttribute(POPOVER_OPEN_ATTR));
  },
});

const nativeMatches = Element.prototype.matches;
Element.prototype.matches = function (this: Element, selector: string): boolean {
  if (selector === ":popover-open") {
    return this.hasAttribute(POPOVER_OPEN_ATTR);
  }
  return selector === ":modal"
    ? this instanceof HTMLDialogElement && this.open
    : nativeMatches.call(this, selector);
} as Element["matches"];

// Each test mounts its own app; listeners an earlier app left on window or
// document would otherwise keep reacting (popstate, visibilitychange).
type ListenerArgs = Parameters<EventTarget["addEventListener"]>;
const addedListeners: [EventTarget, ...ListenerArgs][] = [];

const listenerTargets: EventTarget[] = [globalThis, document];
for (const target of listenerTargets) {
  const addEventListener = target.addEventListener.bind(target);
  target.addEventListener = (...args: ListenerArgs) => {
    addedListeners.push([target, ...args]);
    addEventListener(...args);
  };
}

afterEach(() => {
  // Unmount React trees first; the globals-less vitest skips its auto-cleanup.
  cleanup();
  clearSnackbars();
  for (const [target, ...args] of addedListeners.splice(0)) {
    target.removeEventListener(...args);
  }
  document.body.replaceChildren();
  localStorage.clear();
  history.replaceState(undefined, "", "/");
});
