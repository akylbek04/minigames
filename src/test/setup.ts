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
Element.prototype.matches = function matches(this: Element, selector: string): boolean {
  if (selector === ":popover-open") {
    return this.hasAttribute(POPOVER_OPEN_ATTR);
  }
  if (selector === ":modal") {
    return this instanceof HTMLDialogElement && this.open;
  }
  return nativeMatches.call(this, selector);
};

afterEach(() => {
  document.body.replaceChildren();
  localStorage.clear();
  history.replaceState(undefined, "", "/");
});
