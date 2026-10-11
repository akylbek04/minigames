import { afterEach } from "vitest";

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
  for (const [target, ...args] of addedListeners.splice(0)) {
    target.removeEventListener(...args);
  }
  document.body.replaceChildren();
  localStorage.clear();
  history.replaceState(undefined, "", "/");
});
